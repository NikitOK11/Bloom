import secrets

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class CompetitionMode(models.TextChoices):
    RANDOM_SPLIT = "RANDOM_SPLIT", "Random split"
    MANUAL_TEAMS = "MANUAL_TEAMS", "Manual teams"


class Competition(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_competitions",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    invite_slug = models.SlugField(max_length=64, unique=True, db_index=True)
    is_active = models.BooleanField(default=True)
    mode = models.CharField(
        max_length=32,
        choices=CompetitionMode.choices,
        default=CompetitionMode.RANDOM_SPLIT,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.owner_id:
            raise ValidationError({"owner": "Owner is required."})
        if not self.invite_slug:
            self.invite_slug = self._generate_unique_invite_slug()
        super().save(*args, **kwargs)

    @classmethod
    def _generate_unique_invite_slug(cls) -> str:
        while True:
            candidate = secrets.token_hex(8)
            if not cls.objects.filter(invite_slug=candidate).exists():
                return candidate

    def __str__(self) -> str:
        return self.title


class CompetitionParticipant(models.Model):
    competition = models.ForeignKey(
        Competition,
        on_delete=models.CASCADE,
        related_name="participants",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="competition_participations",
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["competition", "user"],
                name="unique_competition_participant",
            )
        ]


class CompetitionTeam(models.Model):
    competition = models.ForeignKey(
        Competition,
        on_delete=models.CASCADE,
        related_name="teams",
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_competition_teams",
    )
    name = models.CharField(max_length=255)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["competition", "name"],
                name="unique_team_name_per_competition",
            )
        ]

    def save(self, *args, **kwargs):
        if not self.owner_id:
            raise ValidationError({"owner": "Owner is required."})
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.competition_id}:{self.name}"


class CompetitionTeamRequest(models.Model):
    competition_team = models.ForeignKey(
        CompetitionTeam,
        on_delete=models.CASCADE,
        related_name="requests",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="competition_team_requests",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["competition_team", "user"],
                name="unique_team_membership",
            )
        ]


class ScoreEntry(models.Model):
    competition = models.ForeignKey(
        Competition,
        on_delete=models.CASCADE,
        related_name="score_entries",
    )
    team = models.ForeignKey(
        CompetitionTeam,
        on_delete=models.CASCADE,
        related_name="score_entries",
    )
    value = models.IntegerField()
    note = models.CharField(max_length=500, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_score_entries",
    )
    created_at = models.DateTimeField(auto_now_add=True)
