from django.contrib import admin

from .models import Report, Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'reviewer', 'reviewee', 'activity', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['reviewer__full_name', 'reviewee__full_name', 'comment']
    raw_id_fields = ['reviewer', 'reviewee', 'activity']


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['id', 'reporter', 'reported_user', 'reason', 'status', 'created_at']
    list_filter = ['status', 'reason', 'created_at']
    search_fields = ['reporter__full_name', 'description']
    raw_id_fields = ['reporter', 'reported_user', 'activity']
