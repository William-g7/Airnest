import uuid
import os
import hashlib
from io import BytesIO
from datetime import datetime

from django.conf import settings
from django.db import models
from django.core.files.base import ContentFile
from PIL import Image
from django.db.models.signals import pre_save, post_delete
from django.dispatch import receiver

from useraccount.models import User


def get_file_url(file_field):
    """
    获取文件的完整URL
    兼容本地存储和R2存储
    """
    if not file_field:
        return None
        
    # 如果已经是完整URL（R2存储），直接返回
    if file_field.url.startswith(('http://', 'https://')):
        return file_field.url
    # 如果是相对路径（本地存储），拼接WEBSITE_URL
    else:
        return f'{settings.WEBSITE_URL}{file_field.url}'

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

    class Meta:
        # 稳定排序：最新创建的在前，同时间创建的按ID排序确保一致性
        ordering = ['-created_at', 'id']

    def __str__(self):
        return self.title
    
    @property
    def average_rating(self):
        """计算平均评分"""
        reviews = self.reviews.filter(is_hidden=False)
        if not reviews.exists():
            return 0
        return round(sum(review.rating for review in reviews) / reviews.count(), 1)
    
    @property
    def total_reviews(self):
        """获取评论总数"""
        return self.reviews.filter(is_hidden=False).count()
    
    @property
    def positive_review_rate(self):
        """计算好评率（4-5星评论的比例）"""
        reviews = self.reviews.filter(is_hidden=False)
        if not reviews.exists():
            return 0
        positive_count = reviews.filter(rating__gte=4).count()
        return round((positive_count / reviews.count()) * 100)
    
    def get_most_popular_tags(self, locale='en', limit=2):
        """获取该房源最受欢迎的标签"""
        from django.db.models import Count
        
        # 获取该房源下所有评论的标签，按频次排序
        tag_counts = ReviewTag.objects.filter(
            reviewtagassignment__review__property_ref=self,
            reviewtagassignment__review__is_hidden=False,
            is_active=True
        ).annotate(
            usage_count=Count('reviewtagassignment')
        ).order_by('-usage_count')[:limit]
        
        return [
            {
                'key': tag.tag_key,
                'name': tag.get_localized_name(locale),
                'count': tag.usage_count,
                'color': tag.color
            }
            for tag in tag_counts
        ]

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
    # 为不同展示场景存储的图片
    image_thumbnail = models.ImageField(upload_to='property_thumbnails', blank=True, null=True)
    image_medium = models.ImageField(upload_to='property_medium', blank=True, null=True)
    image_large = models.ImageField(upload_to='property_large', blank=True, null=True) 
    image_xlarge = models.ImageField(upload_to='property_xlarge', blank=True, null=True)
    image_main_jpg = models.ImageField(upload_to='property_main_jpg', blank=True, null=True)  # 主图JPG格式
    image_original = models.ImageField(upload_to='property_original', blank=True, null=True)  # 高清原图
    order = models.IntegerField(default=0)  # 用于排序
    is_main = models.BooleanField(default=False)  # 标识是否为主图
    
    class Meta:
        ordering = ['order']  
    
    def save(self, *args, **kwargs):
        """处理图片转换和生成缩略图"""
        if self.image and not self.pk:  
            img = Image.open(self.image)
            
            # 保存高清原图（如果原始图片尺寸足够大）
            # 通过计算图片大小判断是否保存原图
            original_width, original_height = img.size
            if original_width >= 1800 or original_height >= 1800:
                # 只有足够大的图片才保存原图
                original_io = BytesIO()
                
                # 保存原图，使用原格式，防止有损压缩
                original_format = img.format if img.format else 'JPEG'
                img.save(original_io, format=original_format, quality=100)
                original_content = original_io.getvalue()
                
                # 为原图计算内容哈希
                original_hash = hashlib.md5(original_content).hexdigest()[:12]
                timestamp = int(datetime.now().timestamp())
                original_ext = original_format.lower()
                original_filename = f"{original_hash}_{timestamp}_original.{original_ext}"
                
                self.image_original.save(
                    original_filename,
                    ContentFile(original_content),
                    save=False
                )
            
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # 生成不同尺寸的图片版本
            timestamp = int(datetime.now().timestamp())
            
            # 保存高质量JPG主图（用于首页轮播图）
            main_jpg_io = BytesIO()
            img.save(main_jpg_io, format='JPEG', quality=95)
            main_jpg_content = main_jpg_io.getvalue()
            
            # 为JPG主图计算内容哈希
            main_jpg_hash = hashlib.md5(main_jpg_content).hexdigest()[:12]
            main_jpg_filename = f"{main_jpg_hash}_{timestamp}_main.jpg"
            
            self.image_main_jpg.save(
                main_jpg_filename,
                ContentFile(main_jpg_content),
                save=False
            )
            
            # 1. 缩略图 - 200x200 (保持比例)
            thumbnail_size = (300, 300)  # 更大的尺寸
            thumbnail_img = img.copy()
            thumbnail_img.thumbnail(thumbnail_size, Image.LANCZOS)
            thumb_io = BytesIO()
            thumbnail_img.save(thumb_io, format='WEBP', quality=90)  # 提高质量
            thumb_content = thumb_io.getvalue()
            
            # 为缩略图计算内容哈希
            thumb_hash = hashlib.md5(thumb_content).hexdigest()[:12]
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
            medium_img.save(medium_io, format='WEBP', quality=95)  # 提高质量从90到95
            medium_content = medium_io.getvalue()
            
            # 为中等尺寸图片计算内容哈希
            medium_hash = hashlib.md5(medium_content).hexdigest()[:12]
            medium_filename = f"{medium_hash}_{timestamp}_medium.webp"
            
            self.image_medium.save(
                medium_filename,
                ContentFile(medium_content),
                save=False
            )
            
            # 3. 大尺寸 - 1600x1200 (保持比例)
            large_size = (1600, 1200)
            large_img = img.copy()
            large_img.thumbnail(large_size, Image.LANCZOS)
            large_io = BytesIO()
            large_img.save(large_io, format='WEBP', quality=98)  # 提高质量从90到98
            large_content = large_io.getvalue()
            
            # 为大尺寸图片计算内容哈希
            large_hash = hashlib.md5(large_content).hexdigest()[:12]
            large_filename = f"{large_hash}_{timestamp}_large.webp"
            
            self.image_large.save(
                large_filename,
                ContentFile(large_content),
                save=False
            )
            
            # 4. 超大尺寸 - 2000x1500 (保持比例)
            xlarge_size = (2000, 1500)
            # 检查原始图片是否大于需要的尺寸
            if img.width >= xlarge_size[0] or img.height >= xlarge_size[1]:
                xlarge_img = img.copy()
                xlarge_img.thumbnail(xlarge_size, Image.LANCZOS)
                xlarge_io = BytesIO()
                xlarge_img.save(xlarge_io, format='WEBP', quality=98)
                xlarge_content = xlarge_io.getvalue()
                
                # 为超大尺寸图片计算内容哈希
                xlarge_hash = hashlib.md5(xlarge_content).hexdigest()[:12]
                xlarge_filename = f"{xlarge_hash}_{timestamp}_xlarge.webp"
                
                self.image_xlarge.save(
                    xlarge_filename,
                    ContentFile(xlarge_content),
                    save=False
                )
            
            # 5. 转换原始图片为WebP
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
        return get_file_url(self.image)
    
    def thumbnailURL(self):
        return get_file_url(self.image_thumbnail)
    
    def mediumURL(self):
        return get_file_url(self.image_medium)
        
    def largeURL(self):
        return get_file_url(self.image_large)
        
    def xlargeURL(self):
        return get_file_url(self.image_xlarge)

    def mainJpgURL(self):
        return get_file_url(self.image_main_jpg)
        
    def originalURL(self):
        return get_file_url(self.image_original)

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

