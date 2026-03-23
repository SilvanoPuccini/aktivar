from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .social_views import (
    ActivityStoryViewSet,
    ActivitySwipeViewSet,
    AvailabilityStatusViewSet,
    SquadViewSet,
)
from .views import ActivityViewSet, CategoryViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'activities', ActivityViewSet, basename='activity')
router.register(r'squads', SquadViewSet, basename='squad')
router.register(r'availability', AvailabilityStatusViewSet, basename='availability')
router.register(r'swipes', ActivitySwipeViewSet, basename='swipe')

urlpatterns = [
    path('', include(router.urls)),
    # Stories nested under activity
    path(
        'activities/<int:activity_id>/stories/',
        ActivityStoryViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='activity-stories',
    ),
]
