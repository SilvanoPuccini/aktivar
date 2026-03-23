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
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')

urlpatterns = [
    path('', include(router.urls)),
    path('webhook/stripe/', StripeWebhookView.as_view(), name='stripe-webhook'),
    path('connect/onboarding/', ConnectOnboardingView.as_view(), name='connect-onboarding'),
    path('connect/dashboard/', ConnectDashboardView.as_view(), name='connect-dashboard'),
]
