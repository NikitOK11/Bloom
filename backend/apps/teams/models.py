from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from apps.common.models import TimeStampedModel


class TeamMembershipRole(models.TextChoices):
    CAPTAIN = "CAPTAIN", "Captain"
    MEMBER = "MEMBER", "Member"


class JoinRequestStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"


class Team(TimeStampedModel):
    olympiad = models.ForeignKey("olympiads.Olympiad", on_delete=models.CASCADE)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_olympiad_teams",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_open = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["olympiad", "name"],
                name="uniq_team_name_per_olympiad",
            )
        ]

    def save(self, *args, **kwargs):
        if not self.owner_id:
            raise ValidationError({"owner": "Owner is required."})
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.name


class TeamMembership(models.Model):
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="team_memberships",
    )
    role = models.CharField(
        max_length=16,
        choices=TeamMembershipRole.choices,
        default=TeamMembershipRole.MEMBER,
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["team", "user"],
                name="uniq_membership_team_user",
            ),
            models.UniqueConstraint(
                fields=["team"],
                condition=Q(role=TeamMembershipRole.CAPTAIN),
                name="uniq_captain_per_team",
            ),
        ]


class JoinRequest(models.Model):
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name="join_requests",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="team_join_requests",
    )
    status = models.CharField(
        max_length=16,
        choices=JoinRequestStatus.choices,
        default=JoinRequestStatus.PENDING,
    )
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["team", "user"],
                name="uniq_joinrequest_team_user",
            )
        ]

    def clean(self):
        super().clean()
        if not self._state.adding:
            return
        if not self.team_id or not self.user_id:
            return

        if not self.team.is_open:
            raise ValidationError({"team": "Cannot create join request for a closed team."})

        if TeamMembership.objects.filter(team_id=self.team_id, user_id=self.user_id).exists():
            raise ValidationError({"user": "User is already a member of this team."})
