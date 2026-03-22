from rest_framework import mixins, permissions, status, viewsets
from rest_framework.response import Response

from activities.models import Activity, ActivityParticipant

from .models import Report, Review
from .serializers import (
    ReportCreateSerializer,
    ReportSerializer,
    ReviewCreateSerializer,
    ReviewSerializer,
)


class ReviewViewSet(
    mixins.ListModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet
):
    """List and create reviews for an activity."""

    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return ReviewCreateSerializer
        return ReviewSerializer

    def get_queryset(self):
        return Review.objects.select_related('reviewer', 'reviewee').all()

    def list(self, request, *args, **kwargs):
        activity_id = request.query_params.get('activity')
        qs = self.get_queryset()
        if activity_id:
            qs = qs.filter(activity_id=activity_id)
        serializer = ReviewSerializer(qs, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        activity_id = request.data.get('activity')
        try:
            activity = Activity.objects.get(id=activity_id)
        except Activity.DoesNotExist:
            return Response(
                {'detail': 'Activity not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if activity.status != 'completed':
            return Response(
                {'detail': 'Reviews can only be submitted for completed activities.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_participant = ActivityParticipant.objects.filter(
            activity=activity, user=request.user, status='confirmed'
        ).exists()
        is_organizer = activity.organizer == request.user

        if not is_participant and not is_organizer:
            return Response(
                {'detail': 'Only participants can leave reviews.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ReviewCreateSerializer(
            data=request.data,
            context={'request': request, 'activity': activity},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(reviewer=request.user, activity=activity)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ReportViewSet(
    mixins.ListModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet
):
    """Create reports and list own reports."""

    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return ReportCreateSerializer
        return ReportSerializer

    def get_queryset(self):
        return Report.objects.filter(reporter=self.request.user)

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)
