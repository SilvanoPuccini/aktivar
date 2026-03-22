from django.contrib import admin

from .models import Notification, PushSubscription


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'notification_type', 'title', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['user__full_name', 'title', 'body']
    raw_id_fields = ['user']
    readonly_fields = ['created_at']


@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'endpoint', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['user__full_name', 'endpoint']
    raw_id_fields = ['user']
