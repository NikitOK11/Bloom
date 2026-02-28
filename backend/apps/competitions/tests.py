from django.contrib.admin.sites import AdminSite
from django.core.exceptions import ValidationError
from django.db.models import Count
from django.test import RequestFactory, TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.competitions.admin import CompetitionAdmin
from apps.competitions.models import Competition, CompetitionParticipant, CompetitionTeam, CompetitionTeamMembership


class CompetitionAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.request_factory = RequestFactory()
        self.owner = User.objects.create_user(email="owner@example.com", password="password123")
        self.participant = User.objects.create_user(
            email="participant@example.com",
            password="password123",
        )
        self.outsider = User.objects.create_user(email="outsider@example.com", password="password123")

    def _create_competition(self) -> Competition:
        return Competition.objects.create(owner=self.owner, title="Private Competition", description="")

    def test_competition_save_without_owner_raises_validation_error(self):
        competition = Competition(title="No owner", description="")
        with self.assertRaises(ValidationError) as exc:
            competition.save()

        self.assertIn("owner", exc.exception.message_dict)

    def test_competition_team_save_without_owner_raises_validation_error(self):
        competition = self._create_competition()
        team = CompetitionTeam(competition=competition, name="No owner team")

        with self.assertRaises(ValidationError) as exc:
            team.save()

        self.assertIn("owner", exc.exception.message_dict)

    def test_api_create_competition_sets_authenticated_owner(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(
            reverse("competition-list"),
            data={"title": "API Competition", "description": "Created by API"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        competition = Competition.objects.get(id=response.json()["id"])
        self.assertEqual(competition.owner_id, self.owner.id)

    @override_settings(DEBUG=True)
    def test_admin_save_model_sets_request_user_when_owner_missing_in_debug(self):
        admin_instance = CompetitionAdmin(Competition, AdminSite())
        request = self.request_factory.post("/admin/apps/competitions/competition/add/")
        request.user = self.owner

        competition = Competition(title="Admin Competition", description="")
        admin_instance.save_model(request, competition, form=None, change=False)

        self.assertEqual(competition.owner_id, self.owner.id)
        self.assertTrue(Competition.objects.filter(id=competition.id, owner=self.owner).exists())

    def test_competition_visibility(self):
        competition = self._create_competition()
        CompetitionParticipant.objects.create(competition=competition, user=self.participant)

        self.client.force_authenticate(user=self.outsider)

        list_response = self.client.get(reverse("competition-list"))
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.json(), [])

        detail_response = self.client.get(reverse("competition-detail", kwargs={"pk": competition.id}))
        self.assertEqual(detail_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_join_by_slug_creates_participant(self):
        competition = self._create_competition()
        joiner = User.objects.create_user(email="joiner@example.com", password="password123")
        self.client.force_authenticate(user=joiner)

        join_url = reverse("competition-join-by-slug", kwargs={"slug": competition.invite_slug})

        first_response = self.client.post(join_url, data={}, format="json")
        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertTrue(first_response.json()["joined"])

        second_response = self.client.post(join_url, data={}, format="json")
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        self.assertFalse(second_response.json()["joined"])

        participant_count = CompetitionParticipant.objects.filter(
            competition=competition,
            user=joiner,
        ).count()
        self.assertEqual(participant_count, 1)

    def test_split_teams_sizes_balanced(self):
        competition = self._create_competition()
        users = [
            User.objects.create_user(email=f"user{index}@example.com", password="password123")
            for index in range(10)
        ]
        CompetitionParticipant.objects.bulk_create(
            [CompetitionParticipant(competition=competition, user=user) for user in users]
        )
        self.client.force_authenticate(user=self.owner)

        split_url = reverse("competition-split-teams", kwargs={"pk": competition.id})
        response = self.client.post(
            split_url,
            data={"owner_id": users[0].id, "team_size": 3, "random_seed": 42},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        memberships = CompetitionTeamMembership.objects.filter(
            competition_team__competition=competition
        ).select_related("competition_team", "user")

        self.assertEqual(memberships.count(), len(users))

        memberships_per_user = memberships.values("user_id").annotate(count=Count("id"))
        self.assertEqual(memberships_per_user.count(), len(users))
        self.assertTrue(all(row["count"] == 1 for row in memberships_per_user))

        team_sizes = list(
            CompetitionTeam.objects.filter(competition=competition)
            .annotate(size=Count("memberships"))
            .values_list("size", flat=True)
        )
        self.assertEqual(sum(team_sizes), len(users))
        self.assertLessEqual(max(team_sizes) - min(team_sizes), 1)

        team_owner_ids = set(
            CompetitionTeam.objects.filter(competition=competition).values_list("owner_id", flat=True)
        )
        self.assertEqual(team_owner_ids, {users[0].id})

    def test_split_teams_rejects_owner_outside_competition(self):
        competition = self._create_competition()
        valid_participant = User.objects.create_user(email="valid@example.com", password="password123")
        outsider_owner = User.objects.create_user(email="outside@example.com", password="password123")
        CompetitionParticipant.objects.create(competition=competition, user=valid_participant)
        self.client.force_authenticate(user=self.owner)

        split_url = reverse("competition-split-teams", kwargs={"pk": competition.id})
        response = self.client.post(
            split_url,
            data={"owner_id": outsider_owner.id, "team_size": 2},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("owner_id", response.json())
