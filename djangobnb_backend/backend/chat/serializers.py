from rest_framework import serializers

from .models import Conversation, ConversationMessage
from useraccount.serializers import UserSerializer

class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True)

    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'created_at', 'updated_at']
