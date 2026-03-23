from django.conf import settings
from django.db import models
from django.utils import timezone

try:
    from django_fsm import FSMField, transition
    HAS_FSM = True
except ImportError:
    HAS_FSM = False


class Category(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, default='compass')
    color = models.CharField(max_length=7, default='#FFC56C')
    is_outdoor = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'name']
        verbose_name_plural = 'categories'

    def __str__(self):
        return self.name


class Activity(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('moderate', 'Moderate'),
        ('hard', 'Hard'),
        ('expert', 'Expert'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name='activities'
    )
    cover_image = models.URLField(blank=True, default='')
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='organized_activities',
    )
    location_name = models.CharField(max_length=300)
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    meeting_point = models.CharField(max_length=300, blank=True, default='')
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    capacity = models.PositiveIntegerField(default=20)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_free = models.BooleanField(default=True)

    # Use FSMField when django-fsm is installed, otherwise regular CharField
    if HAS_FSM:
        status = FSMField(
            max_length=20, choices=STATUS_CHOICES, default='draft', protected=True
        )
    else:
        status = models.CharField(
            max_length=20, choices=STATUS_CHOICES, default='draft'
        )

    difficulty = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        default='moderate',
        blank=True,
    )
    distance_km = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True
    )
    what_to_bring = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_datetime']
        verbose_name_plural = 'activities'
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['start_datetime']),
            models.Index(fields=['status']),
            models.Index(fields=['organizer']),
        ]

    def __str__(self):
        return self.title

    @property
    def spots_remaining(self):
        return max(
            0,
            self.capacity
            - self.participants.filter(status='confirmed').count(),
        )

    @property
    def is_full(self):
        return self.spots_remaining == 0

    @property
    def confirmed_count(self):
        return self.participants.filter(status='confirmed').count()

    # ── FSM Transitions ──────────────────────────────────────────
    if HAS_FSM:
        @transition(field=status, source='draft', target='published')
        def publish(self):
            """Publish activity: draft → published."""
            pass

        @transition(field=status, source=['draft', 'published'], target='cancelled')
        def cancel(self):
            """Cancel activity: draft|published → cancelled."""
            pass

        @transition(field=status, source='published', target='completed')
        def complete(self):
            """Complete activity: published → completed."""
            pass
    else:
        def publish(self):
            if self.status != 'draft':
                raise ValueError('Can only publish from draft state.')
            self.status = 'published'

        def cancel(self):
            if self.status not in ('draft', 'published'):
                raise ValueError('Can only cancel from draft or published state.')
            self.status = 'cancelled'

        def complete(self):
            if self.status != 'published':
                raise ValueError('Can only complete from published state.')
            self.status = 'completed'


class ActivityParticipant(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('waitlisted', 'Waitlisted'),
        ('cancelled', 'Cancelled'),
    ]

    activity = models.ForeignKey(
        Activity, on_delete=models.CASCADE, related_name='participants'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='participations',
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='pending'
    )
    is_revealed = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['activity', 'user']
        ordering = ['joined_at']

    def __str__(self):
        return f'{self.user} - {self.activity}'


# ── Stories (post-event, 48h TTL) ─────────────────────────────────

class ActivityStory(models.Model):
    """Post-event group story visible for 48 hours to attendees only."""
    activity = models.ForeignKey(
        Activity, on_delete=models.CASCADE, related_name='stories'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='stories'
    )
    image = models.URLField()
    caption = models.CharField(max_length=500, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['activity', 'expires_at']),
        ]

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    def save(self, *args, **kwargs):
        if not self.expires_at:
            from datetime import timedelta
            self.expires_at = timezone.now() + timedelta(hours=48)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Story by {self.author} for {self.activity}"


# ── Squads (permanent friend groups) ──────────────────────────────

class Squad(models.Model):
    """Permanent group of up to 8 friends with priority booking."""
    name = models.CharField(max_length=100)
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_squads'
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL, through='SquadMember', related_name='squads'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def member_count(self):
        return self.squad_members.filter(is_active=True).count()


class SquadMember(models.Model):
    squad = models.ForeignKey(
        Squad, on_delete=models.CASCADE, related_name='squad_members'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE
    )
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['squad', 'user']
        ordering = ['joined_at']

    def __str__(self):
        return f"{self.user} in {self.squad}"


# ── Availability Status (24h TTL) ────────────────────────────────

class AvailabilityStatus(models.Model):
    """User availability status visible for 24 hours, filterable by zone."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='availability_statuses'
    )
    message = models.CharField(max_length=200)
    available_date = models.DateField()
    latitude = models.DecimalField(
        max_digits=10, decimal_places=7, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=10, decimal_places=7, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['expires_at']),
            models.Index(fields=['available_date']),
        ]

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    def save(self, *args, **kwargs):
        if not self.expires_at:
            from datetime import timedelta
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user}: {self.message}"


# ── Activity Swipe (interest tracking) ────────────────────────────

class ActivitySwipe(models.Model):
    """Track user interest in activities for match notifications."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='swipes'
    )
    activity = models.ForeignKey(
        Activity, on_delete=models.CASCADE, related_name='swipes'
    )
    interested = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'activity']
        ordering = ['-created_at']

    def __str__(self):
        action = 'interested' if self.interested else 'passed'
        return f"{self.user} {action} {self.activity}"
