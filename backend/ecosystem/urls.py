from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CommunityViewSet,
    JournalStoryViewSet,
    MarketplaceListingViewSet,
    RankDashboardView,
    SafetyChecklistUpdateView,
    SafetyDashboardView,
    SafetySOSView,
)

router = DefaultRouter()
router.register(r'communities', CommunityViewSet, basename='community')
router.register(r'journal', JournalStoryViewSet, basename='journal-story')
router.register(r'marketplace', MarketplaceListingViewSet, basename='marketplace-listing')

urlpatterns = [
    path('', include(router.urls)),
    path('rank/', RankDashboardView.as_view(), name='rank-dashboard'),
    path('safety/', SafetyDashboardView.as_view(), name='safety-dashboard'),
    path('safety/initiate-sos/', SafetySOSView.as_view(), name='safety-initiate-sos'),
    path('safety/checklist/', SafetyChecklistUpdateView.as_view(), name='safety-checklist'),
]