# 文件清理器信号函数
@receiver(pre_save, sender=PropertyImage)
def auto_delete_file_on_change(sender, instance, **kwargs):
    """
    在更新 PropertyImage 实例时删除旧文件
    """
    if not instance.pk:
        return False  # 如果是新创建的实例，没有旧文件需要删除
    
    try:
        old_instance = PropertyImage.objects.get(pk=instance.pk)
    except PropertyImage.DoesNotExist:
        return False
    
    # 检查是否更新了图片文件
    if old_instance.image != instance.image:
        # 删除所有相关联的文件
        if old_instance.image:
            if os.path.isfile(old_instance.image.path):
                os.remove(old_instance.image.path)
        if old_instance.image_thumbnail and old_instance.image_thumbnail.name:
            if hasattr(old_instance.image_thumbnail, 'path') and os.path.isfile(old_instance.image_thumbnail.path):
                os.remove(old_instance.image_thumbnail.path)
        if old_instance.image_medium and old_instance.image_medium.name:
            if hasattr(old_instance.image_medium, 'path') and os.path.isfile(old_instance.image_medium.path):
                os.remove(old_instance.image_medium.path)
        if old_instance.image_large and old_instance.image_large.name:
            if hasattr(old_instance.image_large, 'path') and os.path.isfile(old_instance.image_large.path):
                os.remove(old_instance.image_large.path)
        if old_instance.image_xlarge and old_instance.image_xlarge.name:
            if hasattr(old_instance.image_xlarge, 'path') and os.path.isfile(old_instance.image_xlarge.path):
                os.remove(old_instance.image_xlarge.path)
        if old_instance.image_main_jpg and old_instance.image_main_jpg.name:
            if hasattr(old_instance.image_main_jpg, 'path') and os.path.isfile(old_instance.image_main_jpg.path):
                os.remove(old_instance.image_main_jpg.path)
        if old_instance.image_original and old_instance.image_original.name:
            if hasattr(old_instance.image_original, 'path') and os.path.isfile(old_instance.image_original.path):
                os.remove(old_instance.image_original.path)

