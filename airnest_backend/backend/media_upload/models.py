"""
草稿房源与上传文件管理模型

提供草稿房源创建和文件关联管理
"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class DraftProperty(models.Model):
    """
    草稿房源模型
    
    允许用户逐步创建房源，支持多次保存和编辑
    """
    
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('complete', '完成'),
        ('published', '已发布'),
        ('deleted', '已删除'),
    ]
    
    # 基本信息
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='draft_properties')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # 房源基本信息
    title = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # 分类和类型
    category = models.CharField(max_length=255, blank=True)
    place_type = models.CharField(max_length=255, blank=True)
    
    # 基础配置
    bedrooms = models.IntegerField(null=True, blank=True)
    bathrooms = models.IntegerField(null=True, blank=True)
    guests = models.IntegerField(null=True, blank=True)
    beds = models.IntegerField(null=True, blank=True)
    
    # 位置信息
    country = models.CharField(max_length=255, blank=True)
    state = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=255, blank=True)
    address = models.CharField(max_length=255, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    timezone = models.CharField(max_length=50, default='UTC')
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # 完成状态跟踪
    basic_info_completed = models.BooleanField(default=False)
    location_completed = models.BooleanField(default=False)
    images_completed = models.BooleanField(default=False)
    pricing_completed = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['updated_at']),
        ]
    
    def __str__(self):
        return f"Draft: {self.title or 'Untitled'} ({self.user.email})"
    
    @property
    def completion_percentage(self):
        """计算完成百分比"""
        completed_sections = sum([
            self.basic_info_completed,
            self.location_completed,
            self.images_completed,
            self.pricing_completed,
        ])
        return (completed_sections / 4) * 100
    
    @property
    def is_ready_for_publish(self):
        """检查是否可以发布"""
        return (
            self.basic_info_completed and
            self.location_completed and
            self.images_completed and
            self.pricing_completed and
            self.title and
            self.description and
            self.price_per_night is not None
        )
    
    def update_completion_status(self):
        """根据字段内容更新完成状态"""
        # 基本信息完成检查
        self.basic_info_completed = bool(
            self.title and 
            self.description and 
            self.category and 
            self.place_type and
            self.bedrooms is not None and
            self.bathrooms is not None and
            self.guests is not None and
            self.beds is not None
        )
        
        # 位置信息完成检查
        self.location_completed = bool(
            self.country and
            self.city and
            self.address and
            self.postal_code
        )
        
        # 图片完成检查 (至少1张图片)
        self.images_completed = self.images.filter(is_active=True).exists()
        
        # 价格完成检查
        self.pricing_completed = self.price_per_night is not None
        
        self.save()
    
    @staticmethod
    def clean_expired_drafts(user, days=30):
        """清理过期的草稿 (静态方法)"""
        expiry_date = timezone.now() - timedelta(days=days)
        expired_drafts = DraftProperty.objects.filter(
            user=user,
            status='draft',
            updated_at__lt=expiry_date
        )
        expired_count = expired_drafts.count()
        expired_drafts.delete()
        return expired_count


class DraftPropertyImage(models.Model):
    """
    草稿房源图片模型
    
    关联草稿房源和R2存储的图片
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    draft_property = models.ForeignKey(DraftProperty, on_delete=models.CASCADE, related_name='images')
    
    # R2存储信息
    object_key = models.CharField(max_length=500, unique=True)  # R2对象键
    file_url = models.URLField(max_length=500)  # 公开访问URL
    file_size = models.BigIntegerField()  # 文件大小(字节)
    content_type = models.CharField(max_length=100)  # MIME类型
    etag = models.CharField(max_length=100, blank=True)  # R2 ETag
    
    # 显示信息
    order = models.IntegerField(default=0)  # 显示顺序
    is_main = models.BooleanField(default=False)  # 是否为主图
    is_active = models.BooleanField(default=True)  # 是否激活
    
    # 可选的图片描述
    alt_text = models.CharField(max_length=255, blank=True)
    
    # 时间戳
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'uploaded_at']
        indexes = [
            models.Index(fields=['draft_property', 'is_active']),
            models.Index(fields=['object_key']),
        ]
    
    def __str__(self):
        return f"Image for {self.draft_property.title or 'Untitled'} ({self.order})"
    
    def save(self, *args, **kwargs):
        # 如果设置为主图，取消其他图片的主图状态
        if self.is_main:
            DraftPropertyImage.objects.filter(
                draft_property=self.draft_property,
                is_main=True
            ).exclude(id=self.id).update(is_main=False)
        
        super().save(*args, **kwargs)
        
        # 更新草稿房源的图片完成状态
        self.draft_property.update_completion_status()
    
    def delete(self, *args, **kwargs):
        draft_property = self.draft_property
        super().delete(*args, **kwargs)
        
        # 如果删除的是主图，自动设置第一张激活图片为主图
        if self.is_main:
            first_active_image = DraftPropertyImage.objects.filter(
                draft_property=draft_property,
                is_active=True
            ).first()
            if first_active_image:
                first_active_image.is_main = True
                first_active_image.save()
        
        # 更新草稿房源的图片完成状态
        draft_property.update_completion_status()


class UploadSession(models.Model):
    """
    上传会话模型
    
    跟踪批量上传的状态和进度
    """
    
    STATUS_CHOICES = [
        ('pending', '等待上传'),
        ('uploading', '上传中'),
        ('completed', '已完成'),
        ('partial', '部分完成'),
        ('failed', '失败'),
        ('expired', '已过期'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='upload_sessions')
    draft_property = models.ForeignKey(
        DraftProperty, 
        on_delete=models.CASCADE, 
        related_name='upload_sessions',
        null=True, 
        blank=True
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # 上传统计
    total_files = models.IntegerField(default=0)
    uploaded_files = models.IntegerField(default=0)
    failed_files = models.IntegerField(default=0)
    
    # 时间信息
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()  # 会话过期时间
    
    # 可选的元数据
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"Upload Session {self.id} ({self.status})"
    
    @property
    def is_expired(self):
        """检查会话是否过期"""
        return timezone.now() > self.expires_at
    
    @property
    def upload_progress(self):
        """计算上传进度百分比"""
        if self.total_files == 0:
            return 0
        return (self.uploaded_files / self.total_files) * 100
    
    def save(self, *args, **kwargs):
        # 设置过期时间 (默认1小时)
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=1)
        
        super().save(*args, **kwargs)
    
    def update_status(self):
        """根据上传统计更新状态"""
        if self.uploaded_files == 0:
            self.status = 'pending'
        elif self.uploaded_files == self.total_files:
            self.status = 'completed'
        elif self.uploaded_files > 0:
            self.status = 'partial'
        elif self.failed_files == self.total_files:
            self.status = 'failed'
        else:
            self.status = 'uploading'
        
        self.save()
