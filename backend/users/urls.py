from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    RegisterView,
    RequestEmailVerificationView,
    RequestPhoneVerificationView,
    UserViewSet,
    VerifyEmailView,
    VerifyPhoneView,
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    # Email verification
    path('verify-email/request/', RequestEmailVerificationView.as_view(), name='request-email-verification'),
    path('verify-email/confirm/', VerifyEmailView.as_view(), name='verify-email'),
    # Phone verification (OTP)
    path('verify-phone/request/', RequestPhoneVerificationView.as_view(), name='request-phone-verification'),
    path('verify-phone/confirm/', VerifyPhoneView.as_view(), name='verify-phone'),
]
