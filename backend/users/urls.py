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
router.register(r'', UserViewSet, basename='user')

urlpatterns = [
    # Explicit paths MUST come before the router to avoid the router's
    # detail pattern (^(?P<pk>[^/.]+)/$) catching 'register/' as a pk.
    path('register/', RegisterView.as_view(), name='register'),
    # Email verification
    path('verify-email/request/', RequestEmailVerificationView.as_view(), name='request-email-verification'),
    path('verify-email/confirm/', VerifyEmailView.as_view(), name='verify-email'),
    # Phone verification (OTP)
    path('verify-phone/request/', RequestPhoneVerificationView.as_view(), name='request-phone-verification'),
    path('verify-phone/confirm/', VerifyPhoneView.as_view(), name='verify-phone'),
    # Router (UserViewSet: /me/, /me/profile/, /me/delete/)
    path('', include(router.urls)),
]
