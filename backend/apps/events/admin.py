from django.contrib import admin
from django.core.exceptions import ObjectDoesNotExist

from apps.events.models import Event, EventLevel, EventProfile, EventType


@admin.register(EventProfile)
class EventProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "slug", "is_active", "sort_order")
    list_filter = ("is_active",)
    search_fields = ("name", "slug")
    ordering = ("sort_order", "name")


@admin.register(EventType)
class EventTypeAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "slug", "is_active", "sort_order")
    list_filter = ("is_active",)
    search_fields = ("name", "slug")
    ordering = ("sort_order", "name")


@admin.register(EventLevel)
class EventLevelAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "slug", "is_active", "sort_order")
    list_filter = ("is_active",)
    search_fields = ("name", "slug")
    ordering = ("sort_order", "name")


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "event_type",
        "level",
        "participation_type",
        "is_active",
        "registration_deadline",
        "legacy_olympiad",
    )
    list_filter = ("event_type", "level", "participation_type", "is_active")
    search_fields = ("title", "organizer", "legacy_olympiad__title")
    filter_horizontal = ("profiles",)

    @admin.display(description="Legacy Olympiad")
    def legacy_olympiad(self, obj):
        try:
            return obj.legacy_olympiad
        except ObjectDoesNotExist:
            return None
