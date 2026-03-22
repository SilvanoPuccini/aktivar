from django.contrib import admin

from .models import Trip, TripPassenger, TripStop, Vehicle


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ['id', 'owner', 'brand', 'model_name', 'plate', 'capacity', 'year', 'created_at']
    list_filter = ['brand', 'year']
    search_fields = ['owner__email', 'owner__full_name', 'brand', 'model_name', 'plate']
    raw_id_fields = ['owner']


class TripStopInline(admin.TabularInline):
    model = TripStop
    extra = 0
    ordering = ['order']


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'driver',
        'origin_name',
        'destination_name',
        'departure_time',
        'status',
        'available_seats',
        'created_at',
    ]
    list_filter = ['status', 'departure_time']
    search_fields = [
        'driver__email',
        'driver__full_name',
        'origin_name',
        'destination_name',
    ]
    raw_id_fields = ['driver', 'vehicle', 'activity']
    inlines = [TripStopInline]


@admin.register(TripPassenger)
class TripPassengerAdmin(admin.ModelAdmin):
    list_display = ['id', 'trip', 'user', 'status', 'paid', 'booked_at']
    list_filter = ['status', 'paid']
    search_fields = ['user__email', 'user__full_name']
    raw_id_fields = ['trip', 'user', 'pickup_stop']
