from django.contrib.admin.sites import AdminSite
from django.core.exceptions import ValidationError
from django.test import TestCase

from apps.accounts.models import User
from apps.events.models import Event, EventParticipationType, EventType
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

    def test_team_can_be_created_with_event(self):
        team = Team(
            event=self.event,
            owner=self.owner,
            name="Event Team",
        )

        team.full_clean()
        team.save()

        self.assertEqual(team.event_id, self.event.id)

    def test_team_requires_event(self):
        team = Team(
            event=None,
            owner=self.owner,
            name="Orphan Team",
        )

        with self.assertRaises(ValidationError) as exc:
            team.full_clean()

        self.assertIn("event", exc.exception.message_dict)

    def test_team_admin_uses_event_only(self):
        admin_instance = TeamAdmin(Team, AdminSite())

        self.assertIn("event", admin_instance.list_display)
        self.assertNotIn("olympiad", admin_instance.list_display)
        self.assertIn("event", admin_instance.list_filter)
        self.assertNotIn("olympiad", admin_instance.list_filter)
