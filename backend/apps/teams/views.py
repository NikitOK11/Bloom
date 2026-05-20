from django.db import transaction
from django.db.models import Count
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.teams.models import Team, TeamMembership, TeamMembershipRole
from apps.teams.serializers import (
    JoinRequestCreateSerializer,
    TeamCreateSerializer,
    TeamDetailSerializer,
    TeamListSerializer,
)


class TeamViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Team.objects.none()

    def get_permissions(self):
        if self.action in {"create", "create_join_request"}:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        return (
            Team.objects.select_related("event", "owner")
            .prefetch_related("memberships__user", "join_requests")
            .annotate(member_count=Count("memberships", distinct=True))
            .order_by("id")
        )

    def get_serializer_class(self):
        if self.action == "create":
            return TeamCreateSerializer
        if self.action == "retrieve":
            return TeamDetailSerializer
        if self.action == "create_join_request":
            return JoinRequestCreateSerializer
        return TeamListSerializer

    def perform_create(self, serializer):
        with transaction.atomic():
            team = serializer.save(owner=self.request.user)
            captain_membership = TeamMembership(
                team=team,
                user=self.request.user,
                role=TeamMembershipRole.CAPTAIN,
            )
            captain_membership.full_clean()
            captain_membership.save()

    @action(detail=True, methods=["post"], url_path="join-requests", url_name="join-requests")
    def create_join_request(self, request, pk=None):
        team = self.get_object()
        serializer = self.get_serializer(
            data=request.data,
            context={"request": request, "team": team},
        )
        serializer.is_valid(raise_exception=True)
        join_request = serializer.save()
        return Response(self.get_serializer(join_request).data, status=status.HTTP_201_CREATED)
