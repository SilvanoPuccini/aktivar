from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied

from activities.models import Activity, ActivityParticipant

from .models import Message
from .serializers import MessageSerializer


class MessageViewSet(viewsets.ReadOnlyModelViewSet):
    """List messages for a given activity. Only confirmed participants or the
    organizer may read the history — mirrors the check already enforced on
    the WebSocket connection in chat/consumers.py."""

    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        activity_id = self.kwargs['activity_id']
        user = self.request.user

        is_organizer = Activity.objects.filter(id=activity_id, organizer=user).exists()
        is_participant = ActivityParticipant.objects.filter(
            activity_id=activity_id, user=user, status='confirmed'
        ).exists()
        if not (is_organizer or is_participant):
            raise PermissionDenied('You do not have access to this activity chat.')

        return (
            Message.objects.filter(activity_id=activity_id)
            .select_related('author')
            .prefetch_related('reactions')
        )
