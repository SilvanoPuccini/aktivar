from django.conf import settings
from django.db import models


class Vehicle(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='vehicles')
    brand = models.CharField(max_length=50)
    model_name = models.CharField(max_length=50)
    color = models.CharField(max_length=30)
    plate = models.CharField(max_length=20)
    capacity = models.PositiveIntegerField(default=4)
    photo = models.URLField(blank=True, default='')
    year = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.brand} {self.model_name} ({self.plate})"

    class Meta:
        ordering = ['-created_at']


class Trip(models.Model):
    STATUS_CHOICES = [
        ('planned', 'Planned'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    driver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='driven_trips')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='trips')
    activity = models.ForeignKey('activities.Activity', on_delete=models.SET_NULL, null=True, blank=True, related_name='trips')
    origin_name = models.CharField(max_length=300)
    origin_latitude = models.DecimalField(max_digits=10, decimal_places=7)
    origin_longitude = models.DecimalField(max_digits=10, decimal_places=7)
    destination_name = models.CharField(max_length=300)
    destination_latitude = models.DecimalField(max_digits=10, decimal_places=7)
    destination_longitude = models.DecimalField(max_digits=10, decimal_places=7)
    departure_time = models.DateTimeField()
    estimated_arrival = models.DateTimeField(null=True, blank=True)
    price_per_passenger = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    available_seats = models.PositiveIntegerField(default=3)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planned')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def seats_taken(self):
        return self.passengers.filter(status='confirmed').count()

    @property
    def seats_remaining(self):
        return max(0, self.available_seats - self.seats_taken)

    @property
    def total_cost(self):
        return self.price_per_passenger * self.seats_taken if self.seats_taken > 0 else self.price_per_passenger

    def __str__(self):
        return f"Trip: {self.origin_name} \u2192 {self.destination_name}"

    class Meta:
        ordering = ['-departure_time']


class TripStop(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='stops')
    name = models.CharField(max_length=300)
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    order = models.PositiveIntegerField()
    estimated_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Stop {self.order}: {self.name}"

    class Meta:
        ordering = ['order']
        unique_together = ['trip', 'order']


class TripPassenger(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='passengers')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='trip_bookings')
    pickup_stop = models.ForeignKey(TripStop, on_delete=models.SET_NULL, null=True, blank=True, related_name='pickups')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    paid = models.BooleanField(default=False)
    booked_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} on {self.trip}"

    class Meta:
        unique_together = ['trip', 'user']
        ordering = ['booked_at']
