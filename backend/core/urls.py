from django.urls import path

from .views import HealthCheckView, ImageUploadView

app_name = 'core'

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('images/upload/', ImageUploadView.as_view(), name='image-upload'),
]
