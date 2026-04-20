import importlib

from django.apps import apps
from django.test import TestCase

from apps.events.models import Event, EventLevel, EventParticipationType, EventProfile, EventType


backfill_migration = importlib.import_module(
    "apps.events.migrations.0003_event_event_type_code_event_level_code_event_name_and_more"
)


class EventFlatFieldBackfillTests(TestCase):
    def setUp(self):
        self.event_type = EventType.objects.create(name="Case Championship", slug="case-championship")
        self.level = EventLevel.objects.create(name="Level 1", slug="level-1")
        self.profile = EventProfile.objects.create(name="Math", slug="math")

    def create_event(self, **kwargs) -> Event:
        profiles = kwargs.pop("profiles", None)
        event = Event.objects.create(
            title=kwargs.pop("title", "Legacy Event Title"),
            event_type=kwargs.pop("event_type", self.event_type),
            level=kwargs.pop("level", self.level),
            participation_type=kwargs.pop(
                "participation_type",
                EventParticipationType.BOTH,
            ),
            official_url=kwargs.pop("official_url", "https://example.com/event"),
            **kwargs,
        )
        event.profiles.set(profiles if profiles is not None else [self.profile])
        return event

    def run_backfill(self):
        backfill_migration.backfill_event_flat_fields(apps, None)

    def test_event_backfill_name_from_title(self):
        event = self.create_event(title="Target Name")

        self.run_backfill()
        event.refresh_from_db()

        self.assertEqual(event.name, "Target Name")

    def test_event_backfill_participation_mode_from_legacy_participation_type(self):
        event = self.create_event(participation_type=EventParticipationType.TEAM)

        self.run_backfill()
        event.refresh_from_db()

        self.assertEqual(event.participation_mode, "team")

    def test_event_backfill_event_type_code_from_legacy_fk(self):
        event = self.create_event()

        self.run_backfill()
        event.refresh_from_db()

        self.assertEqual(event.event_type_code, "case_championship")

    def test_event_backfill_level_code_from_legacy_level_fk(self):
        event = self.create_event()

        self.run_backfill()
        event.refresh_from_db()

        self.assertEqual(event.level_code, "level_1")

    def test_event_keeps_or_adds_official_url(self):
        event = self.create_event(official_url="https://example.com/original")

        self.run_backfill()
        event.refresh_from_db()

        self.assertEqual(event.official_url, "https://example.com/original")

    def test_event_backfill_profile_code_uses_first_profile_by_id(self):
        later_profile = EventProfile.objects.create(name="Science", slug="science")
        event = self.create_event(profiles=[later_profile])
        event.profiles.add(self.profile)

        self.run_backfill()
        event.refresh_from_db()

        self.assertEqual(event.profile_code, "math")
