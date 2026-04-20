from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q

from apps.common.models import TimeStampedModel


class EventProfile(TimeStampedModel):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=64, unique=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    def __str__(self) -> str:
        return self.name


class EventType(TimeStampedModel):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=64, unique=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    def __str__(self) -> str:
        return self.name


class EventLevel(TimeStampedModel):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=64, unique=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    def __str__(self) -> str:
        return self.name


class EventParticipationType(models.TextChoices):
    INDIVIDUAL = "INDIVIDUAL", "Individual"
    TEAM = "TEAM", "Team"
    BOTH = "BOTH", "Both"


class EventTypeCode(models.TextChoices):
    OLYMPIAD = "olympiad", "Olympiad"
    HACKATHON = "hackathon", "Hackathon"
    CASE_CHAMPIONSHIP = "case_championship", "Case championship"


class EventLevelCode(models.TextChoices):
    INTERNATIONAL = "international", "International"
    VSOSH = "vsosh", "VSOSH"
    LEVEL_1 = "level_1", "Level 1"
    LEVEL_2 = "level_2", "Level 2"
    LEVEL_3 = "level_3", "Level 3"


class EventParticipationMode(models.TextChoices):
    INDIVIDUAL = "individual", "Individual"
    TEAM = "team", "Team"
    HYBRID = "hybrid", "Hybrid"


class Event(TimeStampedModel):
    name = models.CharField(max_length=255, null=True, blank=True)
    title = models.CharField(max_length=255)
    short_description = models.CharField(max_length=500, blank=True)
    description = models.TextField(blank=True)
    official_url = models.URLField(blank=True)
    organizer = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    registration_deadline = models.DateField(null=True, blank=True)
    event_type_code = models.CharField(
        max_length=32,
        choices=EventTypeCode.choices,
        null=True,
        blank=True,
    )
    profile_code = models.CharField(max_length=128, null=True, blank=True)
    level_code = models.CharField(
        max_length=32,
        choices=EventLevelCode.choices,
        null=True,
        blank=True,
    )
    participation_mode = models.CharField(
        max_length=32,
        choices=EventParticipationMode.choices,
        null=True,
        blank=True,
    )
    event_type = models.ForeignKey(EventType, on_delete=models.PROTECT)
    level = models.ForeignKey(EventLevel, on_delete=models.SET_NULL, null=True, blank=True)
    participation_type = models.CharField(
        max_length=16,
        choices=EventParticipationType.choices,
    )
    preferences = models.TextField(blank=True)
    profiles = models.ManyToManyField(EventProfile, related_name="events", blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["name"], name="event_name_idx"),
            models.Index(fields=["event_type_code", "profile_code"], name="event_type_profile_idx"),
            models.Index(fields=["level_code"], name="event_level_code_idx"),
            models.Index(fields=["participation_mode"], name="event_participation_mode_idx"),
        ]

    def __str__(self) -> str:
        return self.name or self.title


class EventEditionStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    PLANNED = "planned", "Planned"
    REGISTRATION_OPEN = "registration_open", "Registration open"
    ONGOING = "ongoing", "Ongoing"
    FINISHED = "finished", "Finished"
    CANCELLED = "cancelled", "Cancelled"
    ARCHIVED = "archived", "Archived"


class EventEditionStageStatus(models.TextChoices):
    PLANNED = "planned", "Planned"
    ONGOING = "ongoing", "Ongoing"
    FINISHED = "finished", "Finished"
    CANCELLED = "cancelled", "Cancelled"


class EventEdition(TimeStampedModel):
    event = models.ForeignKey(Event, on_delete=models.PROTECT, related_name="editions")
    edition_label = models.CharField(max_length=64)
    start_date = models.DateField()
    end_date = models.DateField()
    total_stages = models.PositiveIntegerField()
    current_stage = models.ForeignKey(
        "events.EventEditionStage",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    status = models.CharField(
        max_length=32,
        choices=EventEditionStatus.choices,
        default=EventEditionStatus.DRAFT,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["event", "edition_label"],
                name="uniq_event_edition_label",
            ),
            models.CheckConstraint(
                condition=Q(total_stages__gt=0),
                name="event_edition_total_stages_gt_0",
            ),
            models.CheckConstraint(
                condition=Q(start_date__lte=F("end_date")),
                name="event_edition_start_lte_end",
            ),
        ]

    def clean(self):
        super().clean()
        if self.current_stage_id and self.current_stage.edition_id != self.pk:
            raise ValidationError(
                {"current_stage": "Current stage must belong to this event edition."}
            )

    def __str__(self) -> str:
        return f"{self.event} - {self.edition_label}"


class EventEditionStage(TimeStampedModel):
    edition = models.ForeignKey(EventEdition, on_delete=models.CASCADE, related_name="stages")
    stage_number = models.PositiveIntegerField()
    stage_name = models.CharField(max_length=128)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=32,
        choices=EventEditionStageStatus.choices,
        default=EventEditionStageStatus.PLANNED,
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["edition", "stage_number"],
                name="uniq_event_edition_stage_number",
            ),
            models.CheckConstraint(
                condition=Q(stage_number__gt=0),
                name="event_edition_stage_number_gt_0",
            ),
            models.CheckConstraint(
                condition=Q(start_date__isnull=True)
                | Q(end_date__isnull=True)
                | Q(start_date__lte=F("end_date")),
                name="event_edition_stage_start_lte_end",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.edition} - stage {self.stage_number}: {self.stage_name}"
