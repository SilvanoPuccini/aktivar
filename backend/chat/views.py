from rest_framework import viewsets, permissions

from .models import Message
from .serializers import MessageSerializer


class MessageViewSet(viewsets.ReadOnlyModelViewSet):
    """List messages for a given activity."""

    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        activity_id = self.kwargs['activity_id']
        return (
            Message.objects.filter(activity_id=activity_id)
            .select_related('author')
            .prefetch_related('reactions')
        )
