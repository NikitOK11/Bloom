from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.competitions.models import Competition, CompetitionParticipant, CompetitionTeam

User = get_user_model()


class CompetitionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Competition
        fields = ("id", "title", "description", "mode", "invite_slug", "is_active", "created_at")
        read_only_fields = ("id", "invite_slug", "is_active", "created_at")


class CompetitionListSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = Competition
        fields = ("id", "title", "mode", "is_active", "created_at", "role")

    def get_role(self, obj: Competition) -> str:
        request = self.context.get("request")
        if request and obj.owner_id == request.user.id:
            return "owner"
        return "participant"


class CompetitionDetailSerializer(serializers.ModelSerializer):
    participant_count = serializers.SerializerMethodField()
    team_count = serializers.SerializerMethodField()

    class Meta:
        model = Competition
        fields = (
            "id",
            "title",
            "description",
            "mode",
            "is_active",
            "invite_slug",
            "created_at",
            "updated_at",
            "participant_count",
            "team_count",
        )

    def get_participant_count(self, obj: Competition) -> int:
        return obj.participants.count()

    def get_team_count(self, obj: Competition) -> int:
        return obj.teams.count()


class SplitTeamsSerializer(serializers.Serializer):
    owner_id = serializers.PrimaryKeyRelatedField(source="owner", queryset=User.objects.all())
    team_size = serializers.IntegerField(min_value=2)
    random_seed = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, attrs):
        competition = self.context["competition"]
        owner = attrs["owner"]
        is_participant = CompetitionParticipant.objects.filter(
            competition=competition,
            user=owner,
        ).exists()

        if owner.id != competition.owner_id and not is_participant:
            raise serializers.ValidationError(
                {"owner_id": "Owner must be competition owner or participant."}
            )
        return attrs


class CreateScoreEntrySerializer(serializers.Serializer):
    team_id = serializers.PrimaryKeyRelatedField(source="team", queryset=CompetitionTeam.objects.all())
    value = serializers.IntegerField()
    note = serializers.CharField(required=False, allow_blank=True, max_length=500)

    def validate(self, attrs):
        competition = self.context["competition"]
        if attrs["team"].competition_id != competition.id:
            raise serializers.ValidationError({"team_id": "Team does not belong to this competition."})
        return attrs


class LeaderboardMemberSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    display_name = serializers.CharField()
    email = serializers.EmailField()


class LeaderboardTeamSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    total_score = serializers.IntegerField()
    members = LeaderboardMemberSerializer(many=True)
