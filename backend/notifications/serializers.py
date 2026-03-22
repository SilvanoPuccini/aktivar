from rest_framework import serializers

from .models import Notification, PushSubscription


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id',
            'user',
            'notification_type',
            'title',
            'body',
            'data',
            'is_read',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'user',
            'notification_type',
            'title',
            'body',
            'data',
            'created_at',
        ]


class PushSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PushSubscription
        fields = ['id', 'user', 'endpoint', 'keys', 'is_active', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
