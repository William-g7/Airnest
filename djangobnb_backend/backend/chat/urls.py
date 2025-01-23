from django.urls import path

from .api import get_conversations

urlpatterns = [
    path('', get_conversations, name='conversation_list'),
]
