from django.db import models

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


class Event(TimeStampedModel):
    title = models.CharField(max_length=255)
    short_description = models.CharField(max_length=500, blank=True)
    description = models.TextField(blank=True)
    official_url = models.URLField(blank=True)
    organizer = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    registration_deadline = models.DateField(null=True, blank=True)
    event_type = models.ForeignKey(EventType, on_delete=models.PROTECT)
    level = models.ForeignKey(EventLevel, on_delete=models.SET_NULL, null=True, blank=True)
    participation_type = models.CharField(
        max_length=16,
        choices=EventParticipationType.choices,
    )
    preferences = models.TextField(blank=True)
    profiles = models.ManyToManyField(EventProfile, related_name="events", blank=True)

    def __str__(self) -> str:
        return self.title
