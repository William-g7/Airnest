from rest_framework import serializers
from .models import Property, PropertyImage, PropertyReview, ReviewTag, ReviewTagAssignment
from useraccount.serializers import UserSerializer

class PropertyImageSerializer(serializers.ModelSerializer):
    imageURL = serializers.SerializerMethodField()
    thumbnailURL = serializers.SerializerMethodField()
    mediumURL = serializers.SerializerMethodField()
    largeURL = serializers.SerializerMethodField()
    xlargeURL = serializers.SerializerMethodField()
    mainJpgURL = serializers.SerializerMethodField()
    originalURL = serializers.SerializerMethodField()

    class Meta:
        model = PropertyImage
        fields = ['id', 'imageURL', 'thumbnailURL', 'mediumURL', 'largeURL', 'xlargeURL', 
                 'mainJpgURL', 'originalURL', 'order', 'is_main']

    def get_imageURL(self, obj):
        return obj.imageURL()
        
    def get_thumbnailURL(self, obj):
        return obj.thumbnailURL()
        
    def get_mediumURL(self, obj):
        return obj.mediumURL()
        
    def get_largeURL(self, obj):
        return obj.largeURL()
        
    def get_xlargeURL(self, obj):
        return obj.xlargeURL()
        
    def get_mainJpgURL(self, obj):
        return obj.mainJpgURL()
        
    def get_originalURL(self, obj):
        return obj.originalURL()

class PropertySerializer(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = [
            'id', 'title', 'description', 'price_per_night',
            'category', 'place_type', 'bedrooms', 'bathrooms',
            'guests', 'beds', 'country', 'state', 'city',
            'address', 'postal_code', 'landlord', 'created_at',
            'images', 'timezone'
        ]
    
    def get_images(self, obj):
        images = obj.images.all().order_by('order')
        return PropertyImageSerializer(images, many=True).data


class PropertyLandlordSerializer(serializers.ModelSerializer):
    landlord = UserSerializer(read_only=True, many=False)
    images = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = ['id', 'title', 'description', 'price_per_night',
            'category', 'place_type', 'bedrooms', 'bathrooms',
            'guests', 'beds', 'country', 'state', 'city',
            'address', 'postal_code', 'landlord', 'created_at',
            'images', 'timezone']
    
    def get_images(self, obj):
        images = obj.images.all().order_by('order')
        return PropertyImageSerializer(images, many=True).data

class PropertyListSerializer(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = [
            'id', 'title', 'price_per_night', 'city', 
            'country', 'guests', 'images', 'timezone'
        ]
    
    def get_images(self, obj):
        images = obj.images.all().order_by('order')
        return PropertyImageSerializer(images, many=True).data


class ReviewTagSerializer(serializers.ModelSerializer):
    """评论标签序列化器"""
    
    class Meta:
        model = ReviewTag
        fields = ['tag_key', 'name_en', 'name_zh', 'name_fr', 'color', 'category']


class PropertyReviewSerializer(serializers.ModelSerializer):
    """房源评论序列化器"""
    user = UserSerializer(read_only=True)
    tags = ReviewTagSerializer(many=True, read_only=True)
    tag_keys = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = PropertyReview
        fields = [
            'id', 'property_ref', 'user', 'rating', 'title', 'content',
            'tags', 'tag_keys', 'created_at', 'updated_at', 
            'is_verified', 'is_hidden'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'is_verified', 'is_hidden']
    
    def create(self, validated_data):
        tag_keys = validated_data.pop('tag_keys', [])
        review = PropertyReview.objects.create(**validated_data)
        
        # 关联标签
        for tag_key in tag_keys:
            try:
                tag = ReviewTag.objects.get(tag_key=tag_key, is_active=True)
                ReviewTagAssignment.objects.create(review=review, tag=tag)
            except ReviewTag.DoesNotExist:
                pass  # 忽略不存在的标签
        
        return review


class PropertyReviewListSerializer(serializers.ModelSerializer):
    """房源评论列表序列化器（简化版）"""
    user = UserSerializer(read_only=True)
    tags = ReviewTagSerializer(many=True, read_only=True)
    
    class Meta:
        model = PropertyReview
        fields = ['id', 'user', 'rating', 'title', 'content', 'tags', 'created_at', 'is_verified']


class PropertyWithReviewStatsSerializer(serializers.ModelSerializer):
    """带评论统计的房源序列化器"""
    images = serializers.SerializerMethodField()
    landlord = UserSerializer(read_only=True)
    average_rating = serializers.ReadOnlyField()
    total_reviews = serializers.ReadOnlyField()
    positive_review_rate = serializers.ReadOnlyField()
    most_popular_tags = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = [
            'id', 'title', 'description', 'price_per_night', 'city', 'country', 
            'guests', 'bedrooms', 'beds', 'bathrooms', 'images', 'timezone', 'landlord',
            'category', 'place_type', 'average_rating', 'total_reviews', 
            'positive_review_rate', 'most_popular_tags'
        ]
    
    def get_images(self, obj):
        images = obj.images.all().order_by('order')
        return PropertyImageSerializer(images, many=True).data
    
    def get_most_popular_tags(self, obj):
        # 从请求中获取语言环境
        request = self.context.get('request')
        locale = 'en'
        if request and hasattr(request, 'headers'):
            accept_language = request.headers.get('Accept-Language', 'en')
            if 'zh' in accept_language:
                locale = 'zh'
            elif 'fr' in accept_language:
                locale = 'fr'
        
        return obj.get_most_popular_tags(locale=locale, limit=2)