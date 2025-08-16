import os
import uuid
from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import sys

def process_avatar_image(user_id, image):
    """
    处理用户头像图片：
    1. 调整尺寸为300x300像素
    2. 转换为WebP格式
    3. 确保为正方形
    4. 保存在以用户ID命名的目录中
    5. 添加时间戳避免缓存问题
    """
    img = Image.open(image)
    
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    width, height = img.size
    
    if width != height:
        crop_size = min(width, height)

        left = (width - crop_size) // 2
        top = (height - crop_size) // 2
        right = left + crop_size
        bottom = top + crop_size

        img = img.crop((left, top, right, bottom))
    
    img = img.resize((300, 300), Image.LANCZOS)
    
    output = BytesIO()
    
    img.save(output, format='WEBP', quality=85)
    
    output.seek(0)
    
    timestamp = uuid.uuid4().hex[:8]
    filename = f"avatar_{timestamp}.webp"
    
    return InMemoryUploadedFile(
        output,
        'ImageField',
        filename,
        'image/webp',
        sys.getsizeof(output),
        None
    )

def avatar_upload_path(instance, filename):
    """
    为用户头像生成唯一的文件路径，基于用户ID组织
    """
    ext = filename.split('.')[-1]
    return f'uploads/avatars/{instance.id}/{uuid.uuid4().hex[:8]}.{ext}' 