from django.urls import path

from apps.accounts.views import CurrentUserAPIView, LoginAPIView, LogoutAPIView, SignupAPIView

urlpatterns = [
    path("signup/", SignupAPIView.as_view(), name="account-signup"),
    path("login/", LoginAPIView.as_view(), name="account-login"),
    path("logout/", LogoutAPIView.as_view(), name="account-logout"),
    path("me/", CurrentUserAPIView.as_view(), name="account-me"),
]
