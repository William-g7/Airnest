from django.http import JsonResponse
from rest_framework.decorators import api_view

from .models import Conversation, ConversationMessage
from .serializers import ConversationSerializer

@api_view(['GET'])
def get_conversations(request):
    conversations = Conversation.objects.filter(participants=request.user)
    serializer = ConversationSerializer(conversations, many=True)
    return JsonResponse(serializer.data, safe=False)
