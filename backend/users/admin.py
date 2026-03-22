from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import CustomUser, DriverProfile, UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = [
        'email',
        'full_name',
        'role',
        'is_verified_email',
        'is_active',
        'is_staff',
        'created_at',
    ]
    list_filter = ['role', 'is_verified_email', 'is_active', 'is_staff']
    search_fields = ['email', 'full_name', 'phone']
    ordering = ['-created_at']
    inlines = [UserProfileInline]

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (
            'Personal Info',
            {'fields': ('full_name', 'phone', 'avatar', 'bio', 'role')},
        ),
        (
            'Verification',
            {'fields': ('is_verified_email', 'is_verified_phone')},
        ),
        (
            'Permissions',
            {
                'fields': (
                    'is_active',
                    'is_staff',
                    'is_superuser',
                    'groups',
                    'user_permissions',
                )
            },
        ),
        ('Important dates', {'fields': ('last_login', 'deleted_at')}),
    )

    add_fieldsets = (
        (
            None,
            {
                'classes': ('wide',),
                'fields': (
                    'email',
                    'full_name',
                    'password1',
                    'password2',
                    'role',
                    'is_staff',
                    'is_active',
                ),
            },
        ),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'location_name', 'total_activities', 'total_km']
    search_fields = ['user__email', 'user__full_name', 'location_name']


@admin.register(DriverProfile)
class DriverProfileAdmin(admin.ModelAdmin):
    list_display = [
        'user',
        'license_number',
        'license_expiry',
        'is_verified_driver',
        'driver_rating',
        'total_trips',
    ]
    list_filter = ['is_verified_driver']
    search_fields = ['user__email', 'user__full_name', 'license_number']
