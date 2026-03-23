from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
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

    @method_decorator(cache_page(60 * 30))  # 30 min cache
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


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

    def list(self, request, *args, **kwargs):
        """Activity list with 5-minute Redis cache keyed by query params."""
        cache_key = f"activities:list:{request.GET.urlencode()}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, timeout=60 * 5)  # 5 min
        return response

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

    # ── Organizer Dashboard ───────────────────────────────────────────

    @action(detail=False, methods=['get'], url_path='dashboard')
    def organizer_dashboard(self, request):
        """Dashboard stats for the current organizer."""
        from django.db.models import Avg, Count, Sum

        user = request.user
        my_activities = Activity.objects.filter(organizer=user)

        total = my_activities.count()
        by_status = dict(
            my_activities.values_list('status')
            .annotate(count=Count('id'))
            .values_list('status', 'count')
        )

        # Participant stats
        participant_stats = (
            ActivityParticipant.objects.filter(
                activity__organizer=user,
                status='confirmed',
            ).aggregate(
                total_participants=Count('id'),
                unique_participants=Count('user_id', distinct=True),
            )
        )

        # Revenue stats
        from payments.models import Payment
        revenue = Payment.objects.filter(
            activity__organizer=user,
            status='succeeded',
        ).aggregate(
            total_revenue=Sum('amount'),
            total_fees=Sum('platform_fee'),
            total_payout=Sum('organizer_payout'),
        )

        # Average rating from reviews
        from reviews.models import Review
        rating_stats = Review.objects.filter(
            activity__organizer=user,
        ).aggregate(
            avg_rating=Avg('rating'),
            total_reviews=Count('id'),
        )

        # Recent activities with participant count
        recent = (
            my_activities.order_by('-created_at')[:10]
            .values('id', 'title', 'status', 'start_datetime', 'capacity')
        )
        recent_list = list(recent)
        for act in recent_list:
            act['confirmed'] = ActivityParticipant.objects.filter(
                activity_id=act['id'], status='confirmed'
            ).count()

        return Response({
            'total_activities': total,
            'by_status': by_status,
            'participants': {
                'total': participant_stats['total_participants'] or 0,
                'unique': participant_stats['unique_participants'] or 0,
            },
            'revenue': {
                'total': float(revenue['total_revenue'] or 0),
                'fees': float(revenue['total_fees'] or 0),
                'payout': float(revenue['total_payout'] or 0),
            },
            'ratings': {
                'average': round(float(rating_stats['avg_rating'] or 0), 2),
                'total_reviews': rating_stats['total_reviews'] or 0,
            },
            'recent_activities': recent_list,
        })

    @action(detail=False, methods=['get'], url_path='dashboard/export')
    def export_csv(self, request):
        """Export organizer activities as CSV."""
        import csv
        from django.http import HttpResponse

        user = request.user
        my_activities = Activity.objects.filter(organizer=user).select_related('category')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="aktivar_activities.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'ID', 'Título', 'Categoría', 'Estado', 'Fecha inicio',
            'Capacidad', 'Inscritos', 'Precio', 'Ubicación',
        ])

        for act in my_activities:
            confirmed = act.participants.filter(status='confirmed').count()
            writer.writerow([
                act.id,
                act.title,
                act.category.name if act.category else '',
                act.get_status_display() if hasattr(act, 'get_status_display') else act.status,
                act.start_datetime.strftime('%Y-%m-%d %H:%M'),
                act.capacity,
                confirmed,
                float(act.price),
                act.location_name,
            ])

        return response
