from django.contrib import admin

from .models import Activity, ActivityParticipant, Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'icon', 'color', 'is_outdoor', 'order']
    prepopulated_fields = {'slug': ('name',)}


class ActivityParticipantInline(admin.TabularInline):
    model = ActivityParticipant
    extra = 0
    readonly_fields = ['joined_at']


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = [
        'title',
        'category',
        'organizer',
        'start_datetime',
        'status',
        'capacity',
        'price',
        'is_free',
    ]
    list_filter = ['status', 'category', 'is_free', 'difficulty']
    search_fields = ['title', 'description', 'location_name']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [ActivityParticipantInline]


@admin.register(ActivityParticipant)
class ActivityParticipantAdmin(admin.ModelAdmin):
    list_display = ['user', 'activity', 'status', 'is_revealed', 'joined_at']
    list_filter = ['status', 'is_revealed']
    search_fields = ['user__email', 'user__full_name', 'activity__title']
