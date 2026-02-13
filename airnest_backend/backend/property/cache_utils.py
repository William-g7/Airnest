"""
缓存控制工具函数和装饰器
"""

from functools import wraps
from django.http import HttpResponse, HttpResponseNotModified
from django.views.decorators.cache import cache_control as django_cache_control
from django.utils import timezone
from django.utils.http import parse_http_date, http_date

def _norm(dt):
    if not timezone.is_aware(dt):
        dt = timezone.make_aware(dt, timezone.utc)
    return dt.astimezone(timezone.utc).replace(microsecond=0)

def check_conditional_request(request, last_modified_time):
    """
    检查条件请求，如果客户端缓存仍然有效，返回304响应
    
    Args:
        request: Django请求对象
        last_modified_time: 资源的最后修改时间（datetime对象）
        
    Returns:
        HttpResponseNotModified 如果内容未修改，否则 None
    """
    if not last_modified_time:
        return None

    ims = request.META.get('HTTP_IF_MODIFIED_SINCE')
    if not ims:
        return None

    try:
        client_ts = parse_http_date(ims) 
        if client_ts is None:
            return None

        server_dt = _norm(last_modified_time)
        server_ts = int(server_dt.timestamp())

        now_ts = int(timezone.now().timestamp())
        if client_ts > now_ts:
            client_ts = now_ts

        if server_ts <= client_ts:
            resp = HttpResponseNotModified()
            resp['Last-Modified'] = http_date(server_ts)
            return resp

    except (ValueError, TypeError):
        pass

    return None


def api_cache_control(
    no_cache=False,
    no_store=False,
    must_revalidate=False,
    public=None,
    private=None,
    max_age=None,
    s_maxage=None,
    vary_headers=None,
    last_modified=None
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
        vary_headers: Vary头的值列表，如['Accept-Language', 'User-Agent']
        last_modified: Last-Modified时间戳（datetime对象或callable）
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
            
            # 添加Vary头支持
            if vary_headers:
                if isinstance(vary_headers, (list, tuple)):
                    response['Vary'] = ', '.join(vary_headers)
                else:
                    response['Vary'] = str(vary_headers)
            
            # 添加Last-Modified头支持和条件请求处理
            if last_modified:
                if callable(last_modified):
                    # 如果last_modified是函数，调用它获取时间戳
                    modified_time = last_modified(request, *args, **kwargs)
                else:
                    modified_time = last_modified
                
                if modified_time:
                    # 检查条件请求，如果内容未修改则返回304
                    conditional_response = check_conditional_request(request, modified_time)
                    if conditional_response:
                        # 为304响应也添加缓存控制头和Vary头
                        if cache_control_parts:
                            conditional_response['Cache-Control'] = ', '.join(cache_control_parts)
                        if vary_headers:
                            if isinstance(vary_headers, (list, tuple)):
                                conditional_response['Vary'] = ', '.join(vary_headers)
                            else:
                                conditional_response['Vary'] = str(vary_headers)
                        return conditional_response
                    
                    # 如果内容已修改，添加Last-Modified头
                    response['Last-Modified'] = http_date(modified_time.timestamp())
            
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


# 增强的缓存装饰器 - 支持多语言和Last-Modified
def multilingual_cache(max_age=300):
    """
    多语言数据缓存装饰器 - 添加Vary: Accept-Language头
    适用于支持多语言的公开数据
    """
    return api_cache_control(
        public=True, 
        max_age=max_age,
        vary_headers=['Accept-Language']
    )


def property_with_last_modified(max_age=600):
    """
    房源详情缓存装饰器 - 包含Last-Modified支持
    """
    def get_last_modified(request, *args, **kwargs):
        from .models import Property
        try:
            property_id = kwargs.get('pk')
            if property_id:
                property_obj = Property.objects.get(pk=property_id)
                return property_obj.updated_at
        except Property.DoesNotExist:
            pass
        return None
    
    return api_cache_control(
        public=True, 
        max_age=max_age,
        vary_headers=['Accept-Language'],
        last_modified=get_last_modified
    )


def review_with_last_modified(max_age=600):
    """
    评论相关缓存装饰器 - 包含Last-Modified支持
    """
    def get_last_modified(request, *args, **kwargs):
        from .models import Property, PropertyReview
        try:
            property_id = kwargs.get('pk')
            if property_id:
                # 获取该房源最新评论的时间
                latest_review = PropertyReview.objects.filter(
                    property_ref_id=property_id
                ).order_by('-created_at').first()
                
                if latest_review:
                    return latest_review.created_at
                else:
                    # 如果没有评论，使用房源的更新时间
                    property_obj = Property.objects.get(pk=property_id)
                    return property_obj.updated_at
        except (Property.DoesNotExist, PropertyReview.DoesNotExist):
            pass
        return None
    
    return api_cache_control(
        public=True, 
        max_age=max_age,
        vary_headers=['Accept-Language'],
        last_modified=get_last_modified
    )