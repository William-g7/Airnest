"""
Cloudflare R2 Storage Configuration
自定义存储后端配置，用于处理媒体文件的上传和访问
"""

from django.conf import settings
from storages.backends.s3boto3 import S3Boto3Storage


class R2MediaStorage(S3Boto3Storage):
    """
    Cloudflare R2 媒体文件存储配置
    """
    bucket_name = settings.AWS_STORAGE_BUCKET_NAME
    custom_domain = settings.AWS_S3_CUSTOM_DOMAIN
    file_overwrite = False
    default_acl = None
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # 确保使用正确的端点和配置
        self.endpoint_url = settings.AWS_S3_ENDPOINT_URL
        self.region_name = settings.AWS_S3_REGION_NAME
        
    def url(self, name):
        """
        返回文件的公开访问URL
        优先使用CDN域名
        """
        if self.custom_domain:
            return f"https://{self.custom_domain}/{name}"
        return super().url(name)


class R2StaticStorage(S3Boto3Storage):
    """
    Cloudflare R2 静态文件存储配置（可选，用于生产环境静态文件）
    """
    bucket_name = settings.AWS_STORAGE_BUCKET_NAME
    location = 'static'
    default_acl = None
    file_overwrite = True


def get_media_storage():
    """
    根据配置返回合适的存储后端
    """
    if (settings.USE_R2_STORAGE and 
        settings.AWS_ACCESS_KEY_ID and 
        settings.AWS_SECRET_ACCESS_KEY):
        return R2MediaStorage()
    else:
        from django.core.files.storage import default_storage
        return default_storage


def is_using_r2():
    """
    检查当前是否使用R2存储
    """
    return (settings.USE_R2_STORAGE and 
            settings.AWS_ACCESS_KEY_ID and 
            settings.AWS_SECRET_ACCESS_KEY)