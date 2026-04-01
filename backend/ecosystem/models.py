from django.conf import settings
from django.db import models
from django.utils.text import slugify
from django.utils import timezone


class Community(models.Model):
    CATEGORY_CHOICES = [
        ("mountain", "Mountain"),
        ("water", "Water"),
        ("air", "Air"),
        ("survival", "Survival"),
        ("road", "Road"),
    ]

    name = models.CharField(max_length=120)
    slug = models.SlugField(unique=True, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    tagline = models.CharField(max_length=120, blank=True, default="")
    description = models.TextField()
    cover_image = models.URLField(blank=True, default="")
    location_name = models.CharField(max_length=120, blank=True, default="")
    member_count = models.PositiveIntegerField(default=0)
    activity_label = models.CharField(max_length=50, blank=True, default="Weekly")
    cadence_label = models.CharField(max_length=50, blank=True, default="Weekly")
    is_featured = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["display_order", "name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class CommunityMembership(models.Model):
    community = models.ForeignKey(
        Community, on_delete=models.CASCADE, related_name="memberships"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="community_memberships",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["community", "user"]
        ordering = ["-created_at"]


class JournalStory(models.Model):
    title = models.CharField(max_length=180)
    slug = models.SlugField(unique=True, blank=True)
    category_label = models.CharField(
        max_length=80, blank=True, default="Expedition Story"
    )
    region_label = models.CharField(max_length=80, blank=True, default="")
    summary = models.TextField()
    body = models.TextField(blank=True, default="")
    author_name = models.CharField(max_length=120)
    cover_image = models.URLField(blank=True, default="")
    featured_quote = models.TextField(blank=True, default="")
    distance_km = models.DecimalField(max_digits=8, decimal_places=1, default=0)
    elevation_m = models.PositiveIntegerField(default=0)
    read_time_minutes = models.PositiveIntegerField(default=8)
    is_featured = models.BooleanField(default=False)
    is_trending = models.BooleanField(default=False)
    published_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-published_at"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class MarketplaceListing(models.Model):
    CATEGORY_CHOICES = [
        ("camping", "Camping"),
        ("climbing", "Climbing"),
        ("water_sports", "Water Sports"),
        ("tech", "Tech"),
        ("packs", "Packs"),
    ]
    CONDITION_CHOICES = [
        ("new", "New / Unused"),
        ("excellent", "Excellent"),
        ("good", "Good Condition"),
    ]

    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="gear_listings",
    )
    title = models.CharField(max_length=180)
    slug = models.SlugField(unique=True, blank=True)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    subcategory = models.CharField(max_length=80, blank=True, default="")
    condition = models.CharField(
        max_length=20, choices=CONDITION_CHOICES, default="good"
    )
    price = models.DecimalField(max_digits=10, decimal_places=2)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=4.5)
    location_name = models.CharField(max_length=120, blank=True, default="")
    cover_image = models.URLField(blank=True, default="")
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_featured", "-created_at"]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title) or "gear"
            candidate = base_slug
            suffix = 2
            while (
                MarketplaceListing.objects.exclude(pk=self.pk)
                .filter(slug=candidate)
                .exists()
            ):
                candidate = f"{base_slug}-{suffix}"
                suffix += 1
            self.slug = candidate
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class UserRankProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="rank_profile"
    )
    title = models.CharField(max_length=120, default="Trail Seeker")
    level = models.PositiveIntegerField(default=1)
    current_xp = models.PositiveIntegerField(default=0)
    next_level_xp = models.PositiveIntegerField(default=1000)
    total_distance_km = models.PositiveIntegerField(default=0)
    peak_elevation_m = models.PositiveIntegerField(default=0)
    group_saves = models.PositiveIntegerField(default=0)
    next_unlock = models.CharField(max_length=120, default="Advanced Trailmaster")
    updated_at = models.DateTimeField(auto_now=True)


class RankBadge(models.Model):
    name = models.CharField(max_length=120)
    icon = models.CharField(max_length=50, default="award")
    description = models.CharField(max_length=200)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "name"]

    def __str__(self):
        return self.name


class UserBadge(models.Model):
    rank_profile = models.ForeignKey(
        UserRankProfile, on_delete=models.CASCADE, related_name="badges"
    )
    badge = models.ForeignKey(
        RankBadge, on_delete=models.CASCADE, related_name="holders"
    )
    is_locked = models.BooleanField(default=False)
    earned_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ["rank_profile", "badge"]
        ordering = ["badge__display_order"]


class RankChallenge(models.Model):
    rank_profile = models.ForeignKey(
        UserRankProfile, on_delete=models.CASCADE, related_name="challenges"
    )
    title = models.CharField(max_length=140)
    description = models.CharField(max_length=220)
    progress = models.PositiveIntegerField(default=0)
    target = models.PositiveIntegerField(default=100)
    reward_label = models.CharField(max_length=50, blank=True, default="")
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["display_order", "id"]


class SafetyStatus(models.Model):
    RISK_CHOICES = [
        ("green", "Green"),
        ("warning", "Warning"),
        ("high", "High Risk"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="safety_status"
    )
    expedition_protocol = models.CharField(
        max_length=120, default="Expedition Protocol"
    )
    current_location = models.CharField(max_length=120, blank=True, default="")
    temperature_c = models.IntegerField(default=0)
    wind_kmh = models.PositiveIntegerField(default=0)
    visibility_m = models.PositiveIntegerField(default=0)
    risk_level = models.CharField(max_length=20, choices=RISK_CHOICES, default="green")
    storm_warning = models.CharField(max_length=220, blank=True, default="")
    system_status = models.CharField(max_length=60, default="All systems green")
    last_sync_at = models.DateTimeField(default=timezone.now)


class SafetyChecklist(models.Model):
    STATUS_CHOICES = [
        ("completed", "Completed"),
        ("incomplete", "Incomplete"),
        ("ready", "Ready"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="safety_checklist",
    )
    gear_progress = models.PositiveIntegerField(default=0)
    gear_target = models.PositiveIntegerField(default=10)
    route_status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="incomplete"
    )
    health_status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="incomplete"
    )
    permits_count = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)


class SafetyLogEntry(models.Model):
    SEVERITY_CHOICES = [
        ("info", "Info"),
        ("warning", "Warning"),
        ("critical", "Critical"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="safety_logs"
    )
    message = models.CharField(max_length=255)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default="info")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
