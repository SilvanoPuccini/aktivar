from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import TripViewSet, VehicleViewSet

router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'trips', TripViewSet, basename='trip')

urlpatterns = [
    path('', include(router.urls)),
]
