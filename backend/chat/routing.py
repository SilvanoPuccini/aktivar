from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(
        r'ws/chat/activity/(?P<activity_id>\d+)/$',
        consumers.ActivityChatConsumer.as_asgi(),
    ),
]
