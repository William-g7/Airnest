import uuid
import os
import hashlib
from io import BytesIO
from datetime import datetime

from django.conf import settings
from django.db import models
from django.core.files.base import ContentFile
from PIL import Image

from useraccount.models import User

class Property(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)

    #category and type
    category = models.CharField(max_length=255)
    place_type = models.CharField(max_length=255)

    #basic info
    bedrooms = models.IntegerField()
    bathrooms = models.IntegerField()
    guests = models.IntegerField()
    beds = models.IntegerField()

    #location
    country = models.CharField(max_length=255)
    state = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=255)
    address = models.CharField(max_length=255)
    postal_code = models.CharField(max_length=20)
    
    #timezone
    timezone = models.CharField(max_length=50, default='UTC')

    #relationship and metadata
    landlord = models.ForeignKey(User, related_name='properties', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

def property_image_path(instance, filename):
    """生成房源图片的存储路径
    
    使用文件内容的哈希值作为文件名的一部分，便于CDN缓存控制
    格式：property_images/property_id/content_hash_timestamp.webp
    """
    # 生成基于内容的哈希值 - 在save方法中设置
    # 由于此函数在文件保存前调用，此时还无法访问文件内容
    # 我们将使用UUID作为临时唯一标识符
    unique_id = uuid.uuid4().hex[:8]
    timestamp = int(datetime.now().timestamp())
    
    # 生成新的文件名，格式：property_id/unique_id_timestamp.webp
    new_filename = f"{unique_id}_{timestamp}.webp"
    
    # 返回存储路径
    return f'property_images/{instance.property.id}/{new_filename}'

class PropertyImage(models.Model):
    property = models.ForeignKey(Property, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to=property_image_path)
    # 为不同展示场景存储的缩略图
    image_thumbnail = models.ImageField(upload_to='property_thumbnails', blank=True, null=True)
    image_medium = models.ImageField(upload_to='property_medium', blank=True, null=True)
    order = models.IntegerField(default=0)  # 用于排序
    is_main = models.BooleanField(default=False)  # 标识是否为主图
    
    class Meta:
        ordering = ['order']  
    
    def save(self, *args, **kwargs):
        """处理图片转换和生成缩略图"""
        if self.image and not self.pk:  
            img = Image.open(self.image)
            
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # 生成不同尺寸的图片版本
            
            # 1. 缩略图 - 200x200 (保持比例)
            thumbnail_size = (200, 200)
            thumbnail_img = img.copy()
            thumbnail_img.thumbnail(thumbnail_size, Image.LANCZOS)
            thumb_io = BytesIO()
            thumbnail_img.save(thumb_io, format='WEBP', quality=85)
            thumb_content = thumb_io.getvalue()
            
            # 为缩略图计算内容哈希
            thumb_hash = hashlib.md5(thumb_content).hexdigest()[:12]
            timestamp = int(datetime.now().timestamp())
            thumb_filename = f"{thumb_hash}_{timestamp}_thumb.webp"
            
            self.image_thumbnail.save(
                thumb_filename,
                ContentFile(thumb_content),
                save=False
            )
            
            # 2. 中等尺寸 - 800x600 (保持比例)
            medium_size = (800, 600)
            medium_img = img.copy()
            medium_img.thumbnail(medium_size, Image.LANCZOS)
            medium_io = BytesIO()
            medium_img.save(medium_io, format='WEBP', quality=90)
            medium_content = medium_io.getvalue()
            
            # 为中等尺寸图片计算内容哈希
            medium_hash = hashlib.md5(medium_content).hexdigest()[:12]
            medium_filename = f"{medium_hash}_{timestamp}_medium.webp"
            
            self.image_medium.save(
                medium_filename,
                ContentFile(medium_content),
                save=False
            )
            
            # 3. 转换原始图片为WebP
            output_io = BytesIO()
            img.save(output_io, format='WEBP', quality=95)
            main_content = output_io.getvalue()
            
            # 为主图计算内容哈希
            main_hash = hashlib.md5(main_content).hexdigest()[:12]
            main_filename = f"{main_hash}_{timestamp}.webp"
            
            # 替换原始图片
            self.image.save(
                main_filename,
                ContentFile(main_content),
                save=False
            )
        
        super().save(*args, **kwargs)
    
    def imageURL(self):
        return f'{settings.WEBSITE_URL}{self.image.url}' if self.image else None
    
    def thumbnailURL(self):
        return f'{settings.WEBSITE_URL}{self.image_thumbnail.url}' if self.image_thumbnail else None
    
    def mediumURL(self):
        return f'{settings.WEBSITE_URL}{self.image_medium.url}' if self.image_medium else None
    
class Reservation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(Property, related_name='reservations', on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name='reservations', on_delete=models.CASCADE)
    check_in = models.DateTimeField()
    check_out = models.DateTimeField()
    guests = models.IntegerField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

class Wishlist(models.Model):
    user = models.ForeignKey(User, related_name='wishlists', on_delete=models.CASCADE)
    property = models.ForeignKey(Property, related_name='favorited_by', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'property')