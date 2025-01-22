from rest_framework import serializers
from .models import Property, PropertyImage
from useraccount.serializers import UserSerializer

class PropertyImageSerializer(serializers.ModelSerializer):
    imageURL = serializers.SerializerMethodField()

    class Meta:
        model = PropertyImage
        fields = ['imageURL']

    def get_imageURL(self, obj):
        return obj.imageURL()

class PropertySerializer(serializers.ModelSerializer):
    images = PropertyImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Property
        fields = [
            'id', 'title', 'description', 'price_per_night',
            'category', 'place_type', 'bedrooms', 'bathrooms',
            'guests', 'beds', 'country', 'state', 'city',
            'address', 'postal_code', 'landlord', 'created_at',
            'images'
        ]


class PropertyLandlordSerializer(serializers.ModelSerializer):
    landlord = UserSerializer(read_only=True, many=False)
    images = PropertyImageSerializer(many=True, read_only=True)
    class Meta:
        model = Property
        fields = ['id', 'title', 'description', 'price_per_night',
            'category', 'place_type', 'bedrooms', 'bathrooms',
            'guests', 'beds', 'country', 'state', 'city',
            'address', 'postal_code', 'landlord', 'created_at',
            'images']