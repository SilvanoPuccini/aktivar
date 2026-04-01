from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from transport.models import EmergencyContact, Trip

from .models import (
    Community,
    CommunityMembership,
    JournalStory,
    MarketplaceListing,
    SafetyChecklist,
    SafetyLogEntry,
    SafetyStatus,
    UserRankProfile,
)
from .serializers import (
    CommunitySerializer,
    JournalStorySerializer,
    MarketplaceListingCreateSerializer,
    MarketplaceListingSerializer,
    RankDashboardSerializer,
    SafetyChecklistSerializer,
    SafetyDashboardSerializer,
    SafetyLogEntrySerializer,
    SafetySOSSerializer,
    SafetyStatusSerializer,
)


class CommunityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Community.objects.all()
    serializer_class = CommunitySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None
    search_fields = ['name', 'description']

    @action(detail=False, methods=['get'])
    def featured(self, request):
        community = Community.objects.filter(is_featured=True).first() or Community.objects.first()
        serializer = self.get_serializer(community)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def join(self, request, pk=None):
        community = self.get_object()
        membership, created = CommunityMembership.objects.get_or_create(community=community, user=request.user)
        if created:
            community.member_count += 1
            community.save(update_fields=['member_count'])
        serializer = self.get_serializer(community)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class JournalStoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = JournalStory.objects.all()
    serializer_class = JournalStorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None
    search_fields = ['title', 'summary', 'author_name']

    @action(detail=False, methods=['get'])
    def featured(self, request):
        story = JournalStory.objects.filter(is_featured=True).first() or JournalStory.objects.first()
        serializer = self.get_serializer(story)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def trending(self, request):
        stories = JournalStory.objects.filter(is_trending=True)[:5]
        serializer = self.get_serializer(stories, many=True)
        return Response(serializer.data)


class MarketplaceListingViewSet(viewsets.ModelViewSet):
    queryset = MarketplaceListing.objects.filter(is_active=True)
    search_fields = ['title', 'subcategory', 'location_name']
    ordering_fields = ['price', 'created_at', 'rating']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return MarketplaceListingCreateSerializer
        return MarketplaceListingSerializer

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)


class RankDashboardView(generics.RetrieveAPIView):
    serializer_class = RankDashboardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        profile, _ = UserRankProfile.objects.get_or_create(user=self.request.user)
        return profile


class SafetyDashboardView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SafetyDashboardSerializer

    def get(self, request):
        status_obj, _ = SafetyStatus.objects.get_or_create(user=request.user)
        checklist, _ = SafetyChecklist.objects.get_or_create(user=request.user)
        contacts = []
        emergency = EmergencyContact.objects.filter(user=request.user).first()
        if emergency:
            contacts.append({
                'contact_name': emergency.contact_name,
                'contact_phone': emergency.contact_phone,
                'relationship': emergency.relationship,
            })
        contacts.extend([
            {'contact_name': 'Regional SAR Alpine', 'contact_phone': '104 Alpine', 'relationship': 'Local rescue'},
            {'contact_name': 'Emergency HQ (Aktivar)', 'contact_phone': 'Global monitoring', 'relationship': 'Platform support'},
        ])
        trip = (
            Trip.objects.filter(driver=request.user).order_by('-departure_time').first()
            or Trip.objects.filter(passengers__user=request.user).order_by('-departure_time').first()
        )
        logs = SafetyLogEntry.objects.filter(user=request.user)[:5]
        payload = {
            'status': SafetyStatusSerializer(status_obj).data,
            'checklist': SafetyChecklistSerializer(checklist).data,
            'contacts': contacts,
            'logs': SafetyLogEntrySerializer(logs, many=True).data,
            'active_trip': {
                'id': trip.id,
                'destination_name': trip.destination_name,
                'origin_name': trip.origin_name,
            } if trip else None,
        }
        serializer = self.get_serializer(payload)
        return Response(serializer.data)


class SafetySOSView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SafetySOSSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        alert = serializer.save()
        return Response({'id': alert.id, 'detail': 'SOS emitido correctamente.'}, status=status.HTTP_201_CREATED)


class SafetyChecklistUpdateView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SafetyChecklistSerializer

    def get_object(self):
        checklist, _ = SafetyChecklist.objects.get_or_create(user=self.request.user)
        return checklist
