from django.test import TestCase


class LegacyWebRoutingTests(TestCase):
    def test_django_root_no_longer_serves_legacy_home_page(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 404)

    def test_legacy_user_facing_routes_are_not_mounted(self):
        for path in ["/events/", "/olympiads/", "/profile/", "/login/", "/signup/", "/teams/1/"]:
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 404)

    def test_api_and_admin_routes_remain_available(self):
        health_response = self.client.get("/api/health/")
        admin_response = self.client.get("/admin/login/")

        self.assertEqual(health_response.status_code, 200)
        self.assertEqual(health_response.json(), {"status": "ok"})
        self.assertEqual(admin_response.status_code, 200)

    def test_legacy_web_urlconf_remains_in_codebase_for_transition_period(self):
        from apps.web import urls

        self.assertGreater(len(urls.urlpatterns), 0)
