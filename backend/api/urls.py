from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.competitions.views import CompetitionViewSet
from apps.events.views import EventEditionViewSet, EventViewSet, UniversityViewSet
from api.views import HealthCheckAPIView

router = DefaultRouter()
router.register("competitions", CompetitionViewSet, basename="competition")
router.register("events", EventViewSet, basename="event")
router.register("event-editions", EventEditionViewSet, basename="event_edition")
router.register("universities", UniversityViewSet, basename="university")

urlpatterns = [
    path("health/", HealthCheckAPIView.as_view(), name="health"),
    path("", include(router.urls)),
]
