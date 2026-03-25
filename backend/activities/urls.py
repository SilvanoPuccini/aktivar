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
# Activities at root level — included at /api/v1/activities/ so full URL is /api/v1/activities/
router.register(r'', ActivityViewSet, basename='activity')
router.register(r'squads', SquadViewSet, basename='squad')
router.register(r'availability', AvailabilityStatusViewSet, basename='availability')
router.register(r'swipes', ActivitySwipeViewSet, basename='swipe')

urlpatterns = [
    # Stories must come before router to avoid router's detail pk catching the path
    path(
        '<int:activity_id>/stories/',
        ActivityStoryViewSet.as_view({'get': 'list', 'post': 'create'}),
        name='activity-stories',
    ),
    path('', include(router.urls)),
]
