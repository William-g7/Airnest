"""
存储工具类 - 处理文件上传和存储的通用方法
支持本地存储和Cloudflare R2存储的透明切换
"""

import os
import hashlib
from io import BytesIO
from datetime import datetime
from django.conf import settings
from django.core.files.base import ContentFile
from PIL import Image


def generate_file_hash(content):
    """
    根据文件内容生成哈希值
    """
    return hashlib.md5(content).hexdigest()[:12]


def generate_timestamp():
    """
    生成当前时间戳
    """
    return int(datetime.now().timestamp())


def get_optimized_image_sizes():
    """
    返回预定义的图片优化尺寸配置
    """
    return {
        'thumbnail': {
            'size': (300, 300),
            'quality': 90,
            'format': 'WEBP',
            'suffix': '_thumb'
        },
        'medium': {
            'size': (800, 600),
            'quality': 95,
            'format': 'WEBP',
            'suffix': '_medium'
        },
        'large': {
            'size': (1200, 900),
            'quality': 95,
            'format': 'WEBP',
            'suffix': '_large'
        },
        'xlarge': {
            'size': (1800, 1350),
            'quality': 95,
            'format': 'WEBP',
            'suffix': '_xlarge'
        },
        'main_jpg': {
            'size': None,  # 保持原尺寸
            'quality': 95,
            'format': 'JPEG',
            'suffix': '_main'
        }
    }


def process_image_variant(img, variant_config, timestamp):
    """
    处理单个图片变体
    
    Args:
        img: PIL Image对象
        variant_config: 变体配置字典
        timestamp: 时间戳
    
    Returns:
        tuple: (filename, content)
    """
    # 复制图片以避免修改原图
    variant_img = img.copy()
    
    # 如果指定了尺寸，则调整大小
    if variant_config['size']:
        variant_img.thumbnail(variant_config['size'], Image.LANCZOS)
    
    # 保存到内存
    img_io = BytesIO()
    format_name = variant_config['format']
    quality = variant_config['quality']
    
    if format_name == 'WEBP':
        variant_img.save(img_io, format='WEBP', quality=quality)
        ext = 'webp'
    elif format_name == 'JPEG':
        variant_img.save(img_io, format='JPEG', quality=quality)
        ext = 'jpg'
    else:
        variant_img.save(img_io, format=format_name, quality=quality)
        ext = format_name.lower()
    
    content = img_io.getvalue()
    
    # 生成文件名
    content_hash = generate_file_hash(content)
    suffix = variant_config['suffix']
    filename = f"{content_hash}_{timestamp}{suffix}.{ext}"
    
    return filename, content


def save_original_image(img, timestamp):
    """
    保存原始高清图片（仅当尺寸足够大时）
    
    Args:
        img: PIL Image对象
        timestamp: 时间戳
    
    Returns:
        tuple: (filename, content) 或 (None, None)
    """
    original_width, original_height = img.size
    
    # 只有足够大的图片才保存原图
    if original_width >= 1800 or original_height >= 1800:
        original_io = BytesIO()
        
        # 保存原图，使用原格式，防止有损压缩
        original_format = img.format if img.format else 'JPEG'
        img.save(original_io, format=original_format, quality=100)
        original_content = original_io.getvalue()
        
        # 为原图计算内容哈希
        original_hash = generate_file_hash(original_content)
        original_ext = original_format.lower()
        original_filename = f"{original_hash}_{timestamp}_original.{original_ext}"
        
        return original_filename, original_content
    
    return None, None


def get_storage_url(file_field):
    """
    获取文件的完整URL
    兼容本地存储和R2存储
    
    Args:
        file_field: Django FileField或ImageField
    
    Returns:
        str: 完整的文件URL
    """
    if not file_field:
        return None
    
    # 如果使用R2存储，url()方法会返回完整的CDN URL
    # 如果使用本地存储，会返回相对URL，需要结合MEDIA_URL
    url = file_field.url
    
    # 检查是否已经是完整URL
    if url.startswith(('http://', 'https://')):
        return url
    
    # 对于本地存储，组合完整URL
    return f"{settings.MEDIA_URL.rstrip('/')}{url}" if not url.startswith('/') else f"{settings.MEDIA_URL.rstrip('/')}{url}"


def is_storage_available():
    """
    检查当前配置的存储后端是否可用
    """
    try:
        from airnest_backend.storage import is_using_r2
        
        if is_using_r2():
            # 检查R2配置是否完整
            required_settings = [
                'AWS_ACCESS_KEY_ID',
                'AWS_SECRET_ACCESS_KEY', 
                'AWS_STORAGE_BUCKET_NAME',
                'AWS_S3_ENDPOINT_URL'
            ]
            
            for setting in required_settings:
                if not getattr(settings, setting, None):
                    return False, f"Missing R2 configuration: {setting}"
            
            return True, "R2 storage configured"
        else:
            # 检查本地存储
            if hasattr(settings, 'MEDIA_ROOT') and settings.MEDIA_ROOT:
                return True, "Local storage configured"
            else:
                return False, "No storage backend configured"
    
    except Exception as e:
        return False, f"Storage configuration error: {str(e)}"


def get_file_info(file_field):
    """
    获取文件的详细信息
    
    Args:
        file_field: Django FileField或ImageField
    
    Returns:
        dict: 文件信息字典
    """
    if not file_field:
        return None
    
    try:
        return {
            'name': file_field.name,
            'url': get_storage_url(file_field),
            'size': file_field.size,
            'exists': file_field.storage.exists(file_field.name)
        }
    except Exception as e:
        return {
            'name': file_field.name if file_field.name else None,
            'url': None,
            'size': None,
            'exists': False,
            'error': str(e)
        }