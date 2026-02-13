from rest_framework import serializers
from .models import Property, PropertyImage, PropertyReview, ReviewTag, ReviewTagAssignment, ALLOWED_PROPERTY_TAG_IDS
from useraccount.serializers import UserSerializer

class PropertyImageSerializer(serializers.ModelSerializer):
    imageURL = serializers.SerializerMethodField()

    class Meta:
        model = PropertyImage
        fields = ['id', 'imageURL', 'order', 'is_main', 'alt_text']

    def get_imageURL(self, obj):
        return obj.get_url()

def _validate_property_tags(v):
    if v is None:
        return []
    if not isinstance(v, list):
        raise serializers.ValidationError("property_tags must be a list")
    # 去重并保持顺序
    uniq = list(dict.fromkeys(v))
    # 校验白名单
    illegal = [x for x in uniq if x not in ALLOWED_PROPERTY_TAG_IDS]
    if illegal:
        raise serializers.ValidationError(f"invalid tag ids: {illegal}")
    if len(uniq) > 5:
        raise serializers.ValidationError("select at most 5 tags")
    return uniq

class PropertySerializer(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = [
            'id', 'title', 'description', 'price_per_night',
            'category', 'place_type', 'bedrooms', 'bathrooms',
            'guests', 'beds', 'country', 'state', 'city',
            'address', 'postal_code', 'landlord', 'created_at',
            'images', 'timezone','property_tags'
        ]
    def validate_property_tags(self, v):
        return _validate_property_tags(v)

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
            'images', 'timezone', 'property_tags', ]
    
    def get_images(self, obj):
        images = obj.images.all().order_by('order')
        return PropertyImageSerializer(images, many=True).data

class PropertyListSerializer(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = [
            'id', 'title', 'price_per_night', 'city', 
            'country', 'guests', 'images', 'timezone','property_tags'
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
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'is_verified', 'is_hidden', 'property_ref']
        
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
    property_tags = serializers.ListField(
        child=serializers.ChoiceField(ALLOWED_PROPERTY_TAG_IDS),
        required=False
    )
    
    class Meta:
        model = Property
        fields = [
            'id', 'title', 'description', 'price_per_night', 'city', 'country', 
            'guests', 'bedrooms', 'beds', 'bathrooms', 'images', 'timezone', 'landlord',
            'category', 'place_type', 'average_rating', 'total_reviews', 
            'positive_review_rate', 'property_tags'
        ]
    
    def validate_property_tags(self, v):
        return _validate_property_tags(v)

    def get_images(self, obj):
        images = obj.images.all().order_by('order')
        return PropertyImageSerializer(images, many=True).data