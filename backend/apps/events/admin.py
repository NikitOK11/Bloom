from django.contrib import admin

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
    )
    list_filter = ("event_type", "level", "participation_type", "is_active")
    search_fields = ("title", "organizer")
    filter_horizontal = ("profiles",)
