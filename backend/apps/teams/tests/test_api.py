from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.accounts.models import User
from apps.events.models import Event, EventParticipationType, EventType
from apps.teams.models import JoinRequest, JoinRequestStatus, Team, TeamMembership, TeamMembershipRole


class TeamAPITestCase(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(email="owner@example.com", password="password123")
        self.member = User.objects.create_user(email="member@example.com", password="password123")
        self.joiner = User.objects.create_user(email="joiner@example.com", password="password123")
        self.event_type = EventType.objects.create(name="Hackathon", slug="hackathon")
        self.team_event = Event.objects.create(
            title="Team Hackathon",
            name="Team Hackathon",
            event_type=self.event_type,
            participation_type=EventParticipationType.TEAM,
            participation_mode="team",
        )
        self.individual_event = Event.objects.create(
            title="Solo Olympiad",
            name="Solo Olympiad",
            event_type=self.event_type,
            participation_type=EventParticipationType.INDIVIDUAL,
            participation_mode="individual",
        )
        self.team = Team.objects.create(
            event=self.team_event,
            owner=self.owner,
            name="Alpha Team",
            description="Core team",
            is_open=True,
        )
        TeamMembership.objects.create(
            team=self.team,
            user=self.owner,
            role=TeamMembershipRole.CAPTAIN,
        )
        TeamMembership.objects.create(
            team=self.team,
            user=self.member,
            role=TeamMembershipRole.MEMBER,
        )

    def test_list_teams(self):
        response = self.client.get(reverse("team-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.team.id)
        self.assertEqual(response.data[0]["member_count"], 2)

    def test_team_detail_includes_join_flags(self):
        self.client.force_login(self.joiner)

        response = self.client.get(reverse("team-detail", args=[self.team.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_member"])
        self.assertFalse(response.data["has_join_request"])
        self.assertTrue(response.data["can_join"])
        self.assertEqual(len(response.data["memberships"]), 2)

    def test_create_team_requires_authentication(self):
        response = self.client.post(
            reverse("team-list"),
            data={"event_id": self.team_event.id, "name": "New Team"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_team_creates_captain_membership(self):
        self.client.force_login(self.joiner)

        response = self.client.post(
            reverse("team-list"),
            data={
                "event_id": self.team_event.id,
                "name": "Beta Team",
                "description": "Second squad",
                "is_open": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_team = Team.objects.get(id=response.data["id"])
        self.assertEqual(created_team.owner_id, self.joiner.id)
        self.assertTrue(
            TeamMembership.objects.filter(
                team=created_team,
                user=self.joiner,
                role=TeamMembershipRole.CAPTAIN,
            ).exists()
        )

    def test_create_team_rejects_individual_event(self):
        self.client.force_login(self.joiner)

        response = self.client.post(
            reverse("team-list"),
            data={"event_id": self.individual_event.id, "name": "Wrong Team"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("event_id", response.data)

    def test_create_join_request(self):
        self.client.force_login(self.joiner)

        response = self.client.post(
            reverse("team-join-requests", args=[self.team.id]),
            data={"message": "Хочу присоединиться"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            JoinRequest.objects.filter(
                team=self.team,
                user=self.joiner,
                status=JoinRequestStatus.PENDING,
            ).exists()
        )

    def test_create_join_request_rejects_closed_team(self):
        self.team.is_open = False
        self.team.save(update_fields=["is_open"])
        self.client.force_login(self.joiner)

        response = self.client.post(
            reverse("team-join-requests", args=[self.team.id]),
            data={"message": "Пустите в закрытую команду"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("team", response.data)


class TeamAPICSRFTestCase(APITestCase):
    def setUp(self):
        self.client = APIClient(enforce_csrf_checks=True)
        self.owner = User.objects.create_user(email="owner-csrf@example.com", password="password123")
        self.joiner = User.objects.create_user(email="joiner-csrf@example.com", password="password123")
        self.event_type = EventType.objects.create(name="Hackathon", slug="hackathon")
        self.team_event = Event.objects.create(
            title="CSRF Team Event",
            name="CSRF Team Event",
            event_type=self.event_type,
            participation_type=EventParticipationType.TEAM,
            participation_mode="team",
        )
        self.team = Team.objects.create(
            event=self.team_event,
            owner=self.owner,
            name="CSRF Alpha Team",
            description="Core team",
            is_open=True,
        )
        TeamMembership.objects.create(
            team=self.team,
            user=self.owner,
            role=TeamMembershipRole.CAPTAIN,
        )

    def _login_with_csrf(self, email: str, password: str):
        csrf_response = self.client.get(reverse("account-csrf"))
        csrf_token = csrf_response.cookies["csrftoken"].value
        login_response = self.client.post(
            reverse("account-login"),
            data={"email": email, "password": password},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        return self.client.cookies["csrftoken"].value

    def test_create_team_requires_csrf_for_authenticated_session(self):
        self._login_with_csrf(self.joiner.email, "password123")

        response = self.client.post(
            reverse("team-list"),
            data={"event_id": self.team_event.id, "name": "No Csrf Team"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_team_succeeds_with_csrf_for_authenticated_session(self):
        csrf_token = self._login_with_csrf(self.joiner.email, "password123")

        response = self.client.post(
            reverse("team-list"),
            data={
                "event_id": self.team_event.id,
                "name": "Csrf Team",
                "description": "Created with CSRF",
                "is_open": True,
            },
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_join_request_requires_csrf_for_authenticated_session(self):
        csrf_token = self._login_with_csrf(self.joiner.email, "password123")

        no_csrf_response = self.client.post(
            reverse("team-join-requests", args=[self.team.id]),
            data={"message": "Хочу в команду"},
            format="json",
        )
        with_csrf_response = self.client.post(
            reverse("team-join-requests", args=[self.team.id]),
            data={"message": "Хочу в команду"},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )

        self.assertEqual(no_csrf_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(with_csrf_response.status_code, status.HTTP_201_CREATED)
