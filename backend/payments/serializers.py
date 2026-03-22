from rest_framework import serializers

from .models import Payment, Subscription


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id',
            'user',
            'activity',
            'amount',
            'currency',
            'stripe_payment_intent_id',
            'status',
            'description',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'user',
            'stripe_payment_intent_id',
            'status',
            'created_at',
            'updated_at',
        ]


class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = [
            'id',
            'user',
            'plan',
            'stripe_subscription_id',
            'stripe_customer_id',
            'status',
            'current_period_end',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'user',
            'stripe_subscription_id',
            'stripe_customer_id',
            'status',
            'current_period_end',
            'created_at',
            'updated_at',
        ]
