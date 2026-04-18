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
    WITHDRAWN = "WITHDRAWN", "Withdrawn"


class Team(TimeStampedModel):
    olympiad = models.ForeignKey(
        "olympiads.Olympiad",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    event = models.ForeignKey(
        "events.Event",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="teams",
    )
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

    def clean(self):
        super().clean()
        if not self.olympiad_id and not self.event_id:
            raise ValidationError({"olympiad": "Team must be linked to an olympiad or event."})

    @property
    def resolved_event(self):
        if self.event_id:
            return self.event
        if self.olympiad_id:
            return self.olympiad.event
        return None

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
    ALLOWED_STATUS_TRANSITIONS = {
        JoinRequestStatus.PENDING: {
            JoinRequestStatus.APPROVED,
            JoinRequestStatus.REJECTED,
            JoinRequestStatus.WITHDRAWN,
        },
        JoinRequestStatus.APPROVED: set(),
        JoinRequestStatus.REJECTED: set(),
        JoinRequestStatus.WITHDRAWN: set(),
    }

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

    @classmethod
    def _normalize_status(cls, status) -> str:
        try:
            return JoinRequestStatus(status)
        except ValueError as exc:
            raise ValidationError({"status": f"Invalid status '{status}'."}) from exc

    @classmethod
    def _is_transition_allowed(cls, current_status: str, new_status: str) -> bool:
        if current_status == new_status:
            return True
        return new_status in cls.ALLOWED_STATUS_TRANSITIONS.get(current_status, set())

    def can_transition_to(self, new_status) -> bool:
        try:
            normalized_status = JoinRequestStatus(new_status)
        except ValueError:
            return False
        return self._is_transition_allowed(self.status, normalized_status)

    def transition_to(self, new_status, *, by_user=None) -> None:
        normalized_status = self._normalize_status(new_status)
        if normalized_status == self.status:
            return
        if not self._is_transition_allowed(self.status, normalized_status):
            raise ValidationError(
                {"status": f"Cannot transition from {self.status} to {normalized_status}."}
            )
        self.status = normalized_status

    def approve(self, *, by_user=None) -> None:
        self.transition_to(JoinRequestStatus.APPROVED, by_user=by_user)

    def reject(self, *, by_user=None) -> None:
        self.transition_to(JoinRequestStatus.REJECTED, by_user=by_user)

    def withdraw(self, *, by_user=None) -> None:
        self.transition_to(JoinRequestStatus.WITHDRAWN, by_user=by_user)

    def clean(self):
        super().clean()
        if self._state.adding:
            if not self.team_id or not self.user_id:
                return

            if not self.team.is_open:
                raise ValidationError({"team": "Cannot create join request for a closed team."})

            if TeamMembership.objects.filter(team_id=self.team_id, user_id=self.user_id).exists():
                raise ValidationError({"user": "User is already a member of this team."})
            return

        if not self.pk:
            return

        initial_status = (
            JoinRequest.objects.filter(pk=self.pk).values_list("status", flat=True).first()
        )
        if initial_status is None:
            return
        if not self._is_transition_allowed(initial_status, self.status):
            raise ValidationError(
                {"status": f"Cannot transition from {initial_status} to {self.status}."}
            )
