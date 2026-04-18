from django.test import TestCase
from django.urls import reverse

from apps.accounts.models import User
from apps.events.models import Event, EventParticipationType, EventType
from apps.teams.models import JoinRequest, Team, TeamMembership, TeamMembershipRole


class WebScenario1Tests(TestCase):
    def setUp(self):
        self.event_type = EventType.objects.create(name="Hackathon", slug="hackathon")

    def create_event(self, title="Team Hackathon"):
        return Event.objects.create(
            title=title,
            event_type=self.event_type,
            participation_type=EventParticipationType.TEAM,
        )

    def test_web_team_create_creates_captain_membership(self):
        event = self.create_event()
        user = User.objects.create_user(email="captain@example.com", password="password123")
        self.client.force_login(user)

        response = self.client.post(
            reverse("web:event-team-create", kwargs={"pk": event.pk}),
            data={
                "name": "New Team",
                "description": "Team description",
                "is_open": "on",
            },
        )

        team = Team.objects.get(event=event, name="New Team")
        self.assertEqual(team.owner_id, user.id)
        self.assertTrue(
            TeamMembership.objects.filter(
                team=team,
                user=user,
                role=TeamMembershipRole.CAPTAIN,
            ).exists()
        )
        self.assertRedirects(response, reverse("web:team-detail", kwargs={"pk": team.pk}))

    def test_contacts_hidden_for_outsider_visible_for_applicant_or_member(self):
        event = self.create_event("Physics Team Event")
        captain = User.objects.create_user(email="owner@example.com", password="password123")
        team = Team.objects.create(
            event=event,
            owner=captain,
            name="Physics Team",
            description="",
            is_open=True,
        )
        TeamMembership.objects.create(
            team=team,
            user=captain,
            role=TeamMembershipRole.CAPTAIN,
        )
        member = User.objects.create_user(
            email="member@example.com",
            password="password123",
            phone="+70001112233",
        )
        TeamMembership.objects.create(
            team=team,
            user=member,
            role=TeamMembershipRole.MEMBER,
        )

        outsider = User.objects.create_user(email="outsider@example.com", password="password123")
        self.client.force_login(outsider)
        outsider_response = self.client.get(reverse("web:team-detail", kwargs={"pk": team.pk}))
        self.assertEqual(outsider_response.status_code, 200)
        self.assertFalse(outsider_response.context["can_view_contacts"])
        self.assertNotContains(outsider_response, member.phone)

        applicant = User.objects.create_user(email="applicant@example.com", password="password123")
        JoinRequest.objects.create(team=team, user=applicant, message="Please add me")
        self.client.force_login(applicant)
        applicant_response = self.client.get(reverse("web:team-detail", kwargs={"pk": team.pk}))
        self.assertEqual(applicant_response.status_code, 200)
        self.assertTrue(applicant_response.context["can_view_contacts"])
        self.assertContains(applicant_response, member.phone)
