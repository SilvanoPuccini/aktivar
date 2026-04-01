"""
URL configuration for AKTIVAR project.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)

from django.http import JsonResponse
from users.views import AuthTokenObtainPairView


def health_check(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("api/v1/health/", health_check, name="health_check"),
    path("admin/", admin.site.urls),
    # JWT Authentication (rate limited)
    path("api/v1/auth/token/", AuthTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/v1/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/v1/auth/token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    # API v1 - App routes
    path("api/v1/users/", include("users.urls")),
    path("api/v1/activities/", include("activities.urls")),
    path("api/v1/transport/", include("transport.urls")),
    path("api/v1/chat/", include("chat.urls")),
    path("api/v1/reviews/", include("reviews.urls")),
    path("api/v1/payments/", include("payments.urls")),
    path("api/v1/notifications/", include("notifications.urls")),
    path("api/v1/core/", include("core.urls")),
    path("api/v1/ecosystem/", include("ecosystem.urls")),
]

# API docs and media files only in development
if settings.DEBUG:
    from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

    urlpatterns += [
        path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
        path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    ]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
