from django.contrib import admin

from apps.events.models import (
    Event,
    EventEdition,
    EventEditionAdmissionBenefit,
    EventEditionStage,
    EventLevel,
    EventProfile,
    EventType,
    University,
    UniversityProgram,
)


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
    fields = (
        "name",
        "event_type_code",
        "profile_code",
        "level_code",
        "participation_mode",
        "eligible_groups",
        "official_url",
        "is_active",
        "title",
        "event_type",
        "profiles",
        "level",
        "participation_type",
        "short_description",
        "description",
        "organizer",
        "preferences",
        "registration_deadline",
    )
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
        "eligible_groups",
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
    search_fields = ("event__name", "event__title", "edition_label")


@admin.register(EventEditionStage)
class EventEditionStageAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "edition",
        "stage_number",
        "stage_name",
        "status",
        "format",
        "start_date",
        "end_date",
    )
    list_filter = ("status", "format")
    search_fields = ("edition__event__name", "stage_name")


@admin.register(University)
class UniversityAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "short_name", "city", "website_url")
    search_fields = ("name", "short_name", "city")
    list_filter = ("city",)


@admin.register(UniversityProgram)
class UniversityProgramAdmin(admin.ModelAdmin):
    list_display = ("id", "university", "name", "level", "code")
    list_filter = ("level",)
    search_fields = ("name", "code", "university__name", "university__short_name")
    autocomplete_fields = ("university",)


@admin.register(EventEditionAdmissionBenefit)
class EventEditionAdmissionBenefitAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "event_edition",
        "university",
        "benefit_type",
        "winner_benefit",
        "prizewinner_benefit",
    )
    list_filter = ("benefit_type",)
    search_fields = (
        "event_edition__event__name",
        "university__name",
        "university__short_name",
    )
    autocomplete_fields = ("event_edition", "university")
    filter_horizontal = ("programs",)
