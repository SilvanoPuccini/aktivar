from django.urls import path

from .views import MessageViewSet

app_name = 'chat'

urlpatterns = [
    path(
        'activities/<int:activity_id>/messages/',
        MessageViewSet.as_view({'get': 'list'}),
        name='activity-messages',
    ),
]
