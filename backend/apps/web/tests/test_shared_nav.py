from django.test import TestCase
from django.urls import reverse


class SharedNavbarTests(TestCase):
    def test_home_renders_universal_navbar(self):
        response = self.client.get(reverse("web:home"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, reverse("web:event-list"))
        self.assertContains(response, reverse("web:calendar"))
        self.assertContains(response, reverse("web:profile"))
        self.assertContains(response, reverse("web:signup"))
        self.assertContains(response, "События")
        self.assertContains(response, "Календарь")
        self.assertContains(response, "Профиль")
        self.assertNotContains(response, ">Главная<", html=False)
        self.assertNotContains(response, ">Команды<", html=False)

    def test_header_brand_is_text_only(self):
        response = self.client.get(reverse("web:home"))

        self.assertEqual(response.status_code, 200)
        html = response.content.decode(response.charset or "utf-8")
        header_start = html.index('<header class="site-header">')
        footer_start = html.index('<footer class="site-footer">')
        header_markup = html[header_start:footer_start]

        self.assertIn('class="brand header-brand"', header_markup)
        self.assertNotIn('class="brand-mark"', header_markup)

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

    def test_signup_route_renders_safely(self):
        response = self.client.get(reverse("web:signup"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Регистрация")
        self.assertContains(response, 'name="password1"', html=False)
        self.assertContains(response, 'name="password2"', html=False)
