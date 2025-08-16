"""
邮件服务模块
提供统一的邮件发送和邮箱验证服务
"""

import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.http import HttpRequest

from .models import EmailVerification

User = get_user_model()
logger = logging.getLogger(__name__)


class EmailServiceError(Exception):
    """邮件服务异常基类"""
    pass


class RateLimitExceeded(EmailServiceError):
    """频率限制异常"""
    pass


class EmailService:
    """
    邮件服务类
    提供邮箱验证、密码重置等邮件发送功能
    """
    
    # 频率限制配置
    RATE_LIMIT_CONFIG = {
        'registration': {'limit': 3, 'window': 300},  # 5分钟内最多3次
        'email_change': {'limit': 2, 'window': 600},  # 10分钟内最多2次
        'password_reset': {'limit': 5, 'window': 3600},  # 1小时内最多5次
        'reactivation': {'limit': 2, 'window': 300},  # 5分钟内最多2次
    }
    
    @classmethod
    def create_verification_token(
        cls,
        user: User,
        email: str,
        verification_type: str = 'registration',
        request: Optional[HttpRequest] = None
    ) -> EmailVerification:
        """
        创建邮箱验证令牌
        
        Args:
            user: 用户对象
            email: 待验证邮箱
            verification_type: 验证类型
            request: HTTP请求对象（用于获取IP和User-Agent）
            
        Returns:
            EmailVerification: 验证令牌对象
            
        Raises:
            RateLimitExceeded: 当超过频率限制时
        """
        # 检查频率限制
        cls._check_rate_limit(user, verification_type)
        
        # 清理该用户同类型的旧令牌
        EmailVerification.objects.filter(
            user=user,
            verification_type=verification_type,
            is_used=False
        ).delete()
        
        # 获取请求信息
        ip_address = None
        user_agent = None
        if request:
            ip_address = cls._get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # 创建新验证令牌
        verification = EmailVerification.objects.create(
            user=user,
            email=email,
            verification_type=verification_type,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        logger.info(
            f"Created verification token for user {user.email}, "
            f"type: {verification_type}, token: {verification.token[:16]}..."
        )
        
        return verification
    
    @classmethod
    def send_verification_email(
        cls,
        verification: EmailVerification,
        language: str = 'en'
    ) -> bool:
        """
        发送验证邮件
        
        Args:
            verification: 验证令牌对象
            language: 邮件语言
            
        Returns:
            bool: 发送成功返回True，失败返回False
        """
        try:
            # 构建验证链接
            verification_url = cls._build_verification_url(verification.token, verification.verification_type)
            
            # 计算过期时间（小时）
            expires_hours = {
                'registration': 24,
                'email_change': 24,  
                'reactivation': 24,
                'password_reset': 2,
            }.get(verification.verification_type, 24)
            
            # 准备邮件上下文
            context = {
                'user': verification.user,
                'user_name': verification.user.name or verification.user.email.split('@')[0],
                'verification_url': verification_url,
                'verification_type': verification.get_verification_type_display(),
                'expires_hours': expires_hours,
                'expires_at': verification.expires_at,
                'site_name': 'AirNest',
                'site_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:3000'),
                'support_email': getattr(settings, 'SUPPORT_EMAIL', 'support@airnest.me'),
                'current_year': datetime.now().year
            }
            
            # 选择邮件模板和主题
            template_name, subject = cls._get_email_template_and_subject(
                verification.verification_type, language
            )
            
            # 渲染邮件内容
            html_message = render_to_string(template_name, context)
            text_message = cls._generate_text_message(context, verification.verification_type)
            
            # 发送邮件
            result = send_mail(
                subject=subject,
                message=text_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[verification.email],
                html_message=html_message,
                fail_silently=False
            )
            
            if result == 1:
                logger.info(
                    f"Verification email sent successfully to {verification.email}, "
                    f"type: {verification.verification_type}"
                )
                return True
            else:
                logger.error(
                    f"Failed to send verification email to {verification.email}, "
                    f"send_mail returned {result}"
                )
                return False
                
        except Exception as e:
            logger.error(
                f"Error sending verification email to {verification.email}: {e}",
                exc_info=True
            )
            return False
    
    @classmethod
    def verify_email_token(cls, token: str) -> tuple[bool, str, Optional[User]]:
        """
        验证邮箱令牌
        
        Args:
            token: 验证令牌
            
        Returns:
            tuple: (成功状态, 消息, 用户对象)
        """
        try:
            verification = EmailVerification.objects.get(token=token)
        except EmailVerification.DoesNotExist:
            return False, "验证链接无效", None
        
        # 检查令牌是否已使用
        if verification.is_used:
            # 如果token已使用但用户确实已验证，返回成功状态
            user = verification.user
            if user.email_verified:
                return True, "您的邮箱已经验证成功", user
            else:
                return False, "验证链接已使用", None
        
        # 检查令牌是否过期
        if verification.is_expired():
            return False, "验证链接已过期，请重新请求验证邮件", None
        
        # 执行验证逻辑
        user = verification.user
        
        if verification.verification_type == 'registration':
            # 注册验证
            user.email = verification.email
            user.email_verified = True
            user.email_verified_at = timezone.now()
            user.save()
            
        elif verification.verification_type == 'email_change':
            # 邮箱更改验证
            user.email = verification.email
            user.email_verified = True
            user.email_verified_at = timezone.now()
            user.save()
            
        elif verification.verification_type == 'reactivation':
            # 重新激活验证
            user.email_verified = True
            user.email_verified_at = timezone.now()
            user.is_active = True
            user.save()
        
        # 标记令牌为已使用
        verification.mark_as_used()
        
        logger.info(
            f"Email verification successful for user {user.email}, "
            f"type: {verification.verification_type}"
        )
        
        return True, "邮箱验证成功", user
    
    @classmethod
    def resend_verification_email(
        cls,
        user: User,
        verification_type: str = 'registration',
        request: Optional[HttpRequest] = None,
        language: str = 'en'
    ) -> tuple[bool, str]:
        """
        重新发送验证邮件
        
        Args:
            user: 用户对象
            verification_type: 验证类型
            request: HTTP请求对象
            language: 邮件语言
            
        Returns:
            tuple: (成功状态, 消息)
        """
        try:
            # 检查用户是否已经验证
            if user.email_verified and verification_type == 'registration':
                return False, "邮箱已经验证过了"
            
            # 创建新的验证令牌
            verification = cls.create_verification_token(
                user=user,
                email=user.email,
                verification_type=verification_type,
                request=request
            )
            
            # 发送验证邮件
            success = cls.send_verification_email(verification, language)
            
            if success:
                return True, "验证邮件已发送，请检查您的邮箱"
            else:
                return False, "邮件发送失败，请稍后重试"
                
        except RateLimitExceeded as e:
            return False, str(e)
        except Exception as e:
            logger.error(f"Error resending verification email: {e}", exc_info=True)
            return False, "系统错误，请稍后重试"
    
    @classmethod
    def _check_rate_limit(cls, user: User, verification_type: str):
        """检查频率限制"""
        config = cls.RATE_LIMIT_CONFIG.get(verification_type, {'limit': 3, 'window': 300})
        cache_key = f"email_rate_limit:{user.id}:{verification_type}"
        
        # 获取当前计数
        current_count = cache.get(cache_key, 0)
        
        if current_count >= config['limit']:
            raise RateLimitExceeded(
                f"发送太频繁，请在 {config['window'] // 60} 分钟后重试"
            )
        
        # 增加计数
        cache.set(cache_key, current_count + 1, config['window'])
    
    @classmethod
    def _get_client_ip(cls, request: HttpRequest) -> str:
        """获取客户端IP地址"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    @classmethod
    def _build_verification_url(cls, token: str, verification_type: str = 'registration') -> str:
        """构建验证链接"""
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        
        if verification_type == 'password_reset':
            return f"{frontend_url}/reset-password?token={token}"
        else:
            return f"{frontend_url}/verify-email?token={token}"
    
    @classmethod
    def _get_email_template_and_subject(cls, verification_type: str, language: str) -> tuple[str, str]:
        """获取邮件模板和主题"""
        templates = {
            'registration': {
                'template': 'emails/verify_registration.html',
                'subject': '🎉 Verify your AirNest account'
            },
            'email_change': {
                'template': 'emails/verify_email_change.html',
                'subject': '📧 Verify your new email address'
            },
            'password_reset': {
                'template': 'emails/password_reset.html',
                'subject': '🔐 Reset your AirNest password'
            },
            'reactivation': {
                'template': 'emails/verify_reactivation.html',
                'subject': '🔄 Reactivate your AirNest account'
            }
        }
        
        template_config = templates.get(verification_type, templates['registration'])
        return template_config['template'], template_config['subject']
    
    @classmethod
    def _generate_text_message(cls, context: Dict[str, Any], verification_type: str) -> str:
        """生成纯文本邮件内容"""
        user_name = context['user_name']
        verification_url = context['verification_url']
        site_name = context['site_name']
        expires_hours = context['expires_hours']
        
        text_templates = {
            'registration': f"""
