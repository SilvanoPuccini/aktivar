"""
Views for social features: Stories, Squads, Availability, Swipes, Content Moderation.
"""

import logging

from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    Activity,
    ActivityParticipant,
    ActivityStory,
    ActivitySwipe,
    AvailabilityStatus,
    Squad,
    SquadMember,
)
from .social_serializers import (
    ActivityStorySerializer,
    ActivitySwipeSerializer,
    AvailabilityStatusSerializer,
    SquadCreateSerializer,
    SquadSerializer,
)

logger = logging.getLogger(__name__)


# ── Stories ────────────────────────────────────────────────────────

class ActivityStoryViewSet(
    mixins.ListModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet
):
    """Post-event stories visible for 48h to attendees only."""
    serializer_class = ActivityStorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        activity_id = self.kwargs.get('activity_id')
        return ActivityStory.objects.filter(
            activity_id=activity_id,
            expires_at__gt=timezone.now(),
        ).select_related('author')

    def create(self, request, *args, **kwargs):
        activity_id = self.kwargs.get('activity_id')

        try:
            activity = Activity.objects.get(id=activity_id, status='completed')
        except Activity.DoesNotExist:
            return Response(
                {'detail': 'Activity not found or not yet completed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Only confirmed participants can post stories
        if not ActivityParticipant.objects.filter(
            activity=activity, user=request.user, status='confirmed'
        ).exists():
            return Response(
                {'detail': 'Only confirmed participants can post stories.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(author=request.user, activity=activity)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ── Squads ─────────────────────────────────────────────────────────

class SquadViewSet(viewsets.ModelViewSet):
    """Manage permanent friend squads (max 8 members)."""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Squad.objects.filter(
            squad_members__user=self.request.user,
            squad_members__is_active=True,
        ).prefetch_related('squad_members', 'squad_members__user').distinct()

    def get_serializer_class(self):
        if self.action in ('create',):
            return SquadCreateSerializer
        return SquadSerializer

    @action(detail=True, methods=['post'], url_path='add-member')
    def add_member(self, request, pk=None):
        squad = self.get_object()
        if squad.creator != request.user:
            return Response(
                {'detail': 'Only the squad creator can add members.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if squad.member_count >= 8:
            return Response(
                {'detail': 'Squad is full (max 8 members).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_id = request.data.get('user_id')
        from users.models import CustomUser
        try:
            user = CustomUser.objects.get(id=user_id, deleted_at__isnull=True)
        except CustomUser.DoesNotExist:
            return Response(
                {'detail': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        _, created = SquadMember.objects.get_or_create(squad=squad, user=user)
        if not created:
            return Response(
                {'detail': 'User is already in this squad.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({'detail': 'Member added.'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='remove-member')
    def remove_member(self, request, pk=None):
        squad = self.get_object()
        if squad.creator != request.user:
            return Response(
                {'detail': 'Only the squad creator can remove members.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        user_id = request.data.get('user_id')
        try:
            member = SquadMember.objects.get(squad=squad, user_id=user_id)
            member.is_active = False
            member.save(update_fields=['is_active'])
            return Response({'detail': 'Member removed.'})
        except SquadMember.DoesNotExist:
            return Response(
                {'detail': 'Member not found in squad.'},
                status=status.HTTP_404_NOT_FOUND,
            )


# ── Availability Status ───────────────────────────────────────────

class AvailabilityStatusViewSet(
    mixins.ListModelMixin, mixins.CreateModelMixin,
    mixins.DestroyModelMixin, viewsets.GenericViewSet
):
    """Post availability status (24h TTL), filterable by zone."""
    serializer_class = AvailabilityStatusSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = AvailabilityStatus.objects.filter(
            expires_at__gt=timezone.now()
        ).select_related('user')

        # Filter by zone (lat/lng + radius_km)
        lat = self.request.query_params.get('lat')
        lng = self.request.query_params.get('lng')
        radius_km = self.request.query_params.get('radius_km', '50')

        if lat and lng:
            from decimal import Decimal
            lat = Decimal(lat)
            lng = Decimal(lng)
            r = Decimal(radius_km)
            # Approximate bounding box
            delta = r / Decimal('111')
            qs = qs.filter(
                latitude__range=(lat - delta, lat + delta),
                longitude__range=(lng - delta, lng + delta),
            )

        return qs

    def perform_create(self, serializer):
        # Delete previous unexpired statuses for this user
        AvailabilityStatus.objects.filter(
            user=self.request.user, expires_at__gt=timezone.now()
        ).delete()
        serializer.save(user=self.request.user)


# ── Activity Swipe ─────────────────────────────────────────────────

class ActivitySwipeViewSet(
    mixins.CreateModelMixin, viewsets.GenericViewSet
):
    """Swipe right (interested) or left (pass) on activities."""
    serializer_class = ActivitySwipeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ActivitySwipe.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        activity_id = request.data.get('activity')
        interested = request.data.get('interested', True)

        swipe, created = ActivitySwipe.objects.update_or_create(
            user=request.user,
            activity_id=activity_id,
            defaults={'interested': interested},
        )

        # Check for match notification (N users interested → notify)
        if interested:
            interest_count = ActivitySwipe.objects.filter(
                activity_id=activity_id, interested=True
            ).count()
            if interest_count >= 3 and interest_count % 3 == 0:
                # Notify all interested users about group interest
                from notifications.tasks import send_notification
                try:
                    activity = Activity.objects.get(id=activity_id)
                    interested_users = ActivitySwipe.objects.filter(
                        activity_id=activity_id, interested=True
                    ).values_list('user_id', flat=True)
                    for uid in interested_users:
                        send_notification.delay(
                            uid, 'system',
                            f'{interest_count} personas interesadas',
                            f'{interest_count} personas estan interesadas en "{activity.title}". Unite!',
                            {'activity_id': activity_id},
                        )
                except Activity.DoesNotExist:
                    pass

        serializer = self.get_serializer(swipe)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


# ── Content Moderation ─────────────────────────────────────────────

class ContentModerationMixin:
    """Mixin to moderate activity descriptions before publishing."""

    def moderate_content(self, text):
        """
        Check content with OpenAI moderation API.
        Returns (is_safe, categories) tuple.
        """
        import requests
        from django.conf import settings

        api_key = getattr(settings, 'OPENAI_API_KEY', '')
        if not api_key:
            logger.warning('OPENAI_API_KEY not set, skipping moderation')
            return True, {}

        try:
            response = requests.post(
                'https://api.openai.com/v1/moderations',
                headers={
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json',
                },
                json={'input': text},
                timeout=5,
            )
            response.raise_for_status()
            data = response.json()
            result = data['results'][0]
            flagged = result.get('flagged', False)
            categories = {
                k: v for k, v in result.get('categories', {}).items() if v
            }
            return not flagged, categories
        except Exception as e:
            logger.error('OpenAI moderation error: %s', str(e))
            return True, {}  # Allow on failure (fail open)
