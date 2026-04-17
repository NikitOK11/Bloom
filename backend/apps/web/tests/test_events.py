from datetime import date

from django.test import TestCase
from django.urls import reverse

from apps.accounts.models import User
from apps.events.models import Event, EventLevel, EventParticipationType, EventProfile, EventType
from apps.olympiads.models import Olympiad
from apps.teams.models import Team, TeamMembership, TeamMembershipRole


class EventCatalogTests(TestCase):
    def setUp(self):
        self.event_type, _ = EventType.objects.get_or_create(
            slug="olympiad",
            defaults={"name": "Olympiad"},
        )
        self.level = EventLevel.objects.create(name="Level 1", slug="level-1")
        self.profile = EventProfile.objects.create(name="Math", slug="math")

    def create_event(self, title: str, **kwargs) -> Event:
        event = Event.objects.create(
            title=title,
            short_description=kwargs.pop("short_description", "Short event description."),
            description=kwargs.pop("description", "Full event description."),
            official_url=kwargs.pop("official_url", "https://example.com/event"),
            organizer=kwargs.pop("organizer", "Event Organizer"),
            event_type=kwargs.pop("event_type", self.event_type),
            level=kwargs.pop("level", self.level),
            participation_type=kwargs.pop(
                "participation_type",
                EventParticipationType.INDIVIDUAL,
            ),
            registration_deadline=kwargs.pop("registration_deadline", date(2026, 5, 1)),
            **kwargs,
        )
        event.profiles.add(self.profile)
        return event

    def test_event_list_shows_only_active_events(self):
        self.create_event("Visible Event")
        self.create_event("Hidden Event", is_active=False)

        response = self.client.get(reverse("web:event-list"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Visible Event")
        self.assertNotContains(response, "Hidden Event")

    def test_event_list_filters_by_participation_type(self):
        self.create_event("Individual Event", participation_type=EventParticipationType.INDIVIDUAL)
        self.create_event("Team Event", participation_type=EventParticipationType.TEAM)

        response = self.client.get(
            reverse("web:event-list"),
            {"participation_type": EventParticipationType.TEAM},
        )

        self.assertContains(response, "Team Event")
        self.assertNotContains(response, "Individual Event")

    def test_event_list_filters_by_profile(self):
        science_profile = EventProfile.objects.create(name="Science", slug="science")
        self.create_event("Math Event")
        science_event = self.create_event("Science Event")
        science_event.profiles.set([science_profile])

        response = self.client.get(reverse("web:event-list"), {"profile": "science"})

        self.assertContains(response, "Science Event")
        self.assertNotContains(response, "Math Event")

    def test_event_list_filters_by_event_type_and_level(self):
        hackathon_type = EventType.objects.create(name="Hackathon", slug="hackathon")
        international_level = EventLevel.objects.create(name="International", slug="international")
        self.create_event("Default Event")
        self.create_event(
            "International Hackathon",
            event_type=hackathon_type,
            level=international_level,
        )

        response = self.client.get(
            reverse("web:event-list"),
            {"event_type": "hackathon", "level": "international"},
        )

        self.assertContains(response, "International Hackathon")
        self.assertNotContains(response, "Default Event")

    def test_event_detail_renders_successfully(self):
        event = self.create_event(
            "Team Case Championship",
            participation_type=EventParticipationType.BOTH,
            preferences="Looking for product-minded participants.",
        )

        response = self.client.get(reverse("web:event-detail", kwargs={"pk": event.pk}))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Team Case Championship")
        self.assertContains(response, "Event Organizer")
        self.assertContains(response, "Math")
        self.assertContains(response, "Team support for events will be connected in a later step.")

    def test_event_detail_shows_teams_only_for_team_or_both_participation(self):
        owner = User.objects.create_user(email="team-owner@example.com", password="password123")
        team_event = self.create_event("Team Event", participation_type=EventParticipationType.TEAM)
        individual_event = self.create_event(
            "Individual Event",
            participation_type=EventParticipationType.INDIVIDUAL,
        )
        Team.objects.create(
            event=team_event,
            owner=owner,
            name="Event Linked Team",
            is_open=True,
        )
        olympiad = Olympiad.objects.create(title="Legacy Olympiad", season="2025/2026")
        Team.objects.create(
            olympiad=olympiad,
            owner=owner,
            name="Olympiad Only Team",
            is_open=True,
        )

        team_response = self.client.get(reverse("web:event-detail", kwargs={"pk": team_event.pk}))
        individual_response = self.client.get(
            reverse("web:event-detail", kwargs={"pk": individual_event.pk})
        )

        self.assertContains(team_response, "Team participation")
        self.assertContains(team_response, "Event Linked Team")
        self.assertContains(team_response, "(open)")
        self.assertNotContains(team_response, "Olympiad Only Team")
        self.assertNotContains(individual_response, "Team participation")
        self.assertNotContains(individual_response, "Event Linked Team")
        self.assertNotContains(individual_response, "No teams linked to this event yet.")

    def test_event_team_create_view_creates_team_with_event(self):
        event = self.create_event("Team Event", participation_type=EventParticipationType.TEAM)
        olympiad = Olympiad.objects.create(
            title="Legacy Olympiad",
            season="2025/2026",
            event=event,
        )
        user = User.objects.create_user(email="captain@example.com", password="password123")
        self.client.force_login(user)

        response = self.client.post(
            reverse("web:event-team-create", kwargs={"pk": event.pk}),
            data={
                "name": "Event Team",
                "description": "Team from event.",
                "is_open": "on",
            },
        )

        team = Team.objects.get(name="Event Team")
        self.assertEqual(team.event_id, event.id)
        self.assertEqual(team.olympiad_id, olympiad.id)
        self.assertTrue(
            TeamMembership.objects.filter(
                team=team,
                user=user,
                role=TeamMembershipRole.CAPTAIN,
            ).exists()
        )
        self.assertRedirects(response, reverse("web:team-detail", kwargs={"pk": team.pk}))

    def test_event_team_create_for_individual_event_is_not_allowed(self):
        event = self.create_event(
            "Individual Event",
            participation_type=EventParticipationType.INDIVIDUAL,
        )
        user = User.objects.create_user(email="user@example.com", password="password123")
        self.client.force_login(user)

        response = self.client.get(reverse("web:event-team-create", kwargs={"pk": event.pk}))

        self.assertEqual(response.status_code, 404)

    def test_event_detail_shows_linked_teams_for_team_event(self):
        event = self.create_event("Team Event", participation_type=EventParticipationType.TEAM)
        owner = User.objects.create_user(email="owner@example.com", password="password123")
        team = Team.objects.create(
            event=event,
            owner=owner,
            name="Linked Team",
            description="A concise team description.",
            is_open=True,
        )

        response = self.client.get(reverse("web:event-detail", kwargs={"pk": event.pk}))

        self.assertContains(response, reverse("web:team-detail", kwargs={"pk": team.pk}))
        self.assertContains(response, "Linked Team")
        self.assertContains(response, "A concise team description.")
        self.assertContains(response, "(open)")
