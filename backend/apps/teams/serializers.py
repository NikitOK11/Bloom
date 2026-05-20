from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Count
from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from apps.events.models import Event, EventParticipationMode, EventParticipationType
from apps.teams.models import JoinRequest, JoinRequestStatus, Team, TeamMembership


def _raise_drf_validation(exc: DjangoValidationError) -> None:
    if hasattr(exc, "message_dict"):
        raise serializers.ValidationError(exc.message_dict) from exc
    if hasattr(exc, "messages"):
        raise serializers.ValidationError({"non_field_errors": list(exc.messages)}) from exc
    raise serializers.ValidationError({"non_field_errors": [str(exc)]}) from exc


class TeamEventSerializer(serializers.ModelSerializer):
    title = serializers.CharField()
    name = serializers.CharField(allow_null=True)
    participation_mode = serializers.CharField(allow_null=True)

    class Meta:
        model = Event
        fields = ("id", "name", "title", "participation_mode")


class TeamMembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = TeamMembership
        fields = ("id", "user", "role", "joined_at")


class TeamListSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    event = TeamEventSerializer(read_only=True)
    member_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Team
        fields = (
            "id",
            "name",
            "description",
            "is_open",
            "created_at",
            "owner",
            "event",
            "member_count",
        )


class TeamDetailSerializer(TeamListSerializer):
    memberships = TeamMembershipSerializer(many=True, read_only=True)
    is_member = serializers.SerializerMethodField()
    is_captain = serializers.SerializerMethodField()
    has_join_request = serializers.SerializerMethodField()
    can_join = serializers.SerializerMethodField()

    class Meta(TeamListSerializer.Meta):
        fields = TeamListSerializer.Meta.fields + (
            "memberships",
            "is_member",
            "is_captain",
            "has_join_request",
            "can_join",
        )

    def _request_user(self):
        request = self.context.get("request")
        return request.user if request and request.user.is_authenticated else None

    def get_is_member(self, obj: Team) -> bool:
        user = self._request_user()
        if not user:
            return False
        return obj.memberships.filter(user=user).exists()

    def get_is_captain(self, obj: Team) -> bool:
        user = self._request_user()
        if not user:
            return False
        return obj.memberships.filter(user=user, role="CAPTAIN").exists()

    def get_has_join_request(self, obj: Team) -> bool:
        user = self._request_user()
        if not user:
            return False
        return obj.join_requests.filter(user=user).exists()

    def get_can_join(self, obj: Team) -> bool:
        user = self._request_user()
        if not user or not obj.is_open:
            return False
        is_member = obj.memberships.filter(user=user).exists()
        has_join_request = obj.join_requests.filter(user=user).exists()
        return not is_member and not has_join_request


class TeamCreateSerializer(serializers.ModelSerializer):
    event_id = serializers.PrimaryKeyRelatedField(source="event", queryset=Event.objects.all())

    class Meta:
        model = Team
        fields = ("id", "event_id", "name", "description", "is_open")
        read_only_fields = ("id",)

    def validate_event_id(self, event: Event) -> Event:
        team_capable = event.participation_mode in {
            EventParticipationMode.TEAM,
            EventParticipationMode.HYBRID,
        } or event.participation_type in {
            EventParticipationType.TEAM,
            EventParticipationType.BOTH,
        }
        if not team_capable:
            raise serializers.ValidationError("Для этого события создание команды недоступно.")
        return event

    def create(self, validated_data):
        team = Team(**validated_data)
        try:
            team.full_clean()
        except DjangoValidationError as exc:
            _raise_drf_validation(exc)
        team.save()
        return team


class JoinRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = JoinRequest
        fields = ("id", "message", "status", "created_at")
        read_only_fields = ("id", "status", "created_at")

    def create(self, validated_data):
        team = self.context["team"]
        user = self.context["request"].user
        join_request = JoinRequest(team=team, user=user, **validated_data)
        try:
            join_request.full_clean()
        except DjangoValidationError as exc:
            _raise_drf_validation(exc)
        join_request.save()
        return join_request
