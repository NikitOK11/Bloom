from django.contrib import admin
from django.conf import settings

from apps.competitions.models import (
    Competition,
    CompetitionParticipant,
    CompetitionTeam,
    CompetitionTeamRequest,
    ScoreEntry,
)


@admin.register(Competition)
class CompetitionAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "owner", "mode", "is_active", "created_at")
    search_fields = ("title", "invite_slug", "owner__email")
    list_filter = ("mode", "is_active", "created_at")

    def get_form(self, request, obj=None, change=False, **kwargs):
        form = super().get_form(request, obj=obj, change=change, **kwargs)
        if settings.DEBUG and obj is None and "owner" in form.base_fields:
            form.base_fields["owner"].required = False
            form.base_fields["owner"].initial = request.user.pk
        return form

    def save_model(self, request, obj, form, change):
        if settings.DEBUG and not change and not obj.owner_id:
            obj.owner = request.user
        super().save_model(request, obj, form, change)


@admin.register(CompetitionParticipant)
class CompetitionParticipantAdmin(admin.ModelAdmin):
    list_display = ("id", "competition", "user", "joined_at")
    search_fields = ("competition__title", "user__email")
    list_filter = ("joined_at",)


@admin.register(CompetitionTeam)
class CompetitionTeamAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "competition", "owner")
    search_fields = ("name", "competition__title", "owner__email")
    list_filter = ("competition",)


@admin.register(CompetitionTeamRequest)
class CompetitionTeamRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "competition_team", "user")
    search_fields = ("competition_team__name", "user__email")
    list_filter = ("competition_team__competition",)


@admin.register(ScoreEntry)
class ScoreEntryAdmin(admin.ModelAdmin):
    list_display = ("id", "competition", "team", "value", "created_by", "created_at")
    search_fields = ("competition__title", "team__name", "created_by__email", "note")
    list_filter = ("competition", "team", "created_at")
