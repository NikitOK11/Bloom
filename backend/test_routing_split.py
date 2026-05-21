from django.test import TestCase


class RoutingSplitTests(TestCase):
    def test_user_facing_routes_are_not_served_by_django(self):
        for path in ["/", "/events/", "/olympiads/", "/profile/", "/login/", "/signup/", "/teams/1/"]:
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 404)

    def test_django_keeps_api_and_admin_routes(self):
        health_response = self.client.get("/api/health/")
        admin_response = self.client.get("/admin/login/")

        self.assertEqual(health_response.status_code, 200)
        self.assertEqual(health_response.json(), {"status": "ok"})
        self.assertEqual(admin_response.status_code, 200)
