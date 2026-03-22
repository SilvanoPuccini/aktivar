from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('organizer', 'Organizer'),
        ('driver', 'Driver'),
    ]

    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True, unique=True)
    full_name = models.CharField(max_length=150)
    avatar = models.URLField(blank=True, default='')
    bio = models.TextField(max_length=500, blank=True, default='')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    is_verified_email = models.BooleanField(default=False)
    is_verified_phone = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    objects = CustomUserManager()

    class Meta:
        ordering = ['-created_at']

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    @property
    def display_name(self):
        return self.full_name or self.email.split('@')[0]

    @property
    def can_organize(self):
        return self.is_verified_email and self.role in ('organizer', 'driver')

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save()

    def __str__(self):
        return self.display_name


class UserProfile(models.Model):
    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name='profile'
    )
    location_name = models.CharField(max_length=200, blank=True, default='')
    latitude = models.DecimalField(
        max_digits=10, decimal_places=7, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=10, decimal_places=7, null=True, blank=True
    )
    bio_extended = models.TextField(blank=True, default='')
    website = models.URLField(blank=True, default='')
    instagram = models.CharField(max_length=50, blank=True, default='')
    total_activities = models.PositiveIntegerField(default=0)
    total_km = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_people_met = models.PositiveIntegerField(default=0)
    badges = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"Profile of {self.user.display_name}"


class DriverProfile(models.Model):
    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name='driver_profile'
    )
    license_number = models.CharField(max_length=50)
    license_photo = models.URLField(blank=True, default='')
    license_expiry = models.DateField()
    is_verified_driver = models.BooleanField(default=False)
    driver_rating = models.DecimalField(max_digits=3, decimal_places=2, default=5.0)
    total_trips = models.PositiveIntegerField(default=0)
    vehicle_info = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Driver: {self.user.display_name}"


@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
