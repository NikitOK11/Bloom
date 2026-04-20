from django.contrib import admin

from apps.events.models import Event, EventEdition, EventEditionStage, EventLevel, EventProfile, EventType


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
        "name",
        "title",
        "event_type_code",
        "event_type",
        "profile_code",
        "level_code",
        "level",
        "participation_mode",
        "participation_type",
        "is_active",
        "registration_deadline",
    )
    list_filter = (
        "event_type_code",
        "event_type",
        "level_code",
        "level",
        "participation_mode",
        "participation_type",
        "is_active",
    )
    search_fields = ("name", "title", "organizer")
    filter_horizontal = ("profiles",)


@admin.register(EventEdition)
class EventEditionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "event",
        "edition_label",
        "status",
        "total_stages",
        "current_stage",
        "start_date",
        "end_date",
    )
    list_filter = ("status",)
    search_fields = ("event__title", "edition_label")


@admin.register(EventEditionStage)
class EventEditionStageAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "edition",
        "stage_number",
        "stage_name",
        "status",
        "start_date",
        "end_date",
    )
    list_filter = ("status",)
    search_fields = ("stage_name", "edition__edition_label")
