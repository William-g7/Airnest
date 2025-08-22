import uuid
from datetime import datetime

from django.conf import settings
from django.db import models

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

# 临时保留此函数用于旧迁移文件兼容性
def property_image_path(instance, filename):
    """
    DEPRECATED: 仅用于旧迁移文件兼容性
    现在使用R2存储，不再使用此路径函数
    """
    return f'property_images/{filename}'

class Property(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    
    # 房源状态
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('published', '已发布')
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='published')

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
        ordering = ['-created_at', 'id']

    def __str__(self):
        return self.title
    
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
    
    @property
    def average_rating(self):
        """计算平均评分"""
        from django.db.models import Avg
        
        reviews = self.reviews.filter(is_hidden=False)
        if not reviews.exists():
            return None
        
        avg = reviews.aggregate(avg_rating=Avg('rating'))['avg_rating']
        return round(avg, 1) if avg else None
    
    @property
    def total_reviews(self):
        """获取评论总数"""
        return self.reviews.filter(is_hidden=False).count()
    
    @property
    def positive_review_rate(self):
        """计算好评率（4星及以上）"""
        total = self.total_reviews
        if total == 0:
            return None
        
        positive = self.reviews.filter(is_hidden=False, rating__gte=4).count()
        return round((positive / total) * 100, 1)


class PropertyImage(models.Model):
    # 基本关联
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property_ref = models.ForeignKey(Property, related_name='images', on_delete=models.CASCADE, null=True, blank=True)
    
    # R2存储核心信息
    object_key = models.CharField(max_length=500, unique=True, default='')
    file_url = models.URLField(max_length=500, default='')
    file_size = models.BigIntegerField(default=0)
    content_type = models.CharField(max_length=100, default='image/jpeg')
    etag = models.CharField(max_length=100, blank=True, default='')
    
    # 展示控制
    order = models.IntegerField(default=0)
    is_main = models.BooleanField(default=False)
    alt_text = models.CharField(max_length=255, blank=True)
    
    # 元数据
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_images', null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'uploaded_at']
    
    def __str__(self):
        main_indicator = " (主图)" if self.is_main else ""
        return f"{self.property_ref.title} - 图片 {self.order}{main_indicator}"
    
    def get_url(self):
        return self.file_url
        
    def imageURL(self):
        return self.get_url()
    
    @property
    def file_size_mb(self):
        """文件大小(MB)"""
        return round(self.file_size / (1024 * 1024), 2) if self.file_size else 0
    
    @property
    def is_image(self):
        """判断是否为图片文件"""
        return self.content_type.startswith('image/') if self.content_type else False


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


class ReviewTag(models.Model):
    tag_key = models.CharField(max_length=50, unique=True)
    name_en = models.CharField(max_length=100)
    name_zh = models.CharField(max_length=100)
    name_fr = models.CharField(max_length=100)
    color = models.CharField(max_length=7, default='#10B981')
    icon = models.CharField(max_length=50, blank=True)
    category = models.CharField(max_length=50, choices=[
        ('location', '位置'),
        ('cleanliness', '清洁度'),
        ('service', '服务'),
        ('amenities', '设施'),
        ('value', '性价比'),
        ('communication', '沟通'),
    ], default='service')
    is_active = models.BooleanField(default=True)
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
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property_ref = models.ForeignKey(Property, related_name='reviews', on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name='reviews', on_delete=models.CASCADE)
    reservation = models.ForeignKey(Reservation, related_name='review', on_delete=models.SET_NULL, null=True, blank=True)
    rating = models.IntegerField(choices=[
        (1, '1星'),
        (2, '2星'),
        (3, '3星'),
        (4, '4星'),
        (5, '5星'),
    ])
    title = models.CharField(max_length=200, blank=True)
    content = models.TextField()
    tags = models.ManyToManyField(ReviewTag, through='ReviewTagAssignment', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_verified = models.BooleanField(default=False)
    is_hidden = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['property_ref', 'user']
    
    def __str__(self):
        return f"{self.user.name} - {self.property_ref.title} ({self.rating}星)"


class ReviewTagAssignment(models.Model):
    review = models.ForeignKey(PropertyReview, on_delete=models.CASCADE)
    tag = models.ForeignKey(ReviewTag, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['review', 'tag']
    
    def __str__(self):
        return f"{self.review.id} - {self.tag.tag_key}"