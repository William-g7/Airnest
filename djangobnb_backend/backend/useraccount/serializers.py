from rest_framework import serializers
from .models import User
from property.models import Property

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'avatar_url', 'date_joined']
        read_only_fields = ['id', 'email', 'date_joined']

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