from rest_framework import serializers

from .models import ActivityStory, ActivitySwipe, AvailabilityStatus, Squad, SquadMember


class ActivityStorySerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    author_avatar = serializers.URLField(source='author.avatar', read_only=True)
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = ActivityStory
        fields = [
            'id', 'activity', 'author', 'author_name', 'author_avatar',
            'image', 'caption', 'created_at', 'expires_at', 'is_expired',
        ]
        read_only_fields = ['id', 'author', 'created_at', 'expires_at']


class SquadMemberSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    avatar = serializers.URLField(source='user.avatar', read_only=True)

    class Meta:
        model = SquadMember
        fields = ['id', 'user', 'full_name', 'avatar', 'is_active', 'joined_at']
        read_only_fields = ['id', 'joined_at']


class SquadSerializer(serializers.ModelSerializer):
    squad_members = SquadMemberSerializer(many=True, read_only=True)
    member_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Squad
        fields = ['id', 'name', 'creator', 'squad_members', 'member_count', 'created_at']
        read_only_fields = ['id', 'creator', 'created_at']


class SquadCreateSerializer(serializers.ModelSerializer):
    member_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False, default=[]
    )

    class Meta:
        model = Squad
        fields = ['name', 'member_ids']

    def validate_member_ids(self, value):
        if len(value) > 7:  # Max 8 including creator
            raise serializers.ValidationError('A squad can have at most 8 members.')
        return value

    def create(self, validated_data):
        member_ids = validated_data.pop('member_ids', [])
        squad = Squad.objects.create(
            name=validated_data['name'],
            creator=self.context['request'].user,
        )
        # Add creator as member
        SquadMember.objects.create(squad=squad, user=self.context['request'].user)
        # Add other members
        from users.models import CustomUser
        for uid in member_ids:
            try:
                user = CustomUser.objects.get(id=uid, deleted_at__isnull=True)
                SquadMember.objects.get_or_create(squad=squad, user=user)
            except CustomUser.DoesNotExist:
                pass
        return squad


class AvailabilityStatusSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_avatar = serializers.URLField(source='user.avatar', read_only=True)
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = AvailabilityStatus
        fields = [
            'id', 'user', 'user_name', 'user_avatar', 'message',
            'available_date', 'latitude', 'longitude',
            'created_at', 'expires_at', 'is_expired',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'expires_at']


class ActivitySwipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivitySwipe
        fields = ['id', 'user', 'activity', 'interested', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
