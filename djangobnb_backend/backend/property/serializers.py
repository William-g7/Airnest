from rest_framework import serializers
from .models import Property, PropertyImage
from useraccount.serializers import UserSerializer

class PropertyImageSerializer(serializers.ModelSerializer):
    imageURL = serializers.SerializerMethodField()
    thumbnailURL = serializers.SerializerMethodField()
    mediumURL = serializers.SerializerMethodField()

    class Meta:
        model = PropertyImage
        fields = ['id', 'imageURL', 'thumbnailURL', 'mediumURL', 'order', 'is_main']

    def get_imageURL(self, obj):
        return obj.imageURL()
        
    def get_thumbnailURL(self, obj):
        return obj.thumbnailURL()
        
    def get_mediumURL(self, obj):
        return obj.mediumURL()

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