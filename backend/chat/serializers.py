from rest_framework import serializers

from .models import Message, Reaction


class MessageAuthorSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    avatar = serializers.URLField(read_only=True)


class ReactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reaction
        fields = ['id', 'message', 'user', 'emoji', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class MessageSerializer(serializers.ModelSerializer):
    author = MessageAuthorSerializer(read_only=True)
    reactions = ReactionSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = [
            'id',
            'activity',
            'author',
            'content',
            'message_type',
            'reactions',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']
