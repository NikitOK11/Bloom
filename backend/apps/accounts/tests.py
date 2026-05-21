from django.contrib.auth import get_user_model
from django.contrib.auth import SESSION_KEY
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


class AccountsAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.password = "ComplexPass123!"
        self.user = User.objects.create_user(
            email="student@example.com",
            password=self.password,
            first_name="Иван",
            last_name="Петров",
            phone="+79990000000",
        )

    def test_signup_creates_user_and_starts_session(self):
        response = self.client.post(
            reverse("account-signup"),
            data={
                "email": "newuser@example.com",
                "password": "AnotherPass123!",
                "password_confirm": "AnotherPass123!",
                "first_name": "Анна",
                "last_name": "Иванова",
                "phone": "+79991112233",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="newuser@example.com").exists())
        self.assertEqual(response.json()["user"]["email"], "newuser@example.com")
        self.assertIn(SESSION_KEY, self.client.session)

    def test_signup_returns_validation_error_for_mismatched_passwords(self):
        response = self.client.post(
            reverse("account-signup"),
            data={
                "email": "broken@example.com",
                "password": "AnotherPass123!",
                "password_confirm": "WrongPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password_confirm", response.json())

    def test_login_starts_session_and_returns_user(self):
        response = self.client.post(
            reverse("account-login"),
            data={"email": self.user.email, "password": self.password},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["user"]["email"], self.user.email)
        self.assertEqual(self.client.session.get(SESSION_KEY), str(self.user.pk))

    def test_login_rejects_invalid_credentials(self):
        response = self.client.post(
            reverse("account-login"),
            data={"email": self.user.email, "password": "wrong-password"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("non_field_errors", response.json())

    def test_me_returns_current_user_for_authenticated_session(self):
        self.client.force_login(self.user)

        response = self.client.get(reverse("account-me"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["email"], self.user.email)

    def test_me_requires_authentication(self):
        response = self.client.get(reverse("account-me"))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_logout_clears_session(self):
        self.client.force_login(self.user)

        response = self.client.post(reverse("account-logout"), data={}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn(SESSION_KEY, self.client.session)

    def test_csrf_bootstrap_sets_cookie(self):
        response = self.client.get(reverse("account-csrf"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("csrftoken", response.cookies)


class AccountsCSRFSecurityTestCase(TestCase):
    def setUp(self):
        self.password = "ComplexPass123!"
        self.user = User.objects.create_user(
            email="csrf-user@example.com",
            password=self.password,
        )
        self.client = APIClient(enforce_csrf_checks=True)

    def _bootstrap_csrf(self):
        response = self.client.get(reverse("account-csrf"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.cookies["csrftoken"].value

    def test_login_requires_csrf_token(self):
        response = self.client.post(
            reverse("account-login"),
            data={"email": self.user.email, "password": self.password},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_login_succeeds_with_csrf_token(self):
        csrf_token = self._bootstrap_csrf()

        response = self.client.post(
            reverse("account-login"),
            data={"email": self.user.email, "password": self.password},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.session.get(SESSION_KEY), str(self.user.pk))

    def test_signup_requires_csrf_token(self):
        response = self.client.post(
            reverse("account-signup"),
            data={
                "email": "csrf-signup@example.com",
                "password": "AnotherPass123!",
                "password_confirm": "AnotherPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_logout_requires_csrf_token(self):
        csrf_token = self._bootstrap_csrf()
        self.client.post(
            reverse("account-login"),
            data={"email": self.user.email, "password": self.password},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )

        logout_response = self.client.post(reverse("account-logout"), data={}, format="json")

        self.assertEqual(logout_response.status_code, status.HTTP_403_FORBIDDEN)
