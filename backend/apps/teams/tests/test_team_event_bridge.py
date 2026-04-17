from django.core.exceptions import ValidationError
from django.test import TestCase

from apps.accounts.models import User
from apps.events.models import Event, EventParticipationType, EventType
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

    def test_team_can_be_created_with_event_only(self):
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

    def test_team_without_olympiad_and_event_is_invalid(self):
        team = Team(
            olympiad=None,
            event=None,
            owner=self.owner,
            name="Orphan Team",
        )

        with self.assertRaises(ValidationError):
            team.full_clean()
