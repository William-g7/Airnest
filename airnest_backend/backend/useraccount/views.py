"""
自定义认证视图
"""
from dj_rest_auth.registration.views import RegisterView as BaseRegisterView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import logging
from .turnstile import verify_turnstile_token, get_client_ip

logger = logging.getLogger(__name__)

class TurnstileRegisterView(BaseRegisterView):
    """
    集成Turnstile验证的用户注册视图
    """
    
    def create(self, request, *args, **kwargs):
        """
        重写注册逻辑，添加Turnstile验证
        """
        # 检查是否启用了Turnstile
        if not getattr(settings, 'TURNSTILE_SECRET_KEY', None):
            logger.warning("TURNSTILE_SECRET_KEY未配置，跳过Turnstile验证")
            return super().create(request, *args, **kwargs)
        
        # 获取Turnstile token
        turnstile_token = request.data.get('turnstile_token')
        if not turnstile_token:
            logger.warning("注册请求缺少turnstile_token")
            return Response({
                'error': '请完成安全验证',
                'code': 'missing_turnstile_token'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 验证Turnstile token
        client_ip = get_client_ip(request)
        is_valid, message = verify_turnstile_token(turnstile_token, client_ip)
        
        if not is_valid:
            logger.warning(f"Turnstile验证失败: {message}, IP: {client_ip}")
            return Response({
                'error': f'安全验证失败: {message}',
                'code': 'invalid_turnstile_token'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"Turnstile验证成功，IP: {client_ip}, 开始用户注册")
        
        # Turnstile验证通过，继续正常的注册流程
        return super().create(request, *args, **kwargs)
