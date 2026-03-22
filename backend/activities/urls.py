from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ActivityViewSet, CategoryViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'activities', ActivityViewSet, basename='activity')

urlpatterns = [
    path('', include(router.urls)),
]
