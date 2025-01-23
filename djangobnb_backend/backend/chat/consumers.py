import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import AsyncWebsocketConsumer

from .models import Conversation

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.conversation = await Conversation.objects.get(id=self.conversation_id)
        
        await self.channel_layer.group_add(self.conversation_id, self.channel_name)
        self.accept()
        await self.send(text_data=json.dumps({'message': 'Connected to the chat'}))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.conversation_id, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']
        await self.channel_layer.group_send(self.conversation_id, {'type': 'chat_message', 'message': message})