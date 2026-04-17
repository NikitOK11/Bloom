import importlib

from django.apps import apps as django_apps
from django.test import TestCase

from apps.accounts.models import User
from apps.events.models import Event, EventParticipationType, EventType
from apps.olympiads.models import Olympiad
from apps.teams.models import Team


backfill_migration = importlib.import_module(
    "apps.olympiads.migrations.0004_backfill_olympiad_events"
)


class OlympiadEventBridgeTests(TestCase):
    def test_olympiad_can_link_to_event(self):
        event_type, _ = EventType.objects.get_or_create(
            slug="olympiad",
            defaults={"name": "Olympiad"},
        )
        event = Event.objects.create(
            title="Linked Event",
            event_type=event_type,
            participation_type=EventParticipationType.INDIVIDUAL,
        )
        olympiad = Olympiad.objects.create(
            title="Linked Olympiad",
            season="2025/2026",
            event=event,
        )

        self.assertEqual(olympiad.event, event)
        self.assertEqual(olympiad.resolved_event, event)
        self.assertEqual(event.legacy_olympiad, olympiad)

    def test_backfill_creates_event_for_existing_olympiad(self):
        event_type, _ = EventType.objects.get_or_create(
            slug="olympiad",
            defaults={"name": "Olympiad"},
        )
        individual_olympiad = Olympiad.objects.create(
            title="Individual Olympiad",
            season="2025/2026",
            description="Individual description.",
            is_active=False,
        )
        team_olympiad = Olympiad.objects.create(
            title="Team Olympiad",
            season="2025/2026",
        )
        owner = User.objects.create_user(email="owner@example.com", password="password123")
        Team.objects.create(
            olympiad=team_olympiad,
            owner=owner,
            name="Legacy Team",
        )

        backfill_migration.backfill_olympiad_events(django_apps, None)

        individual_olympiad.refresh_from_db()
        team_olympiad.refresh_from_db()
        self.assertIsNotNone(individual_olympiad.event)
        self.assertEqual(individual_olympiad.event.event_type, event_type)
        self.assertEqual(individual_olympiad.event.title, "Individual Olympiad")
        self.assertEqual(individual_olympiad.event.description, "Individual description.")
        self.assertFalse(individual_olympiad.event.is_active)
        self.assertEqual(
            individual_olympiad.event.participation_type,
            EventParticipationType.INDIVIDUAL,
        )
        self.assertEqual(team_olympiad.event.participation_type, EventParticipationType.BOTH)

    def test_backfill_creates_olympiad_event_type_if_missing(self):
        EventType.objects.filter(slug="olympiad").delete()
        Olympiad.objects.create(title="Missing Type Olympiad", season="2025/2026")

        backfill_migration.backfill_olympiad_events(django_apps, None)

        event_type = EventType.objects.get(slug="olympiad")
        olympiad = Olympiad.objects.get(title="Missing Type Olympiad")
        self.assertEqual(event_type.name, "Olympiad")
        self.assertTrue(event_type.is_active)
        self.assertEqual(event_type.sort_order, 0)
        self.assertEqual(olympiad.event.event_type, event_type)
