from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html

from .models import CustomUser, DriverProfile, UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    readonly_fields = ['avg_rating', 'total_reviews']


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
    list_display = ['user', 'location_name', 'total_activities', 'total_km', 'avg_rating', 'total_reviews']
    search_fields = ['user__email', 'user__full_name', 'location_name']
    readonly_fields = ['avg_rating', 'total_reviews']


@admin.register(DriverProfile)
class DriverProfileAdmin(admin.ModelAdmin):
    list_display = [
        'user',
        'license_number',
        'license_expiry',
        'is_verified_driver',
        'driver_rating',
        'total_trips',
        'license_photo_preview',
        'verification_status',
    ]
    list_filter = ['is_verified_driver']
    search_fields = ['user__email', 'user__full_name', 'license_number']
    actions = ['approve_drivers', 'reject_drivers']
    readonly_fields = ['license_photo_preview', 'driver_rating', 'total_trips']

    fieldsets = (
        ('Driver Info', {
            'fields': ('user', 'license_number', 'license_photo', 'license_photo_preview', 'license_expiry'),
        }),
        ('Verification', {
            'fields': ('is_verified_driver',),
            'description': 'Review the license photo and expiry date before approving.',
        }),
        ('Stats', {
            'fields': ('driver_rating', 'total_trips', 'vehicle_info'),
        }),
    )

    @admin.display(description='License Photo')
    def license_photo_preview(self, obj):
        if obj.license_photo:
            return format_html(
                '<a href="{url}" target="_blank">'
                '<img src="{url}" style="max-height:120px; max-width:200px; '
                'border-radius:8px; border:1px solid #ccc;" />'
                '</a>',
                url=obj.license_photo,
            )
        return '—'

    @admin.display(description='Status')
    def verification_status(self, obj):
        if obj.is_verified_driver:
            return format_html(
                '<span style="color:#22c55e; font-weight:bold;">Aprobado</span>'
            )
        return format_html(
            '<span style="color:#ef4444; font-weight:bold;">Pendiente</span>'
        )

    @admin.action(description='Aprobar conductores seleccionados')
    def approve_drivers(self, request, queryset):
        from django.utils import timezone
        updated = queryset.filter(
            is_verified_driver=False,
            license_expiry__gt=timezone.now().date(),
        ).update(is_verified_driver=True)
        expired = queryset.filter(
            license_expiry__lte=timezone.now().date(),
        ).count()

        if updated:
            self.message_user(
                request,
                f'{updated} conductor(es) aprobado(s).',
                messages.SUCCESS,
            )
        if expired:
            self.message_user(
                request,
                f'{expired} conductor(es) con licencia vencida no fueron aprobados.',
                messages.WARNING,
            )

    @admin.action(description='Rechazar conductores seleccionados')
    def reject_drivers(self, request, queryset):
        updated = queryset.filter(is_verified_driver=True).update(
            is_verified_driver=False
        )
        self.message_user(
            request,
            f'{updated} conductor(es) rechazado(s).',
            messages.SUCCESS,
        )
