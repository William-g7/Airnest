"""
缓存控制工具函数和装饰器
"""

from functools import wraps
from django.http import HttpResponse
from django.views.decorators.cache import cache_control as django_cache_control


def api_cache_control(
    no_cache=False,
    no_store=False,
    must_revalidate=False,
    public=None,
    private=None,
    max_age=None,
    s_maxage=None
):
    """
    API缓存控制装饰器
    
    Args:
        no_cache: 禁用缓存
        no_store: 禁止存储
        must_revalidate: 必须重新验证
        public: 公开缓存
        private: 私有缓存
        max_age: 最大缓存时间（秒）
        s_maxage: 共享缓存最大时间（秒）
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            response = view_func(request, *args, **kwargs)
            
            # 构建Cache-Control头
            cache_control_parts = []
            
            if no_cache:
                cache_control_parts.append('no-cache')
            if no_store:
                cache_control_parts.append('no-store')
            if must_revalidate:
                cache_control_parts.append('must-revalidate')
            if public:
                cache_control_parts.append('public')
            if private:
                cache_control_parts.append('private')
            if max_age is not None:
                cache_control_parts.append(f'max-age={max_age}')
            if s_maxage is not None:
                cache_control_parts.append(f's-maxage={s_maxage}')
            
            if cache_control_parts:
                response['Cache-Control'] = ', '.join(cache_control_parts)
            
            return response
        return wrapper
    return decorator


def public_cache(max_age=300):
    """
    公共数据缓存装饰器 - 适用于房源列表等公开数据
    默认缓存5分钟
    """
    return api_cache_control(public=True, max_age=max_age)


def short_cache(max_age=300):
    """
    短期缓存装饰器 - 适用于频繁变化的数据
    默认缓存5分钟
    """
    return api_cache_control(public=True, max_age=max_age)


def medium_cache(max_age=1800):
    """
    中期缓存装饰器 - 适用于相对稳定的数据
    默认缓存30分钟
    """
    return api_cache_control(public=True, max_age=max_age)


def no_cache():
    """
    禁用缓存装饰器 - 适用于用户私有数据
    """
    return api_cache_control(no_cache=True, no_store=True, must_revalidate=True)


def private_cache(max_age=300):
    """
    私有缓存装饰器 - 适用于用户相关但可以短期缓存的数据
    """
    return api_cache_control(private=True, max_age=max_age)


# 便捷的装饰器组合
def property_list_cache():
    """房源列表缓存策略"""
    return public_cache(max_age=300)  # 5分钟


def property_detail_cache():
    """房源详情缓存策略"""
    return public_cache(max_age=600)  # 10分钟


def review_cache():
    """评论数据缓存策略"""
    return public_cache(max_age=600)  # 10分钟


def user_private_data():
    """用户私有数据缓存策略"""
    return no_cache()


def static_data_cache():
    """静态数据缓存策略（如评论标签）"""
    return medium_cache(max_age=3600)  # 1小时