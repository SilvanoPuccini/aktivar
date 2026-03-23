from rest_framework import serializers

from core.sanitization import SanitizeMixin

from .models import Report, Review


class UserBriefSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    avatar = serializers.URLField(read_only=True)


class ReviewSerializer(serializers.ModelSerializer):
    reviewer = UserBriefSerializer(read_only=True)
    reviewee = UserBriefSerializer(read_only=True)

    class Meta:
        model = Review
        fields = [
            'id',
            'reviewer',
            'reviewee',
            'activity',
            'rating',
            'comment',
            'created_at',
        ]
        read_only_fields = ['id', 'reviewer', 'created_at']


class ReviewCreateSerializer(SanitizeMixin, serializers.ModelSerializer):
    sanitize_fields = ['comment']

    class Meta:
        model = Review
        fields = ['reviewee', 'rating', 'comment']

    def validate(self, attrs):
        request = self.context['request']
        activity = self.context['activity']
        reviewee = attrs['reviewee']

        if request.user == reviewee:
            raise serializers.ValidationError('You cannot review yourself.')

        if Review.objects.filter(
            reviewer=request.user,
            reviewee=reviewee,
            activity=activity,
        ).exists():
            raise serializers.ValidationError(
                'You have already reviewed this user for this activity.'
            )

        return attrs


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = [
            'id',
            'reporter',
            'reported_user',
            'activity',
            'reason',
            'description',
            'status',
            'created_at',
            'resolved_at',
        ]
        read_only_fields = ['id', 'reporter', 'status', 'created_at', 'resolved_at']


class ReportCreateSerializer(SanitizeMixin, serializers.ModelSerializer):
    sanitize_fields = ['description']

    class Meta:
        model = Report
        fields = ['reported_user', 'activity', 'reason', 'description']
