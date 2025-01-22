from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'avatar_url', 'date_joined']
        read_only_fields = ['id', 'email', 'date_joined']

class LandlordSerializer(serializers.ModelSerializer):
    properties_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'name','avatar_url', 'properties_count']

    def get_properties_count(self, obj):
        return obj.properties.count()
