from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from users.views import JoinRateThrottle

from .filters import ActivityFilter
from .models import Activity, ActivityParticipant, Category
from .serializers import (
    ActivityCreateSerializer,
    ActivityDetailSerializer,
    ActivityListSerializer,
    ActivityParticipantSerializer,
    CategorySerializer,
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.select_related(
        'organizer', 'category'
    ).prefetch_related('participants')
    filterset_class = ActivityFilter
    search_fields = ['title', 'description', 'location_name']
    ordering_fields = ['start_datetime', 'price', 'created_at']

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return ActivityCreateSerializer
        if self.action == 'retrieve':
            return ActivityDetailSerializer
        return ActivityListSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        # Content moderation before publishing
        from .social_views import ContentModerationMixin
        moderator = ContentModerationMixin()
        description = serializer.validated_data.get('description', '')
        title = serializer.validated_data.get('title', '')
        is_safe, categories = moderator.moderate_content(f"{title} {description}")
        if not is_safe:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({
                'detail': 'Content flagged by moderation.',
                'categories': categories,
            })
        serializer.save(organizer=self.request.user)

    @action(detail=True, methods=['post'], url_path='join', throttle_classes=[JoinRateThrottle])
    def join_activity(self, request, pk=None):
        activity = self.get_object()
        user = request.user

        if ActivityParticipant.objects.filter(
            activity=activity, user=user
        ).exclude(status='cancelled').exists():
            return Response(
                {'detail': 'You have already joined this activity.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if activity.is_full:
            participant_status = 'waitlisted'
        else:
            participant_status = 'confirmed'

        participant = ActivityParticipant.objects.create(
            activity=activity,
            user=user,
            status=participant_status,
        )

        serializer = ActivityParticipantSerializer(participant)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='leave')
    def leave_activity(self, request, pk=None):
        activity = self.get_object()
        user = request.user

        try:
            participant = ActivityParticipant.objects.get(
                activity=activity, user=user
            )
        except ActivityParticipant.DoesNotExist:
            return Response(
                {'detail': 'You are not a participant of this activity.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        was_confirmed = participant.status == 'confirmed'
        participant.status = 'cancelled'
        participant.save()

        # Promote first waitlisted user if a confirmed spot opened up
        if was_confirmed:
            waitlisted = (
                ActivityParticipant.objects.filter(
                    activity=activity, status='waitlisted'
                )
                .order_by('joined_at')
                .first()
            )
            if waitlisted:
                waitlisted.status = 'confirmed'
                waitlisted.save()

        return Response(
            {'detail': 'You have left the activity.'},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['get'], url_path='participants')
    def participants(self, request, pk=None):
        activity = self.get_object()
        participants = activity.participants.select_related('user').exclude(
            status='cancelled'
        )
        serializer = ActivityParticipantSerializer(participants, many=True)
        return Response(serializer.data)

    # ── FSM Transition Endpoints ──────────────────────────────────

    @action(detail=True, methods=['post'], url_path='publish')
    def publish_activity(self, request, pk=None):
        activity = self.get_object()
        if activity.organizer != request.user:
            return Response(
                {'detail': 'Only the organizer can publish this activity.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            activity.publish()
            activity.save()
            return Response({'detail': 'Activity published.', 'status': activity.status})
        except (ValueError, Exception) as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel_activity(self, request, pk=None):
        activity = self.get_object()
        if activity.organizer != request.user:
            return Response(
                {'detail': 'Only the organizer can cancel this activity.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            activity.cancel()
            activity.save()
            return Response({'detail': 'Activity cancelled.', 'status': activity.status})
        except (ValueError, Exception) as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='complete')
    def complete_activity(self, request, pk=None):
        activity = self.get_object()
        if activity.organizer != request.user:
            return Response(
                {'detail': 'Only the organizer can complete this activity.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            activity.complete()
            activity.save()
            return Response({'detail': 'Activity completed.', 'status': activity.status})
        except (ValueError, Exception) as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
