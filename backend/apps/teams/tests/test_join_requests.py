from django.contrib.admin.sites import AdminSite
from django.core.exceptions import ValidationError
from django.test import RequestFactory, TestCase

from apps.accounts.models import User
from apps.olympiads.models import Olympiad
from apps.teams.admin import JoinRequestAdmin
from apps.teams.models import JoinRequest, JoinRequestStatus, Team, TeamMembership, TeamMembershipRole


class TeamJoinRequestTests(TestCase):
    def setUp(self):
        self.request_factory = RequestFactory()
        self.owner = User.objects.create_user(email="owner@example.com", password="password123")
        self.user = User.objects.create_user(email="user@example.com", password="password123")
        self.olympiad = Olympiad.objects.create(title="Math Olympiad", season="2025/2026")

    def test_joinrequest_clean_blocks_closed_team(self):
        team = Team.objects.create(
            olympiad=self.olympiad,
            owner=self.owner,
            name="Closed Team",
            is_open=False,
        )
        join_request = JoinRequest(team=team, user=self.user)

        with self.assertRaises(ValidationError):
            join_request.full_clean()

    def test_admin_like_approve_creates_membership_and_sets_status(self):
        team = Team.objects.create(
            olympiad=self.olympiad,
            owner=self.owner,
            name="Open Team",
            is_open=True,
        )
        join_request = JoinRequest.objects.create(
            team=team,
            user=self.user,
            status=JoinRequestStatus.PENDING,
        )

        admin_instance = JoinRequestAdmin(JoinRequest, AdminSite())
        request = self.request_factory.post("/admin/apps/teams/joinrequest/")
        queryset = JoinRequest.objects.filter(id=join_request.id)

        admin_instance.approve_requests(request, queryset)

        join_request.refresh_from_db()
        self.assertEqual(join_request.status, JoinRequestStatus.APPROVED)
        self.assertTrue(
            TeamMembership.objects.filter(
                team=team,
                user=self.user,
                role=TeamMembershipRole.MEMBER,
            ).exists()
        )

    def test_joinrequest_allows_pending_to_approved(self):
        team = Team.objects.create(
            olympiad=self.olympiad,
            owner=self.owner,
            name="State Team 1",
            is_open=True,
        )
        join_request = JoinRequest.objects.create(
            team=team,
            user=self.user,
            status=JoinRequestStatus.PENDING,
        )

        join_request.approve()
        join_request.save(update_fields=["status"])
        join_request.refresh_from_db()

        self.assertEqual(join_request.status, JoinRequestStatus.APPROVED)

    def test_joinrequest_disallows_approved_to_rejected(self):
        team = Team.objects.create(
            olympiad=self.olympiad,
            owner=self.owner,
            name="State Team 2",
            is_open=True,
        )
        join_request = JoinRequest.objects.create(
            team=team,
            user=self.user,
            status=JoinRequestStatus.APPROVED,
        )

        with self.assertRaises(ValidationError):
            join_request.reject()

    def test_joinrequest_allows_pending_to_withdrawn(self):
        team = Team.objects.create(
            olympiad=self.olympiad,
            owner=self.owner,
            name="State Team 3",
            is_open=True,
        )
        join_request = JoinRequest.objects.create(
            team=team,
            user=self.user,
            status=JoinRequestStatus.PENDING,
        )

        join_request.withdraw()
        join_request.save(update_fields=["status"])
        join_request.refresh_from_db()

        self.assertEqual(join_request.status, JoinRequestStatus.WITHDRAWN)
