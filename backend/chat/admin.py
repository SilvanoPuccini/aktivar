from django.contrib import admin

from .models import Message, Reaction


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'author', 'activity', 'message_type', 'created_at']
    list_filter = ['message_type', 'created_at']
    search_fields = ['content', 'author__full_name']
    raw_id_fields = ['author', 'activity']


@admin.register(Reaction)
class ReactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'message', 'user', 'emoji', 'created_at']
    raw_id_fields = ['message', 'user']
