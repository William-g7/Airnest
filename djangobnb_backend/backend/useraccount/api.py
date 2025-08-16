from rest_framework.decorators import api_view, authentication_classes, permission_classes
from django.http import JsonResponse
from .models import User, EmailVerification
from .serializers import LandlordSerializer, UserSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
import os
import logging
from .utils import process_avatar_image
from .services import EmailService, RateLimitExceeded

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_detail(request, pk):
    user = get_object_or_404(User, pk=pk)
    
    if request.method == 'PATCH' and str(user.id) != str(request.user.id):
        return Response({'error': 'Not authorized'}, status=403)
    
    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            if 'avatar' in request.FILES:
                processed_image = process_avatar_image(user.id, request.FILES['avatar'])
                
                if user.avatar:
                    try:
                        if os.path.isfile(user.avatar.path):
                            os.remove(user.avatar.path)
                    except Exception as e:
                        print(f"Error removing old avatar: {e}")
                
                user.avatar = processed_image
            
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

@api_view(['GET'])
@authentication_classes([])
@permission_classes([])
def landlord_detail(request, pk):
    try:
        landlord = User.objects.get(pk=pk)
        serializer = LandlordSerializer(landlord)
        return JsonResponse(serializer.data, safe=False)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Landlord not found'}, status=404)


