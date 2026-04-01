from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ConnectDashboardView,
    ConnectOnboardingView,
    PaymentViewSet,
    StripeWebhookView,
    SubscriptionViewSet,
)

app_name = 'payments'

router = DefaultRouter()
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')
router.register(r'', PaymentViewSet, basename='payment')

urlpatterns = [
    # Explicit paths before router to avoid pk capture
    path('webhook/stripe/', StripeWebhookView.as_view(), name='stripe-webhook'),
    path('connect/onboarding/', ConnectOnboardingView.as_view(), name='connect-onboarding'),
    path('connect/dashboard/', ConnectDashboardView.as_view(), name='connect-dashboard'),
    path('', include(router.urls)),
]
