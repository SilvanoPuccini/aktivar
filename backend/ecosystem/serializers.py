from django.db import transaction
from rest_framework import serializers

from transport.models import EmergencyAlert, EmergencyContact, Trip

from .models import (
    Community,
    CommunityMembership,
    JournalStory,
    MarketplaceListing,
    RankChallenge,
    SafetyChecklist,
    SafetyLogEntry,
    SafetyStatus,
    UserBadge,
    UserRankProfile,
)


class CommunitySerializer(serializers.ModelSerializer):
    is_joined = serializers.SerializerMethodField()

    class Meta:
        model = Community
        fields = ['id', 'name', 'slug', 'category', 'tagline', 'description', 'cover_image', 'location_name', 'member_count', 'activity_label', 'cadence_label', 'is_featured', 'is_joined']

    def get_is_joined(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return CommunityMembership.objects.filter(community=obj, user=request.user).exists()


class JournalStorySerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalStory
        fields = ['id', 'title', 'slug', 'category_label', 'region_label', 'summary', 'body', 'author_name', 'cover_image', 'featured_quote', 'distance_km', 'elevation_m', 'read_time_minutes', 'is_featured', 'is_trending', 'published_at']


class MarketplaceListingSerializer(serializers.ModelSerializer):
    seller_name = serializers.SerializerMethodField()

    class Meta:
        model = MarketplaceListing
        fields = ['id', 'title', 'slug', 'category', 'subcategory', 'condition', 'price', 'rating', 'location_name', 'cover_image', 'is_featured', 'seller_name', 'created_at']

    def get_seller_name(self, obj):
        return obj.seller.full_name if obj.seller else 'Aktivar Community'


class MarketplaceListingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketplaceListing
        fields = ['title', 'category', 'subcategory', 'condition', 'price', 'location_name', 'cover_image']

    def create(self, validated_data):
        validated_data['seller'] = self.context['request'].user
        return super().create(validated_data)


class UserBadgeSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='badge.name', read_only=True)
    icon = serializers.CharField(source='badge.icon', read_only=True)
    description = serializers.CharField(source='badge.description', read_only=True)

    class Meta:
        model = UserBadge
        fields = ['id', 'name', 'icon', 'description', 'is_locked', 'earned_at']


class RankChallengeSerializer(serializers.ModelSerializer):
    percent = serializers.SerializerMethodField()

    class Meta:
        model = RankChallenge
        fields = ['id', 'title', 'description', 'progress', 'target', 'reward_label', 'percent']

    def get_percent(self, obj):
        return int((obj.progress / obj.target) * 100) if obj.target else 0


class RankDashboardSerializer(serializers.ModelSerializer):
    badges = UserBadgeSerializer(many=True, read_only=True)
    challenges = RankChallengeSerializer(many=True, read_only=True)

    class Meta:
        model = UserRankProfile
        fields = ['title', 'level', 'current_xp', 'next_level_xp', 'total_distance_km', 'peak_elevation_m', 'group_saves', 'next_unlock', 'badges', 'challenges']


class EmergencyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyContact
        fields = ['contact_name', 'contact_phone', 'relationship']


class SafetyChecklistSerializer(serializers.ModelSerializer):
    class Meta:
        model = SafetyChecklist
        fields = ['gear_progress', 'gear_target', 'route_status', 'health_status', 'permits_count', 'updated_at']


class SafetyLogEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = SafetyLogEntry
        fields = ['id', 'message', 'severity', 'created_at']


class SafetyStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = SafetyStatus
        fields = ['expedition_protocol', 'current_location', 'temperature_c', 'wind_kmh', 'visibility_m', 'risk_level', 'storm_warning', 'system_status', 'last_sync_at']


class SafetyDashboardSerializer(serializers.Serializer):
    status = SafetyStatusSerializer()
    checklist = SafetyChecklistSerializer()
    contacts = serializers.ListField()
    logs = SafetyLogEntrySerializer(many=True)
    active_trip = serializers.DictField(allow_null=True)


class SafetySOSSerializer(serializers.Serializer):
    message = serializers.CharField(required=False, allow_blank=True, max_length=255)

    def save(self, **kwargs):
        user = self.context['request'].user
        trip = (
            Trip.objects.filter(driver=user).order_by('-departure_time').first()
            or Trip.objects.filter(passengers__user=user).order_by('-departure_time').first()
        )
        if not trip:
            raise serializers.ValidationError({'detail': 'No hay un viaje asociado para emitir SOS.'})

        with transaction.atomic():
            alert = EmergencyAlert.objects.create(
                trip=trip,
                triggered_by=user,
                latitude=trip.origin_latitude,
                longitude=trip.origin_longitude,
                message=self.validated_data.get('message', ''),
            )
            SafetyLogEntry.objects.create(
                user=user,
                severity='critical',
                message=f'SOS emitido para {trip.destination_name}.',
            )
        return alert
