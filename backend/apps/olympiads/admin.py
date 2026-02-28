from django.contrib import admin

from apps.olympiads.models import Olympiad
from apps.teams.models import Team


class TeamInline(admin.TabularInline):
    model = Team
    fields = ("name", "description", "is_open", "owner")
    extra = 1


@admin.register(Olympiad)
class OlympiadAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "season", "is_active", "created_at")
    search_fields = ("title", "season")
    list_filter = ("is_active",)
    inlines = [TeamInline]