# ==================== 邮箱验证 API ====================

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def send_verification_email(request):
    """
    发送邮箱验证邮件
    支持注册验证、邮箱更改等类型
    """
    try:
        email = request.data.get('email', '').strip().lower()
        verification_type = request.data.get('verification_type', 'registration')
        language = request.data.get('language', 'en')
        
        # 验证必填字段
        if not email:
            return Response({
                'error': 'Email is required',
                'message': '请提供邮箱地址'
            }, status=400)
        
        # 验证邮箱格式
        try:
            validate_email(email)
        except ValidationError:
            return Response({
                'error': 'Invalid email format',
                'message': '邮箱格式不正确'
            }, status=400)
        
        # 验证验证类型
        valid_types = ['registration', 'email_change', 'reactivation']
        if verification_type not in valid_types:
            return Response({
                'error': 'Invalid verification type',
                'message': f'验证类型必须是: {", ".join(valid_types)}'
            }, status=400)
        
        # 查找用户
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            if verification_type == 'registration':
                return Response({
                    'error': 'User not found',
                    'message': '用户不存在，请先注册'
                }, status=404)
            else:
                return Response({
                    'error': 'User not found',
                    'message': '用户不存在'
                }, status=404)
        
        # 检查用户状态
        if verification_type == 'registration' and user.email_verified:
            return Response({
                'error': 'Email already verified',
                'message': '邮箱已经验证过了'
            }, status=400)
        
        # 创建验证令牌并发送邮件
        try:
            verification = EmailService.create_verification_token(
                user=user,
                email=email,
                verification_type=verification_type,
                request=request
            )
            
            success = EmailService.send_verification_email(verification, language)
            
            if success:
                logger.info(f"Verification email sent to {email}, type: {verification_type}")
                return Response({
                    'success': True,
                    'message': '验证邮件已发送，请检查您的邮箱',
                    'expires_at': verification.expires_at,
                    'verification_type': verification.get_verification_type_display()
                })
            else:
                return Response({
                    'error': 'Email send failed',
                    'message': '邮件发送失败，请稍后重试'
                }, status=500)
                
        except RateLimitExceeded as e:
            return Response({
                'error': 'Rate limit exceeded',
                'message': str(e)
            }, status=429)
            
    except Exception as e:
        logger.error(f"Error sending verification email: {e}", exc_info=True)
        return Response({
            'error': 'Internal server error',
            'message': '系统错误，请稍后重试'
        }, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email_token(request):
    """
    验证邮箱令牌
    """
    try:
        token = request.data.get('token', '').strip()
        
        if not token:
            return Response({
                'error': 'Token is required',
                'message': '请提供验证令牌'
            }, status=400)
        
        # 验证令牌
        success, message, user = EmailService.verify_email_token(token)
        
        if success:
            logger.info(f"Email verification successful for user {user.email}")
            return Response({
                'success': True,
                'message': message,
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'name': user.name,
                    'email_verified': user.email_verified,
                    'email_verified_at': user.email_verified_at
                }
            })
        else:
            return Response({
                'error': 'Verification failed',
                'message': message
            }, status=400)
            
    except Exception as e:
        logger.error(f"Error verifying email token: {e}", exc_info=True)
        return Response({
            'error': 'Internal server error',
            'message': '系统错误，请稍后重试'
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resend_verification_email(request):
    """
    重新发送验证邮件（需要登录）
    """
    try:
        user = request.user
        verification_type = request.data.get('verification_type', 'registration')
        language = request.data.get('language', 'en')
        
        # 重新发送验证邮件
        success, message = EmailService.resend_verification_email(
            user=user,
            verification_type=verification_type,
            request=request,
            language=language
        )
        
        if success:
            logger.info(f"Verification email resent to {user.email}, type: {verification_type}")
            return Response({
                'success': True,
                'message': message
            })
        else:
            return Response({
                'error': 'Resend failed',
                'message': message
            }, status=400)
            
    except Exception as e:
        logger.error(f"Error resending verification email: {e}", exc_info=True)
        return Response({
            'error': 'Internal server error',
            'message': '系统错误，请稍后重试'
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verification_status(request):
    """
    获取用户邮箱验证状态
    """
    try:
        user = request.user
        
        # 获取用户的验证记录
        pending_verifications = EmailVerification.objects.filter(
            user=user,
            is_used=False,
            expires_at__gt=timezone.now()
        ).order_by('-created_at')
        
        pending_data = []
        for verification in pending_verifications:
            pending_data.append({
                'verification_type': verification.verification_type,
                'verification_type_display': verification.get_verification_type_display(),
                'email': verification.email,
                'created_at': verification.created_at,
                'expires_at': verification.expires_at,
                'is_expired': verification.is_expired()
            })
        
        return Response({
            'user': {
                'id': str(user.id),
                'email': user.email,
                'email_verified': user.email_verified,
                'email_verified_at': user.email_verified_at,
            },
            'pending_verifications': pending_data,
            'has_pending_verifications': len(pending_data) > 0
        })
        
    except Exception as e:
        logger.error(f"Error getting verification status: {e}", exc_info=True)
        return Response({
            'error': 'Internal server error',
            'message': '系统错误，请稍后重试'
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_verification(request):
    """
    取消待处理的验证请求
    """
    try:
        user = request.user
        verification_type = request.data.get('verification_type')
        
        if not verification_type:
            return Response({
                'error': 'Verification type is required',
                'message': '请指定要取消的验证类型'
            }, status=400)
        
        # 删除用户的待处理验证记录
        deleted_count = EmailVerification.objects.filter(
            user=user,
            verification_type=verification_type,
            is_used=False
        ).delete()[0]
        
        if deleted_count > 0:
            logger.info(f"Cancelled {deleted_count} verification requests for user {user.email}, type: {verification_type}")
            return Response({
                'success': True,
                'message': f'已取消 {deleted_count} 个验证请求',
                'cancelled_count': deleted_count
            })
        else:
            return Response({
                'error': 'No pending verifications',
                'message': '没有找到待处理的验证请求'
            }, status=404)
            
    except Exception as e:
        logger.error(f"Error cancelling verification: {e}", exc_info=True)
        return Response({
            'error': 'Internal server error',
            'message': '系统错误，请稍后重试'
        }, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """
    忘记密码 - 发送密码重置邮件
    """
    try:
        email = request.data.get('email', '').lower().strip()
        language = request.data.get('language', 'zh')
        
        if not email:
            return Response({
                'error': 'Email is required',
                'message': '请输入邮箱地址'
            }, status=400)
        
        # 邮箱格式验证
        from django.core.validators import validate_email
        from django.core.exceptions import ValidationError
        try:
            validate_email(email)
        except ValidationError:
            return Response({
                'error': 'Invalid email format',
                'message': '邮箱格式不正确'
            }, status=400)
        
        # 发送密码重置邮件
        success, message = EmailService.send_password_reset_email(
            email=email,
            language=language,
            request=request
        )
        
        if success:
            return Response({
                'success': True,
                'message': message
            })
        else:
            return Response({
                'error': 'Failed to send reset email',
                'message': message
            }, status=400)
            
    except Exception as e:
        logger.error(f"Error in forgot_password: {e}", exc_info=True)
        return Response({
            'error': 'Internal server error',
            'message': '系统错误，请稍后重试'
        }, status=500)


@api_view(['POST'])  
@permission_classes([AllowAny])
def verify_reset_token(request):
    """
    验证密码重置token
    """
    try:
        token = request.data.get('token', '').strip()
        
        if not token:
            return Response({
                'error': 'Token is required',
                'message': '请提供重置令牌'
            }, status=400)
        
        # 验证token
        is_valid, message, user = EmailService.verify_password_reset_token(token)
        
        if is_valid:
            return Response({
                'success': True,
                'message': message,
                'user': {
                    'email': user.email,
                    'name': user.name
                }
            })
        else:
            return Response({
                'error': 'Invalid token',
                'message': message
            }, status=400)
            
    except Exception as e:
        logger.error(f"Error in verify_reset_token: {e}", exc_info=True)
        return Response({
            'error': 'Internal server error',
            'message': '系统错误，请稍后重试'
        }, status=500)


@api_view(['POST'])
@permission_classes([AllowAny]) 
def reset_password(request):
    """
    重置密码
    """
    try:
        token = request.data.get('token', '').strip()
        new_password = request.data.get('password', '')
        
        if not token:
            return Response({
                'error': 'Token is required',
                'message': '请提供重置令牌'
            }, status=400)
        
        if not new_password:
            return Response({
                'error': 'Password is required',
                'message': '请输入新密码'
            }, status=400)
        
        # 重置密码
        success, message, user = EmailService.reset_password(token, new_password)
        
        if success:
            return Response({
                'success': True,
                'message': message,
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'name': user.name
                }
            })
        else:
            return Response({
                'error': 'Reset failed',
                'message': message
            }, status=400)
            
    except Exception as e:
        logger.error(f"Error in reset_password: {e}", exc_info=True)
        return Response({
            'error': 'Internal server error',
            'message': '系统错误，请稍后重试'
        }, status=500)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    已登录用户修改密码
    """
    try:
        current_password = request.data.get('current_password', '')
        new_password = request.data.get('new_password', '')
        
        if not current_password:
            return Response({
                'error': 'Current password is required',
                'message': '请输入当前密码'
            }, status=400)
        
        if not new_password:
            return Response({
                'error': 'New password is required',
                'message': '请输入新密码'
            }, status=400)
        
        user = request.user
        
        # 验证当前密码
        if not user.check_password(current_password):
            return Response({
                'error': 'Invalid current password',
                'message': '当前密码不正确'
            }, status=400)
        
        # 验证新密码强度
        try:
            EmailService._validate_password_strength(new_password)
        except ValueError as e:
            return Response({
                'error': 'Invalid password',
                'message': str(e)
            }, status=400)
        
        # 检查新密码是否与当前密码相同
        if user.check_password(new_password):
            return Response({
                'error': 'Same password',
                'message': '新密码不能与当前密码相同'
            }, status=400)
        
        # 更新密码
        user.set_password(new_password)
        user.save()
        
        logger.info(f"Password changed successfully for user {user.email}")
        
        return Response({
            'success': True,
            'message': '密码修改成功'
        })
        
    except Exception as e:
        logger.error(f"Error in change_password: {e}", exc_info=True)
        return Response({
            'error': 'Internal server error',
            'message': '系统错误，请稍后重试'
        }, status=500)