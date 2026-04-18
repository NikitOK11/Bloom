from django.contrib.admin.sites import AdminSite
from django.test import RequestFactory, TestCase

from apps.accounts.models import User
from apps.olympiads.admin import OlympiadAdmin, TeamInline
from apps.olympiads.models import Olympiad


class OlympiadAdminReadOnlyTests(TestCase):
    def setUp(self):
        self.site = AdminSite()
        self.request_factory = RequestFactory()
        self.admin_user = User.objects.create_superuser(
            email="admin@example.com",
            password="password123",
        )
        self.request = self.request_factory.get("/admin/apps/olympiads/olympiad/")
        self.request.user = self.admin_user
        self.admin = OlympiadAdmin(Olympiad, self.site)
        self.olympiad = Olympiad.objects.create(
            title="Legacy Olympiad",
            season="2025/2026",
            description="Deprecated data.",
        )

    def test_olympiad_admin_disallows_add(self):
        self.assertFalse(self.admin.has_add_permission(self.request))

    def test_olympiad_admin_disallows_delete(self):
        self.assertFalse(self.admin.has_delete_permission(self.request, self.olympiad))

    def test_olympiad_admin_disallows_change(self):
        self.assertFalse(self.admin.has_change_permission(self.request, self.olympiad))

    def test_olympiad_admin_is_read_only_for_existing_object(self):
        readonly_fields = self.admin.get_readonly_fields(self.request, self.olympiad)

        self.assertEqual(
            set(readonly_fields),
            {
                "event",
                "title",
                "season",
                "description",
                "is_active",
                "created_at",
                "updated_at",
            },
        )

    def test_olympiad_admin_team_inline_is_read_only(self):
        inline = TeamInline(Olympiad, self.site)

        self.assertFalse(inline.has_add_permission(self.request, self.olympiad))
        self.assertFalse(inline.has_change_permission(self.request, self.olympiad))
        self.assertFalse(inline.has_delete_permission(self.request, self.olympiad))
        self.assertFalse(inline.can_delete)
        self.assertEqual(
            set(inline.get_readonly_fields(self.request, self.olympiad)),
            {"name", "event", "description", "is_open", "owner", "created_at", "updated_at"},
        )
