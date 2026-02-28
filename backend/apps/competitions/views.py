from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import IntegerField, Q, Sum, Value
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.competitions.models import Competition, CompetitionParticipant, CompetitionTeam, ScoreEntry
from apps.competitions.permissions import IsCompetitionMemberOrOwner, IsCompetitionOwner
from apps.competitions.serializers import (
    CompetitionCreateSerializer,
    CompetitionDetailSerializer,
    CompetitionListSerializer,
    CreateScoreEntrySerializer,
    LeaderboardTeamSerializer,
    SplitTeamsSerializer,
)
from apps.competitions.services import split_competition_teams


class CompetitionViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Competition.objects.all()
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in {"retrieve", "leaderboard"}:
            permission_classes = [IsAuthenticated, IsCompetitionMemberOrOwner]
        elif self.action in {"invite_link", "split_teams", "scores"}:
            permission_classes = [IsAuthenticated, IsCompetitionOwner]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Competition.objects.none()
        return Competition.objects.filter(
            Q(owner=user) | Q(participants__user=user)
        ).distinct()

    def get_serializer_class(self):
        if self.action == "create":
            return CompetitionCreateSerializer
        if self.action == "list":
            return CompetitionListSerializer
        if self.action == "split_teams":
            return SplitTeamsSerializer
        if self.action == "scores":
            return CreateScoreEntrySerializer
        return CompetitionDetailSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def _assert_owner(self, competition: Competition) -> None:
        if competition.owner_id != self.request.user.id:
            raise PermissionDenied("Only owner can perform this action.")

    @action(detail=True, methods=["post"], url_path="invite-link")
    def invite_link(self, request, pk=None):
        competition = self.get_object()
        self._assert_owner(competition)
        return Response({"invite_slug": competition.invite_slug})

    @action(detail=False, methods=["post"], url_path=r"join/(?P<slug>[^/.]+)", url_name="join-by-slug")
    def join(self, request, slug=None):
        competition = get_object_or_404(Competition, invite_slug=slug)
        _, created = CompetitionParticipant.objects.get_or_create(
            competition=competition,
            user=request.user,
        )
        return Response(
            {
                "competition_id": competition.id,
                "joined": created,
            }
        )

    @action(detail=True, methods=["post"], url_path="split-teams")
    def split_teams(self, request, pk=None):
        competition = self.get_object()
        self._assert_owner(competition)
        serializer = self.get_serializer(data=request.data, context={"competition": competition})
        serializer.is_valid(raise_exception=True)

        try:
            teams = split_competition_teams(
                competition=competition,
                owner=serializer.validated_data["owner"],
                team_size=serializer.validated_data["team_size"],
                random_seed=serializer.validated_data.get("random_seed"),
            )
        except DjangoValidationError as exc:
            raise ValidationError({"detail": exc.message}) from exc

        return Response({"teams": teams})

    @action(detail=True, methods=["post"], url_path="scores")
    def scores(self, request, pk=None):
        competition = self.get_object()
        self._assert_owner(competition)
        serializer = self.get_serializer(data=request.data, context={"competition": competition})
        serializer.is_valid(raise_exception=True)

        score_entry = ScoreEntry.objects.create(
            competition=competition,
            team=serializer.validated_data["team"],
            value=serializer.validated_data["value"],
            note=serializer.validated_data.get("note", ""),
            created_by=request.user,
        )
        return Response(
            {
                "id": score_entry.id,
                "competition_id": score_entry.competition_id,
                "team_id": score_entry.team_id,
                "value": score_entry.value,
                "note": score_entry.note,
                "created_at": score_entry.created_at,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["get"], url_path="leaderboard")
    def leaderboard(self, request, pk=None):
        competition = self.get_object()
        team_queryset = (
            CompetitionTeam.objects.filter(competition=competition)
            .annotate(
                total_score=Coalesce(
                    Sum("score_entries__value"),
                    Value(0),
                    output_field=IntegerField(),
                )
            )
            .prefetch_related("requests__user")
            .order_by("-total_score", "id")
        )

        payload = []
        for team in team_queryset:
            members = []
            for team_request in team.requests.all():
                user = team_request.user
                display_name = f"{user.first_name} {user.last_name}".strip() or user.email
                members.append(
                    {
                        "id": user.id,
                        "display_name": display_name,
                        "email": user.email,
                    }
                )
            payload.append(
                {
                    "id": team.id,
                    "name": team.name,
                    "total_score": team.total_score,
                    "members": members,
                }
            )

        serializer = LeaderboardTeamSerializer(payload, many=True)
        return Response(serializer.data)
