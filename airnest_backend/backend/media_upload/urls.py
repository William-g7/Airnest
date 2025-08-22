"""
Media Upload URL Configuration

URL patterns for Cloudflare R2 direct upload APIs
"""

from django.urls import path
from . import views

app_name = 'media_upload'

urlpatterns = [
    # ================== R2 直传 API ==================
    # 单个文件预签名URL
    path('presigned-url/', views.get_presigned_upload_url, name='presigned_upload_url'),
    
    # 批量文件预签名URL
    path('presigned-urls/', views.get_batch_presigned_upload_urls, name='batch_presigned_upload_urls'),
    
    # 验证文件上传状态
    path('verify-upload/', views.verify_upload, name='verify_upload'),
    
    # 删除已上传文件
    path('delete-file/', views.delete_uploaded_file, name='delete_uploaded_file'),
    
    # ================== 草稿房源管理 API ==================
    # 草稿房源列表和创建 (GET列表, POST创建)
    path('draft-properties/', views.draft_properties_list_create, name='draft_properties_list_create'),
    
    # 草稿房源详情 (GET详情, DELETE删除)
    path('draft-properties/<uuid:draft_id>/', views.draft_property_detail, name='draft_property_detail'),
    
    # 添加草稿房源图片
    path('draft-properties/images/', views.add_draft_property_images, name='add_draft_property_images'),
    
    # 发布草稿房源
    path('draft-properties/publish/', views.publish_draft_property, name='publish_draft_property'),
]