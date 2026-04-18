from django.contrib import admin
from django.db import transaction

from apps.teams.models import JoinRequest, JoinRequestStatus, Team, TeamMembership, TeamMembershipRole


class TeamMembershipInline(admin.TabularInline):
    model = TeamMembership
    extra = 1


class JoinRequestInline(admin.TabularInline):
    model = JoinRequest
    fields = ("user", "status", "message", "created_at")
    readonly_fields = ("created_at",)
    extra = 0


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "event", "is_open", "created_at", "owner")
    search_fields = ("name", "event__title")
    list_filter = ("event", "is_open")
    inlines = [TeamMembershipInline, JoinRequestInline]


@admin.register(JoinRequest)
class JoinRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "team", "event", "user", "status", "created_at")
    list_filter = ("status", "team__event", "team")
    search_fields = ("team__name", "team__event__title", "user__email")
    actions = ("approve_requests", "reject_requests")

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("team", "team__event", "user")

    @admin.display(ordering="team__event", description="Event")
    def event(self, obj: JoinRequest):
        return obj.team.event

    @admin.action(description="Approve selected pending requests")
    def approve_requests(self, request, queryset):
        pending_requests = queryset.filter(status=JoinRequestStatus.PENDING).select_related("team", "user")
        with transaction.atomic():
            for join_request in pending_requests:
                TeamMembership.objects.get_or_create(
                    team=join_request.team,
                    user=join_request.user,
                    defaults={"role": TeamMembershipRole.MEMBER},
                )
                join_request.approve()
                join_request.save(update_fields=["status"])

    @admin.action(description="Reject selected pending requests")
    def reject_requests(self, request, queryset):
        pending_requests = queryset.filter(status=JoinRequestStatus.PENDING).select_related("team", "user")
        with transaction.atomic():
            for join_request in pending_requests:
                join_request.reject()
                join_request.save(update_fields=["status"])
