from rest_framework import serializers

from .models import Trip, TripPassenger, TripStop, Vehicle


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = [
            'id',
            'owner',
            'brand',
            'model_name',
            'color',
            'plate',
            'capacity',
            'photo',
            'year',
            'created_at',
        ]
        read_only_fields = ['id', 'owner', 'created_at']


class TripStopSerializer(serializers.ModelSerializer):
    class Meta:
        model = TripStop
        fields = [
            'id',
            'trip',
            'name',
            'latitude',
            'longitude',
            'order',
            'estimated_time',
        ]
        read_only_fields = ['id']


class PassengerUserSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    avatar = serializers.URLField(read_only=True)


class TripPassengerSerializer(serializers.ModelSerializer):
    user = PassengerUserSerializer(read_only=True)

    class Meta:
        model = TripPassenger
        fields = [
            'id',
            'trip',
            'user',
            'pickup_stop',
            'status',
            'paid',
            'booked_at',
        ]
        read_only_fields = ['id', 'booked_at']


class DriverSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    avatar = serializers.URLField(read_only=True)
    driver_rating = serializers.SerializerMethodField()

    def get_driver_rating(self, obj):
        try:
            return float(obj.driver_profile.driver_rating)
        except Exception:
            return None


class TripListSerializer(serializers.ModelSerializer):
    driver = DriverSummarySerializer(read_only=True)
    stops_count = serializers.SerializerMethodField()
    seats_remaining = serializers.IntegerField(read_only=True)
    seats_taken = serializers.IntegerField(read_only=True)

    class Meta:
        model = Trip
        fields = [
            'id',
            'driver',
            'vehicle',
            'activity',
            'origin_name',
            'origin_latitude',
            'origin_longitude',
            'destination_name',
            'destination_latitude',
            'destination_longitude',
            'departure_time',
            'estimated_arrival',
            'price_per_passenger',
            'available_seats',
            'seats_remaining',
            'seats_taken',
            'status',
            'notes',
            'stops_count',
            'created_at',
            'updated_at',
        ]

    def get_stops_count(self, obj):
        return obj.stops.count()


class TripDetailSerializer(TripListSerializer):
    stops = TripStopSerializer(many=True, read_only=True)
    passengers = TripPassengerSerializer(many=True, read_only=True)
    vehicle = VehicleSerializer(read_only=True)

    class Meta(TripListSerializer.Meta):
        fields = TripListSerializer.Meta.fields + [
            'stops',
            'passengers',
        ]


class TripCreateSerializer(serializers.ModelSerializer):
    stops = TripStopSerializer(many=True, required=False)

    class Meta:
        model = Trip
        fields = [
            'id',
            'vehicle',
            'activity',
            'origin_name',
            'origin_latitude',
            'origin_longitude',
            'destination_name',
            'destination_latitude',
            'destination_longitude',
            'departure_time',
            'estimated_arrival',
            'price_per_passenger',
            'available_seats',
            'notes',
            'stops',
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        user = self.context['request'].user
        try:
            if not user.driver_profile.is_verified_driver:
                raise serializers.ValidationError(
                    'You must have a verified driver profile to create trips.'
                )
        except AttributeError:
            raise serializers.ValidationError(
                'You must have a verified driver profile to create trips.'
            )
        return attrs

    def create(self, validated_data):
        stops_data = validated_data.pop('stops', [])
        validated_data['driver'] = self.context['request'].user
        trip = Trip.objects.create(**validated_data)
        for stop_data in stops_data:
            TripStop.objects.create(trip=trip, **stop_data)
        return trip

    def update(self, instance, validated_data):
        stops_data = validated_data.pop('stops', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if stops_data is not None:
            instance.stops.all().delete()
            for stop_data in stops_data:
                TripStop.objects.create(trip=instance, **stop_data)
        return instance
