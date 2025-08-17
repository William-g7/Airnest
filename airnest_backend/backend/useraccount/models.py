import uuid
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, UserManager
from django.db import models
from django.utils import timezone
from .utils import avatar_upload_path


class CustomUserManager(UserManager):
    def _create_user(self, name, email, password, **extra_fields):
        if not email:
            raise ValueError("You have not specified a valid e-mail address")
    
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, **extra_fields)
        user.set_password(password)
        user.save(using=self.db)

        return user

    def create_user(self, name=None, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(name, email, password, **extra_fields)
    
    def create_superuser(self, name=None, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self._create_user(name, email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    avatar = models.ImageField(upload_to=avatar_upload_path, blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(blank=True, null=True)
    
    # Email verification fields
    email_verified = models.BooleanField(default=False, help_text="邮箱是否已验证")
    email_verified_at = models.DateTimeField(blank=True, null=True, help_text="邮箱验证时间")

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    EMAIL_FIELD = 'email'
    REQUIRED_FIELDS = ['name',]

    def avatar_url(self):
        """获取头像完整URL，兼容本地存储和R2存储"""
        if not self.avatar:
            return ''
            
        # 如果已经是完整URL（R2存储），直接返回
        if self.avatar.url.startswith(('http://', 'https://')):
            return self.avatar.url
        # 如果是相对路径（本地存储），拼接WEBSITE_URL
        else:
            return f'{settings.WEBSITE_URL}{self.avatar.url}'
    
    @property
    def landlord_average_rating(self):
        """计算房东平均评分（基于所有房源的评论）"""
        # 动态导入避免循环导入
        from property.models import PropertyReview
        
        reviews = PropertyReview.objects.filter(
            property_ref__landlord=self,
            is_hidden=False
        )
        
        if not reviews.exists():
            return 0
        
        return round(sum(review.rating for review in reviews) / reviews.count(), 1)
    
    @property
    def total_landlord_reviews(self):
        """获取房东总评论数"""
        from property.models import PropertyReview
        
        return PropertyReview.objects.filter(
            property_ref__landlord=self,
            is_hidden=False
        ).count()
    
    @property
    def response_rate(self):
        """计算回复率（这里暂时返回固定值，可以后续基于消息系统计算）"""
        # 这个可以基于chat系统来计算，暂时返回固定值
        return 95  # 假设95%回复率
    
    @property
    def is_super_host(self):
        """判断是否为超级房东"""
        return (
            self.landlord_average_rating >= 4.5 and
            self.total_landlord_reviews >= 5 and
            self.response_rate >= 90
        )
    
    def __str__(self):
        return f"{self.email} ({'verified' if self.email_verified else 'unverified'})"


class EmailVerification(models.Model):
    """邮箱验证模型"""
    
    VERIFICATION_TYPES = [
        ('registration', '注册验证'),
        ('email_change', '邮箱更改'),
        ('reactivation', '重新激活'),
        ('password_reset', '密码重置'),
    ]
    
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='email_verifications',
        help_text="关联用户"
    )
    token = models.CharField(
        max_length=64, 
        unique=True, 
        help_text="验证令牌",
        db_index=True
    )
    email = models.EmailField(help_text="待验证邮箱")
    created_at = models.DateTimeField(auto_now_add=True, help_text="创建时间")
    expires_at = models.DateTimeField(help_text="过期时间")
    is_used = models.BooleanField(default=False, help_text="是否已使用")
    used_at = models.DateTimeField(blank=True, null=True, help_text="使用时间")
    verification_type = models.CharField(
        max_length=20,
        choices=VERIFICATION_TYPES,
        default='registration',
        help_text="验证类型"
    )
    ip_address = models.GenericIPAddressField(
        blank=True, 
        null=True, 
        help_text="请求IP地址"
    )
    user_agent = models.TextField(
        blank=True, 
        null=True, 
        help_text="用户代理信息"
    )
    
    class Meta:
        verbose_name = "邮箱验证"
        verbose_name_plural = "邮箱验证"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['email', 'is_used']),
            models.Index(fields=['user', 'verification_type']),
            models.Index(fields=['expires_at']),
        ]
    
    def save(self, *args, **kwargs):
        """保存时自动生成token和过期时间"""
        if not self.token:
            self.token = self.generate_token()
        if not self.expires_at:
            # 根据验证类型设置不同的过期时间
            expiry_hours = {
                'registration': 24,      # 注册验证：24小时
                'email_change': 24,      # 邮箱更改：24小时  
                'reactivation': 24,      # 重新激活：24小时
                'password_reset': 2,     # 密码重置：2小时（更安全）
            }
            hours = expiry_hours.get(self.verification_type, 24)
            self.expires_at = timezone.now() + timedelta(hours=hours)
        super().save(*args, **kwargs)
    
    @staticmethod
    def generate_token():
        """生成安全的验证令牌"""
        return secrets.token_urlsafe(32)
    
    def is_expired(self):
        """检查令牌是否过期"""
        return timezone.now() > self.expires_at
    
    def is_valid(self):
        """检查令牌是否有效（未使用且未过期）"""
        return not self.is_used and not self.is_expired()
    
    def mark_as_used(self):
        """标记令牌为已使用"""
        self.is_used = True
        self.used_at = timezone.now()
        self.save()
    
    def __str__(self):
        status = "已使用" if self.is_used else ("已过期" if self.is_expired() else "有效")
        return f"{self.email} - {self.get_verification_type_display()} - {status}"
    
    @classmethod
    def cleanup_expired_tokens(cls):
        """清理过期的验证令牌"""
        expired_count = cls.objects.filter(
            expires_at__lt=timezone.now(),
            is_used=False
        ).count()
        
        cls.objects.filter(
            expires_at__lt=timezone.now(),
            is_used=False
        ).delete()
        
        return expired_count