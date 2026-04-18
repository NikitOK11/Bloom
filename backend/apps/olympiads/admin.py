from django.contrib import admin

from apps.olympiads.models import Olympiad
from apps.teams.models import Team


class TeamInline(admin.TabularInline):
    model = Team
    fields = ("name", "event", "description", "is_open", "owner", "created_at", "updated_at")
    readonly_fields = fields
    extra = 0
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Olympiad)
class OlympiadAdmin(admin.ModelAdmin):
    fieldsets = (
        (
            "Legacy compatibility",
            {
                "fields": ("event",),
                "description": "Olympiad is deprecated and read-only. Edit product-facing event data in Events.",
            },
        ),
        (
            "Legacy olympiad fields",
            {"fields": ("title", "season", "description", "is_active", "created_at", "updated_at")},
        ),
    )
    list_display = ("id", "title", "season", "event", "is_active", "created_at", "updated_at")
    search_fields = ("title", "season", "event__title")
    list_filter = ("is_active", ("event", admin.EmptyFieldListFilter), "event__event_type")
    readonly_fields = ("event", "title", "season", "description", "is_active", "created_at", "updated_at")
    inlines = [TeamInline]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
