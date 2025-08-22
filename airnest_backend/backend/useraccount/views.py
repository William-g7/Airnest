"""
自定义认证视图
"""
from dj_rest_auth.registration.views import RegisterView as BaseRegisterView
from dj_rest_auth.jwt_auth import get_refresh_view
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from urllib.parse import urlparse
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


class SecureTokenRefreshView(get_refresh_view()):
    """
    增强安全的令牌刷新视图，添加 Origin/Referer 验证
    """
    
    def get_allowed_origins(self):
        """获取允许的源域名列表"""
        # 从 CORS_ALLOWED_ORIGINS 和 CSRF_TRUSTED_ORIGINS 合并
        cors_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
        csrf_origins = getattr(settings, 'CSRF_TRUSTED_ORIGINS', [])
        
        # 合并并去重
        allowed_origins = set(cors_origins + csrf_origins)
        
        # 添加前端 URL 作为备选
        frontend_url = getattr(settings, 'FRONTEND_URL', '')
        if frontend_url:
            allowed_origins.add(frontend_url)
            
        return allowed_origins
    
    def validate_origin_and_referer(self, request):
        """验证 Origin 和 Referer 头"""
        allowed_origins = self.get_allowed_origins()
        
        # 获取 Origin 头
        origin = request.META.get('HTTP_ORIGIN')
        referer = request.META.get('HTTP_REFERER')
        
        # 至少需要有一个头存在
        if not origin and not referer:
            logger.warning(f"令牌刷新请求缺少 Origin 和 Referer 头，IP: {get_client_ip(request)}")
            return False, "缺少必要的安全头"
        
        # 验证 Origin
        if origin:
            if origin not in allowed_origins:
                logger.warning(f"令牌刷新请求的 Origin 不在允许列表中: {origin}, IP: {get_client_ip(request)}")
                return False, f"不允许的源域名: {origin}"
        
        # 验证 Referer（如果存在）
        if referer:
            try:
                referer_parsed = urlparse(referer)
                referer_origin = f"{referer_parsed.scheme}://{referer_parsed.netloc}"
                
                if referer_origin not in allowed_origins:
                    logger.warning(f"令牌刷新请求的 Referer 不在允许列表中: {referer_origin}, IP: {get_client_ip(request)}")
                    return False, f"不允许的引用域名: {referer_origin}"
            except Exception as e:
                logger.warning(f"解析 Referer 头失败: {referer}, 错误: {e}")
                return False, "无效的 Referer 头"
        
        # 如果有 Origin 和 Referer，确保它们一致
        if origin and referer:
            try:
                referer_parsed = urlparse(referer)
                referer_origin = f"{referer_parsed.scheme}://{referer_parsed.netloc}"
                
                if origin != referer_origin:
                    logger.warning(f"Origin 和 Referer 不匹配: Origin={origin}, Referer={referer_origin}")
                    return False, "Origin 和 Referer 不匹配"
            except Exception:
                # 如果 Referer 解析失败，只要 Origin 验证通过就可以
                pass
        
        return True, "验证通过"
    
    def post(self, request, *args, **kwargs):
        """重写 POST 方法，添加安全验证"""
        
        # 验证 Origin/Referer
        is_valid, message = self.validate_origin_and_referer(request)
        if not is_valid:
            return Response({
                'error': '安全验证失败',
                'detail': message,
                'code': 'invalid_origin_referer'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # 记录成功的刷新请求
        client_ip = get_client_ip(request)
        origin = request.META.get('HTTP_ORIGIN', 'N/A')
        logger.info(f"令牌刷新请求验证通过，IP: {client_ip}, Origin: {origin}")
        
        # 调用父类的刷新逻辑
        return super().post(request, *args, **kwargs)
