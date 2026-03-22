import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from activities.models import ActivityParticipant
from chat.models import Message
from chat.serializers import MessageSerializer


class ActivityChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.activity_id = self.scope['url_route']['kwargs']['activity_id']
        self.group_name = f"activity_{self.activity_id}_chat"
        self.user = self.scope['user']

        if self.user.is_anonymous:
            await self.close()
            return

        is_participant = await self.check_participant()
        if not is_participant:
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        messages = await self.get_last_messages()
        await self.send(text_data=json.dumps({
            'type': 'message_history',
            'messages': messages,
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get('type', 'message')

        if msg_type == 'typing':
            await self.channel_layer.group_send(self.group_name, {
                'type': 'typing_indicator',
                'user_id': self.user.id,
                'full_name': self.user.full_name,
            })
            return

        content = data.get('content', '').strip()
        if not content:
            return

        message_type = data.get('message_type', 'text')
        message_data = await self.save_message(content, message_type)

        await self.channel_layer.group_send(self.group_name, {
            'type': 'chat_message',
            'message': message_data,
        })

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': event['message'],
        }))

    async def typing_indicator(self, event):
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'user_id': event['user_id'],
                'full_name': event['full_name'],
            }))

    @database_sync_to_async
    def check_participant(self):
        return ActivityParticipant.objects.filter(
            activity_id=self.activity_id,
            user=self.user,
            status='confirmed',
        ).exists()

    @database_sync_to_async
    def get_last_messages(self):
        messages = Message.objects.filter(
            activity_id=self.activity_id
        ).select_related('author').order_by('-created_at')[:50]
        serializer = MessageSerializer(reversed(list(messages)), many=True)
        return serializer.data

    @database_sync_to_async
    def save_message(self, content, message_type):
        message = Message.objects.create(
            activity_id=self.activity_id,
            author=self.user,
            content=content,
            message_type=message_type,
        )
        serializer = MessageSerializer(message)
        return serializer.data
