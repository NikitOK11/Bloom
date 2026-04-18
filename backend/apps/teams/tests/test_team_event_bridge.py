from django.core.exceptions import ValidationError
from django.contrib.admin.sites import AdminSite
from django.test import TestCase

from apps.accounts.models import User
from apps.events.models import Event, EventParticipationType, EventType
from apps.olympiads.models import Olympiad
from apps.teams.admin import TeamAdmin
from apps.teams.models import Team


class TeamEventBridgeTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(email="owner@example.com", password="password123")
        self.event_type = EventType.objects.create(name="Hackathon", slug="hackathon")
        self.event = Event.objects.create(
            title="Product Hackathon",
            event_type=self.event_type,
            participation_type=EventParticipationType.TEAM,
        )

    def test_team_can_be_created_with_event_only_and_no_olympiad(self):
        team = Team(
            olympiad=None,
            event=self.event,
            owner=self.owner,
            name="Event Team",
        )

        team.full_clean()
        team.save()

        self.assertIsNone(team.olympiad_id)
        self.assertEqual(team.event_id, self.event.id)

    def test_team_without_event_and_olympiad_is_invalid(self):
        team = Team(
            olympiad=None,
            event=None,
            owner=self.owner,
            name="Orphan Team",
        )

        with self.assertRaises(ValidationError):
            team.full_clean()

    def test_team_resolved_event_prefers_event(self):
        fallback_event = Event.objects.create(
            title="Fallback Olympiad Event",
            event_type=self.event_type,
            participation_type=EventParticipationType.INDIVIDUAL,
        )
        olympiad = Olympiad.objects.create(
            title="Legacy Olympiad",
            season="2025/2026",
            event=fallback_event,
        )
        team = Team.objects.create(
            olympiad=olympiad,
            event=self.event,
            owner=self.owner,
            name="Both Linked Team",
        )

        self.assertEqual(team.resolved_event, self.event)

    def test_team_resolved_event_falls_back_to_olympiad_event(self):
        olympiad = Olympiad.objects.create(
            title="Legacy Olympiad",
            season="2025/2026",
            event=self.event,
        )
        team = Team.objects.create(
            olympiad=olympiad,
            event=None,
            owner=self.owner,
            name="Legacy Event Team",
        )

        self.assertEqual(team.resolved_event, self.event)

    def test_team_admin_prioritizes_event_before_olympiad(self):
        admin_instance = TeamAdmin(Team, AdminSite())

        self.assertLess(
            admin_instance.list_display.index("event"),
            admin_instance.list_display.index("olympiad"),
        )
        self.assertLess(
            admin_instance.list_filter.index("event"),
            admin_instance.list_filter.index("olympiad"),
        )
