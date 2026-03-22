from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import NotificationViewSet, PushSubscriptionViewSet

app_name = 'notifications'

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'push-subscriptions', PushSubscriptionViewSet, basename='push-subscription')

urlpatterns = [
    path('', include(router.urls)),
]
