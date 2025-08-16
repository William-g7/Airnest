"""
Cloudflare Turnstile验证工具
"""
import requests
import logging
from django.conf import settings
import json

logger = logging.getLogger(__name__)

TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

def verify_turnstile_token(token: str, remote_ip: str = None) -> tuple[bool, str]:
    """
    验证Turnstile token
    
    Args:
        token: 前端传来的Turnstile token
        remote_ip: 客户端IP地址（可选）
    
    Returns:
        tuple[bool, str]: (验证是否成功, 错误信息或成功信息)
    """
    if not token:
        logger.warning("Turnstile token为空")
        return False, "Token不能为空"
    
    secret_key = getattr(settings, 'TURNSTILE_SECRET_KEY', None)
    if not secret_key:
        logger.error("TURNSTILE_SECRET_KEY未配置")
        return False, "服务器配置错误"
    
    try:
        # 构建验证请求
        data = {
            'secret': secret_key,
            'response': token,
        }
        
        # 如果有IP地址，包含在验证请求中
        if remote_ip:
            data['remoteip'] = remote_ip
        
        logger.info(f"发送Turnstile验证请求，token前缀: {token[:20]}...")
        
        # 发送验证请求
        response = requests.post(
            TURNSTILE_VERIFY_URL,
            data=data,
            timeout=10,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        
        if response.status_code != 200:
            logger.error(f"Turnstile API响应状态码异常: {response.status_code}")
            return False, "验证服务暂时不可用"
        
        result = response.json()
        logger.info(f"Turnstile API响应: {json.dumps(result, indent=2)}")
        
        # 检查验证结果
        if result.get('success'):
            logger.info("Turnstile验证成功")
            return True, "验证成功"
        else:
            # 记录错误信息
            error_codes = result.get('error-codes', [])
            logger.warning(f"Turnstile验证失败，错误代码: {error_codes}")
            
            # 提供友好的错误提示
            if 'timeout-or-duplicate' in error_codes:
                return False, "验证已过期或重复使用"
            elif 'invalid-input-secret' in error_codes:
                return False, "服务器配置错误"
            elif 'invalid-input-response' in error_codes:
                return False, "验证令牌无效"
            elif 'bad-request' in error_codes:
                return False, "验证请求格式错误"
            else:
                return False, f"验证失败: {', '.join(error_codes)}"
                
    except requests.exceptions.Timeout:
        logger.error("Turnstile验证请求超时")
        return False, "验证服务超时，请重试"
    
    except requests.exceptions.RequestException as e:
        logger.error(f"Turnstile验证请求失败: {str(e)}")
        return False, "网络错误，请重试"
    
    except json.JSONDecodeError as e:
        logger.error(f"Turnstile API响应JSON解析失败: {str(e)}")
        return False, "验证服务响应格式错误"
    
    except Exception as e:
        logger.error(f"Turnstile验证未知错误: {str(e)}")
        return False, "验证过程中发生未知错误"

def get_client_ip(request) -> str:
    """
    获取客户端真实IP地址
    考虑代理和负载均衡器的X-Forwarded-For头
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # 取第一个IP（客户端真实IP）
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    
    return ip or '127.0.0.1'

def turnstile_required(view_func):
    """
    装饰器：要求请求包含有效的Turnstile token
    """
    def wrapper(request, *args, **kwargs):
        # 从请求中获取token
        if request.method == 'POST':
            try:
                if hasattr(request, 'data'):
                    token = request.data.get('turnstile_token')
                else:
                    import json
                    body = json.loads(request.body)
                    token = body.get('turnstile_token')
            except:
                token = None
        else:
            token = request.GET.get('turnstile_token')
        
        if not token:
            from django.http import JsonResponse
            return JsonResponse({
                'error': '缺少安全验证令牌',
                'code': 'missing_turnstile_token'
            }, status=400)
        
        # 验证token
        client_ip = get_client_ip(request)
        is_valid, message = verify_turnstile_token(token, client_ip)
        
        if not is_valid:
            from django.http import JsonResponse
            return JsonResponse({
                'error': f'安全验证失败: {message}',
                'code': 'invalid_turnstile_token'
            }, status=400)
        
        # 验证通过，继续处理请求
        return view_func(request, *args, **kwargs)
    
    return wrapper