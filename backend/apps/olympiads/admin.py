from django.contrib import admin

from apps.olympiads.models import Olympiad
from apps.teams.models import Team


class TeamInline(admin.TabularInline):
    model = Team
    fields = ("name", "description", "is_open", "owner")
    extra = 1


@admin.register(Olympiad)
class OlympiadAdmin(admin.ModelAdmin):
    fieldsets = (
        (
            "Legacy compatibility",
            {
                "fields": ("event",),
                "description": "Olympiad is a legacy compatibility layer. Edit event-like data in Events.",
            },
        ),
        ("Legacy olympiad fields", {"fields": ("title", "season", "description", "is_active")}),
    )
    list_display = ("id", "title", "season", "event", "is_active", "created_at")
    search_fields = ("title", "season", "event__title")
    list_filter = ("is_active", "event__event_type")
    inlines = [TeamInline]
