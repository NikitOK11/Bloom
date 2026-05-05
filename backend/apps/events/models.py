from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.indexes import GinIndex
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q
from django.utils.translation import gettext_lazy as _

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


class EligibleGroup(models.TextChoices):
    GRADES_1_4 = "grades_1_4", _("1–4 классы")
    GRADE_5 = "grade_5", _("5 класс")
    GRADE_6 = "grade_6", _("6 класс")
    GRADE_7 = "grade_7", _("7 класс")
    GRADE_8 = "grade_8", _("8 класс")
    GRADE_9 = "grade_9", _("9 класс")
    GRADE_10 = "grade_10", _("10 класс")
    GRADE_11 = "grade_11", _("11 класс")
    STUDENT = "student", _("Студент")


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
    eligible_groups = ArrayField(
        models.CharField(max_length=32, choices=EligibleGroup.choices),
        default=list,
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
            models.Index(fields=["is_active"], name="event_is_active_idx"),
            GinIndex(fields=["eligible_groups"], name="event_eligible_groups_gin"),
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


class EventEditionStageFormat(models.TextChoices):
    ONLINE = "online", "Online"
    OFFLINE = "offline", "Offline"
    MIXED = "mixed", "Mixed"
    UNKNOWN = "unknown", "Unknown"


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
    registration_start_date = models.DateField(null=True, blank=True)
    registration_end_date = models.DateField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["event", "status"], name="event_edition_event_status_idx"),
        ]
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
            models.CheckConstraint(
                condition=Q(registration_start_date__isnull=True)
                | Q(registration_end_date__isnull=True)
                | Q(registration_start_date__lte=F("registration_end_date")),
                name="event_edition_reg_start_lte_end",
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
    format = models.CharField(
        max_length=32,
        choices=EventEditionStageFormat.choices,
        default=EventEditionStageFormat.UNKNOWN,
    )
    description = models.TextField(blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["edition", "status"], name="stage_edition_status_idx"),
        ]
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


class University(TimeStampedModel):
    name = models.CharField(max_length=512, unique=True)
    short_name = models.CharField(max_length=256, blank=True)
    city = models.CharField(max_length=256, blank=True)
    website_url = models.URLField(blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["name"], name="university_name_idx"),
        ]

    def __str__(self) -> str:
        return self.short_name or self.name


class UniversityProgramLevel(models.TextChoices):
    BACHELOR = "bachelor", "Bachelor"
    SPECIALIST = "specialist", "Specialist"
    MASTER = "master", "Master"
    UNKNOWN = "unknown", "Unknown"


class UniversityProgram(TimeStampedModel):
    university = models.ForeignKey(University, on_delete=models.CASCADE, related_name="programs")
    name = models.CharField(max_length=512)
    level = models.CharField(
        max_length=32,
        choices=UniversityProgramLevel.choices,
        default=UniversityProgramLevel.UNKNOWN,
    )
    code = models.CharField(max_length=128, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["university", "name"], name="univ_program_univ_name_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["university", "name", "level"],
                name="uniq_univ_program",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.university.short_name or self.university.name} - {self.name} ({self.get_level_display()})"


class AdmissionBenefitType(models.TextChoices):
    BVI = "bvi", "BVI"
    EGE_100 = "ege_100", "EGE 100"
    EXTRA_POINTS = "extra_points", "Extra points"
    DISCOUNT = "discount", "Discount"
    OTHER = "other", "Other"
    UNKNOWN = "unknown", "Unknown"


class EventEditionAdmissionBenefit(TimeStampedModel):
    event_edition = models.ForeignKey(EventEdition, on_delete=models.CASCADE, related_name="admission_benefits")
    university = models.ForeignKey(University, on_delete=models.CASCADE, related_name="event_benefits")
    benefit_type = models.CharField(
        max_length=32,
        choices=AdmissionBenefitType.choices,
        default=AdmissionBenefitType.UNKNOWN,
    )
    winner_benefit = models.CharField(max_length=512, blank=True)
    prizewinner_benefit = models.CharField(max_length=512, blank=True)
    source_url = models.URLField(blank=True)
    note = models.TextField(blank=True)
    programs = models.ManyToManyField(UniversityProgram, related_name="benefits", blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["event_edition", "university"], name="event_edition_benefit_univ_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["event_edition", "university", "benefit_type"],
                name="uniq_event_edition_benefit",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.event_edition} - {self.university.short_name or self.university.name} ({self.get_benefit_type_display()})"
