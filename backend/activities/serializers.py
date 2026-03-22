from django.utils import timezone
from rest_framework import serializers

from .models import Activity, ActivityParticipant, Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class OrganizerSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    avatar = serializers.URLField(read_only=True)


class ActivityParticipantSerializer(serializers.ModelSerializer):
    user = OrganizerSerializer(read_only=True)

    class Meta:
        model = ActivityParticipant
        fields = '__all__'


class ActivityListSerializer(serializers.ModelSerializer):
    spots_remaining = serializers.IntegerField(read_only=True)
    confirmed_count = serializers.IntegerField(read_only=True)
    organizer = OrganizerSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    participants_preview = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = [
            'id',
            'title',
            'description',
            'category',
            'cover_image',
            'organizer',
            'location_name',
            'latitude',
            'longitude',
            'meeting_point',
            'start_datetime',
            'end_datetime',
            'capacity',
            'price',
            'is_free',
            'status',
            'difficulty',
            'distance_km',
            'what_to_bring',
            'created_at',
            'updated_at',
            'spots_remaining',
            'confirmed_count',
            'participants_preview',
        ]

    def get_participants_preview(self, obj):
        confirmed = obj.participants.filter(status='confirmed')[:5]
        return [p.user.avatar for p in confirmed]


class ActivityDetailSerializer(ActivityListSerializer):
    participants = ActivityParticipantSerializer(many=True, read_only=True)

    class Meta(ActivityListSerializer.Meta):
        fields = ActivityListSerializer.Meta.fields + ['participants']


class ActivityCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = [
            'title',
            'description',
            'category',
            'cover_image',
            'location_name',
            'latitude',
            'longitude',
            'meeting_point',
            'start_datetime',
            'end_datetime',
            'capacity',
            'price',
            'difficulty',
            'distance_km',
            'what_to_bring',
        ]

    def validate_start_datetime(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError(
                'Start datetime must be in the future.'
            )
        return value

    def validate(self, attrs):
        start = attrs.get('start_datetime')
        end = attrs.get('end_datetime')
        if start and end and end <= start:
            raise serializers.ValidationError(
                {'end_datetime': 'End datetime must be after start datetime.'}
            )
        return attrs

    def create(self, validated_data):
        validated_data['organizer'] = self.context['request'].user
        price = validated_data.get('price', 0)
        validated_data['is_free'] = price == 0
        return super().create(validated_data)
