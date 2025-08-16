from rest_framework import serializers
from .models import User
from property.models import Property
from dj_rest_auth.serializers import LoginSerializer as BaseLoginSerializer

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'avatar_url', 'date_joined', 'email_verified', 'email_verified_at']
        read_only_fields = ['id', 'email', 'date_joined', 'email_verified', 'email_verified_at']

class LandlordPropertySerializer(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = ['id', 'title', 'price_per_night', 'city', 
                 'country', 'guests', 'images']
    
    def get_images(self, obj):
        return [{'imageURL': image.imageURL()} for image in obj.images.all()]

class LandlordSerializer(serializers.ModelSerializer):
    properties = LandlordPropertySerializer(many=True, read_only=True)
    properties_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'name', 'avatar_url', 'properties_count', 'properties', 'date_joined']

    def get_properties_count(self, obj):
        return obj.properties.count()

class CustomLoginSerializer(BaseLoginSerializer):
    """自定义登录序列化器，在响应中包含用户信息"""
    
    def validate(self, attrs):
        # 调用父类的验证逻辑
        attrs = super().validate(attrs)
        
        # 在验证成功后添加用户信息
        if hasattr(self, 'user') and self.user:
            user_serializer = UserSerializer(self.user)
            attrs['user'] = user_serializer.data
            
        return attrs