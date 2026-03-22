from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from .models import Trip, TripPassenger, Vehicle
from .permissions import IsDriverVerified, IsTripDriver
from .serializers import (
    TripCreateSerializer,
    TripDetailSerializer,
    TripListSerializer,
    VehicleSerializer,
)


class VehicleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Vehicle.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.select_related('driver', 'vehicle').prefetch_related(
        'stops', 'passengers', 'passengers__user'
    )
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'list':
            return TripListSerializer
        if self.action == 'retrieve':
            return TripDetailSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return TripCreateSerializer
        return TripListSerializer

    def get_permissions(self):
        if self.action in ('create',):
            return [IsAuthenticated(), IsDriverVerified()]
        if self.action in ('update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsTripDriver()]
        return super().get_permissions()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def book_seat(self, request, pk=None):
        trip = self.get_object()

        if trip.driver == request.user:
            return Response(
                {'detail': 'You cannot book a seat on your own trip.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if trip.status != 'planned':
            return Response(
                {'detail': 'This trip is not available for booking.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if trip.seats_remaining <= 0:
            return Response(
                {'detail': 'No seats available on this trip.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if TripPassenger.objects.filter(trip=trip, user=request.user).exclude(status='cancelled').exists():
            return Response(
                {'detail': 'You have already booked this trip.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pickup_stop_id = request.data.get('pickup_stop')
        passenger = TripPassenger.objects.create(
            trip=trip,
            user=request.user,
            pickup_stop_id=pickup_stop_id,
            status='confirmed',
        )

        return Response(
            {
                'detail': 'Seat booked successfully.',
                'booking_id': passenger.id,
                'seats_remaining': trip.seats_remaining,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def cancel_booking(self, request, pk=None):
        trip = self.get_object()

        try:
            passenger = TripPassenger.objects.get(
                trip=trip, user=request.user, status__in=['pending', 'confirmed']
            )
        except TripPassenger.DoesNotExist:
            return Response(
                {'detail': 'You do not have an active booking for this trip.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        passenger.status = 'cancelled'
        passenger.save()

        return Response(
            {
                'detail': 'Booking cancelled successfully.',
                'seats_remaining': trip.seats_remaining,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_trips(self, request):
        driven = Trip.objects.filter(driver=request.user)
        booked = Trip.objects.filter(
            passengers__user=request.user,
            passengers__status__in=['pending', 'confirmed'],
        )
        trips = (driven | booked).distinct().order_by('-departure_time')
        serializer = TripListSerializer(trips, many=True, context={'request': request})
        return Response(serializer.data)