Dear {user_name},

Thank you for registering with {site_name}!

Please click the following link to verify your email address:
{verification_url}

This link will expire in {expires_hours} hours.

If you did not create a {site_name} account, please ignore this email.

Best regards,
The {site_name} Team
            """.strip(),
            
            'email_change': f"""
Dear {user_name},

You have requested to change the email address for your {site_name} account.

Please click the following link to verify your new email address:
{verification_url}

This link will expire in {expires_hours} hours.

If you did not make this request, please contact our customer support immediately.

Best regards,
The {site_name} Team
            """.strip(),
            
            'password_reset': f"""
Dear {user_name},

We received a request to reset the password for your {site_name} account.

Please click the following link to set a new password:
{verification_url}

This link will expire in {expires_hours} hours.

Security reminders:
- If you did not request a password reset, please ignore this email
- Never share this link with anyone
- We will never ask you for your password information

If you have any questions, please contact our customer support team.

Best regards,
The {site_name} Team
            """.strip()
        }
        
        return text_templates.get(verification_type, text_templates['registration'])
    
    @classmethod
    def cleanup_expired_tokens(cls) -> int:
        """清理过期的验证令牌"""
        return EmailVerification.cleanup_expired_tokens()
    
    @classmethod
    def send_password_reset_email(
        cls,
        email: str,
        language: str = 'zh',
        request: Optional[HttpRequest] = None
    ) -> tuple[bool, str]:
        """
        发送密码重置邮件
        
        Args:
            email: 用户邮箱
            language: 邮件语言
            request: HTTP请求对象
            
        Returns:
            tuple[bool, str]: (是否成功, 消息)
        """
        try:
            # 检查用户是否存在，但不暴露结果
            try:
                user = User.objects.get(email=email, is_active=True)
                user_exists = True
            except User.DoesNotExist:
                user_exists = False
                user = None
            
            # 检查频率限制（基于邮箱）
            if user:
                cls._check_password_reset_rate_limit(user, request)
            
            # 无论用户是否存在，都返回相同的响应（安全考虑）
            success_message = "如果该邮箱已注册，您将收到密码重置邮件"
            
            # 只有用户存在时才真正发送邮件
            if user_exists and user:
                # 生成密码重置token
                verification = cls.create_verification_token(
                    user=user,
                    email=user.email,
                    verification_type='password_reset',
                    request=request
                )
                
                # 发送重置邮件
                email_sent = cls.send_verification_email(verification, language)
                
                if not email_sent:
                    logger.error(f"Failed to send password reset email to {email}")
                
                logger.info(f"Password reset email requested for {email}")
            else:
                logger.info(f"Password reset requested for non-existent email: {email}")
            
            return True, success_message
            
        except RateLimitExceeded as e:
            return False, str(e)
        except Exception as e:
            logger.error(f"Error sending password reset email: {e}", exc_info=True)
            return False, "系统错误，请稍后重试"
    
    @classmethod
    def verify_password_reset_token(cls, token: str) -> tuple[bool, str, Optional[User]]:
        """
        验证密码重置token
        
        Args:
            token: 重置token
            
        Returns:
            tuple[bool, str, Optional[User]]: (是否有效, 消息, 用户对象)
        """
        try:
            verification = EmailVerification.objects.get(
                token=token,
                verification_type='password_reset',
                is_used=False
            )
            
            if verification.is_expired():
                return False, "重置链接已过期，请重新申请", None
            
            return True, "Token有效", verification.user
            
        except EmailVerification.DoesNotExist:
            return False, "无效的重置链接", None
        except Exception as e:
            logger.error(f"Error verifying password reset token: {e}", exc_info=True)
            return False, "系统错误，请稍后重试", None
    
    @classmethod
    def reset_password(
        cls,
        token: str,
        new_password: str
    ) -> tuple[bool, str, Optional[User]]:
        """
        重置用户密码
        
        Args:
            token: 重置token
            new_password: 新密码
            
        Returns:
            tuple[bool, str, Optional[User]]: (是否成功, 消息, 用户对象)
        """
        try:
            # 验证token
            is_valid, message, user = cls.verify_password_reset_token(token)
            if not is_valid:
                return False, message, None
            
            # 检查新密码强度
            cls._validate_password_strength(new_password)
            
            # 检查新密码是否与当前密码相同
            if user.check_password(new_password):
                return False, "新密码不能与当前密码相同", None
            
            # 更新密码
            user.set_password(new_password)
            user.save()
            
            # 标记token为已使用
            verification = EmailVerification.objects.get(token=token)
            verification.is_used = True
            verification.used_at = timezone.now()
            verification.save()
            
            logger.info(f"Password reset successful for user {user.email}")
            return True, "密码重置成功", user
            
        except ValueError as e:
            return False, str(e), None
        except Exception as e:
            logger.error(f"Error resetting password: {e}", exc_info=True)
            return False, "系统错误，请稍后重试", None
    
    @classmethod
    def _check_password_reset_rate_limit(cls, user: User, request: Optional[HttpRequest]):
        """检查密码重置频率限制"""
        # 基于用户的频率限制
        user_cache_key = f"password_reset_user:{user.id}"
        user_count = cache.get(user_cache_key, 0)
        if user_count >= 3:  # 15分钟内最多3次
            raise RateLimitExceeded("重置请求过于频繁，请15分钟后重试")
        cache.set(user_cache_key, user_count + 1, 900)  # 15分钟
        
        # 基于IP的频率限制
        if request:
            ip = cls._get_client_ip(request)
            ip_cache_key = f"password_reset_ip:{ip}"
            ip_count = cache.get(ip_cache_key, 0)
            if ip_count >= 10:  # 1小时内最多10次
                raise RateLimitExceeded("请求过于频繁，请1小时后重试")
            cache.set(ip_cache_key, ip_count + 1, 3600)  # 1小时
    
    @classmethod
    def _validate_password_strength(cls, password: str):
        """验证密码强度"""
        if len(password) < 8:
            raise ValueError("密码长度不能少于8位")
        
        if not any(c.islower() for c in password):
            raise ValueError("密码必须包含至少一个小写字母")
        
        if not any(c.isupper() for c in password):
            raise ValueError("密码必须包含至少一个大写字母")
        
        if not any(c.isdigit() for c in password):
            raise ValueError("密码必须包含至少一个数字")
    
