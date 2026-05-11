from django.test import TestCase
from django.urls import reverse


class SharedNavbarTests(TestCase):
    def test_home_renders_universal_navbar(self):
        response = self.client.get(reverse("web:home"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, reverse("web:event-list"))
        self.assertContains(response, reverse("web:calendar"))
        self.assertContains(response, reverse("web:profile"))
        self.assertContains(response, "События")
        self.assertContains(response, "Календарь")
        self.assertContains(response, "Профиль")
        self.assertNotContains(response, ">Главная<", html=False)
        self.assertNotContains(response, ">Команды<", html=False)

    def test_calendar_route_renders_safely(self):
        response = self.client.get(reverse("web:calendar"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Календарь контрольных точек по событиям")
        self.assertContains(response, 'class="nav-link nav-link-primary" href="/calendar/"', html=False)

    def test_profile_route_renders_safely(self):
        response = self.client.get(reverse("web:profile"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Гость Bloom")
        self.assertContains(response, 'class="nav-link nav-link-primary" href="/profile/"', html=False)
