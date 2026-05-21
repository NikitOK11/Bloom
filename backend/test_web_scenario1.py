from django.test import SimpleTestCase
from django.urls import NoReverseMatch, reverse


class WebScenario1Tests(SimpleTestCase):
    def test_legacy_web_namespace_is_not_registered_in_root_urlconf(self):
        with self.assertRaises(NoReverseMatch):
            reverse("web:home")

    def test_django_no_longer_serves_user_facing_team_flow_routes(self):
        for path in ["/teams/1/", "/events/1/teams/new/"]:
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 404)