@receiver(post_delete, sender=PropertyImage)
def auto_delete_file_on_delete(sender, instance, **kwargs):
    """
    在删除 PropertyImage 实例时删除相关的所有文件
    """
    # 删除所有相关联的文件
    if instance.image:
        if os.path.isfile(instance.image.path):
            os.remove(instance.image.path)
    if instance.image_thumbnail and instance.image_thumbnail.name:
        if hasattr(instance.image_thumbnail, 'path') and os.path.isfile(instance.image_thumbnail.path):
            os.remove(instance.image_thumbnail.path)
    if instance.image_medium and instance.image_medium.name:
        if hasattr(instance.image_medium, 'path') and os.path.isfile(instance.image_medium.path):
            os.remove(instance.image_medium.path)
    if instance.image_large and instance.image_large.name:
        if hasattr(instance.image_large, 'path') and os.path.isfile(instance.image_large.path):
            os.remove(instance.image_large.path)
    if instance.image_xlarge and instance.image_xlarge.name:
        if hasattr(instance.image_xlarge, 'path') and os.path.isfile(instance.image_xlarge.path):
            os.remove(instance.image_xlarge.path)
    if instance.image_main_jpg and instance.image_main_jpg.name:
        if hasattr(instance.image_main_jpg, 'path') and os.path.isfile(instance.image_main_jpg.path):
            os.remove(instance.image_main_jpg.path)
    if instance.image_original and instance.image_original.name:
        if hasattr(instance.image_original, 'path') and os.path.isfile(instance.image_original.path):
            os.remove(instance.image_original.path)


class ReviewTag(models.Model):
    """预定义的评论标签"""
    
    # 标签的唯一标识符
    tag_key = models.CharField(max_length=50, unique=True)
    
    # 多语言标签内容
    name_en = models.CharField(max_length=100)
    name_zh = models.CharField(max_length=100)
    name_fr = models.CharField(max_length=100)
    
    # 标签颜色和图标（可选）
    color = models.CharField(max_length=7, default='#10B981')  # 默认绿色
    icon = models.CharField(max_length=50, blank=True)
    
    # 标签分类（便于管理）
    category = models.CharField(max_length=50, choices=[
        ('location', '位置'),
        ('cleanliness', '清洁度'),
        ('service', '服务'),
        ('amenities', '设施'),
        ('value', '性价比'),
        ('communication', '沟通'),
    ], default='service')
    
    # 是否激活
    is_active = models.BooleanField(default=True)
    
    # 排序
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['category', 'order']
    
    def __str__(self):
        return f"{self.tag_key} - {self.name_en}"
    
    def get_localized_name(self, locale='en'):
        """根据语言环境返回对应的标签名称"""
        locale_map = {
            'en': self.name_en,
            'zh': self.name_zh,
            'fr': self.name_fr,
        }
        return locale_map.get(locale, self.name_en)


class PropertyReview(models.Model):
    """房源评论模型"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # 关联关系
    property_ref = models.ForeignKey(Property, related_name='reviews', on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name='reviews', on_delete=models.CASCADE)
    reservation = models.ForeignKey(Reservation, related_name='review', on_delete=models.SET_NULL, null=True, blank=True)
    
    # 评分 (1-5星)
    rating = models.IntegerField(choices=[
        (1, '1星'),
        (2, '2星'),
        (3, '3星'),
        (4, '4星'),
        (5, '5星'),
    ])
    
    # 评论内容
    title = models.CharField(max_length=200, blank=True)
    content = models.TextField()
    
    # 选择的标签（通过中间表关联）
    tags = models.ManyToManyField(ReviewTag, through='ReviewTagAssignment', blank=True)
    
    # 元数据
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # 管理字段
    is_verified = models.BooleanField(default=False)  # 是否为已验证的评论（已完成住宿）
    is_hidden = models.BooleanField(default=False)    # 是否隐藏（举报后）
    
    class Meta:
        ordering = ['-created_at']
        # 确保同一用户对同一房源只能评论一次
        unique_together = ['property_ref', 'user']
    
    def __str__(self):
        return f"{self.user.name} - {self.property_ref.title} ({self.rating}星)"
    
    @property
    def is_positive(self):
        """判断是否为好评（4-5星）"""
        return self.rating >= 4


class ReviewTagAssignment(models.Model):
    """评论和标签的关联模型"""
    
    review = models.ForeignKey(PropertyReview, on_delete=models.CASCADE)
    tag = models.ForeignKey(ReviewTag, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['review', 'tag']
    
    def __str__(self):
        return f"{self.review.id} - {self.tag.tag_key}"