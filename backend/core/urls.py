from django.urls import path

from .views import HealthCheckView, ImageUploadView, OpenGraphActivityView, SitemapView

app_name = 'core'

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('images/upload/', ImageUploadView.as_view(), name='image-upload'),
    path('sitemap.xml', SitemapView.as_view(), name='sitemap'),
    path('og/activity/<int:activity_id>/', OpenGraphActivityView.as_view(), name='og-activity'),
]
