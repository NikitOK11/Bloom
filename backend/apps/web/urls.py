from django.contrib.auth import views as auth_views
from django.urls import path

from apps.web.views import (
    EventDetailView,
    EventTeamCreateView,
    EventListView,
    HomeView,
    OlympiadListView,
    TeamDetailView,
    approve_join_request_view,
    join_team_view,
    reject_join_request_view,
)

app_name = "web"

urlpatterns = [
    path("", HomeView.as_view(), name="home"),
    path("login/", auth_views.LoginView.as_view(template_name="registration/login.html"), name="login"),
    path("logout/", auth_views.LogoutView.as_view(), name="logout"),
    path("olympiads/", OlympiadListView.as_view(), name="olympiad-list"),
    path("events/", EventListView.as_view(), name="event-list"),
    path("events/<int:pk>/", EventDetailView.as_view(), name="event-detail"),
    path("events/<int:pk>/teams/new/", EventTeamCreateView.as_view(), name="event-team-create"),
    path("teams/<int:pk>/", TeamDetailView.as_view(), name="team-detail"),
    path("teams/<int:pk>/join/", join_team_view, name="team-join"),
    path("join-requests/<int:pk>/approve/", approve_join_request_view, name="join-request-approve"),
    path("join-requests/<int:pk>/reject/", reject_join_request_view, name="join-request-reject"),
]
