from django.contrib import admin

from .models import Payment, StripeEvent, Subscription


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'activity', 'amount', 'currency', 'status', 'created_at']
    list_filter = ['status', 'currency', 'created_at']
    search_fields = ['user__full_name', 'stripe_payment_intent_id', 'description']
    raw_id_fields = ['user', 'activity']
    readonly_fields = ['stripe_payment_intent_id', 'created_at', 'updated_at']


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'plan', 'status', 'current_period_end', 'created_at']
    list_filter = ['plan', 'status']
    search_fields = ['user__full_name', 'stripe_subscription_id', 'stripe_customer_id']
    raw_id_fields = ['user']
    readonly_fields = ['stripe_subscription_id', 'stripe_customer_id', 'created_at', 'updated_at']


@admin.register(StripeEvent)
class StripeEventAdmin(admin.ModelAdmin):
    list_display = ['id', 'stripe_event_id', 'event_type', 'processed', 'created_at', 'processed_at']
    list_filter = ['event_type', 'processed', 'created_at']
    search_fields = ['stripe_event_id', 'event_type']
    readonly_fields = ['stripe_event_id', 'event_type', 'data', 'created_at']
