from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ReportViewSet, ReviewViewSet

app_name = 'reviews'

router = DefaultRouter()
router.register(r'', ReviewViewSet, basename='review')
router.register(r'reports', ReportViewSet, basename='report')

urlpatterns = [
    path('', include(router.urls)),
]
