import json
from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils.timezone import now

from .models import ConversationMessage


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'

        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close(code=4401)
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        payload = data.get('data') or {}
        body = payload.get('body', '').strip()
        if not body:
            return

        client_id = payload.get('clientId')  # 前端乐观 UI 用
        sent_to_id = payload.get('sent_to_id')

        msg = await self.save_message(
            conversation_id=self.conversation_id,
            body=body,
            sent_to_id=sent_to_id,
        )

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'payload': {
                    'id': str(msg.id),
                    'conversation_id': str(msg.conversation_id),
                    'body': msg.body,
                    'created_by_id': str(msg.created_by_id),
                    'sent_to_id': str(msg.sent_to_id),
                    'created_at': msg.created_at.isoformat(),
                    'clientId': client_id,  # 用于前端去重
                }
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message.created',
            'payload': event['payload'],
        }))

    @sync_to_async
    def save_message(self, conversation_id, body, sent_to_id):
        user = self.scope['user']
        return ConversationMessage.objects.create(
            conversation_id=conversation_id,
            body=body,
            sent_to_id=sent_to_id,
            created_by=user,
            created_at=now(),
        )
