from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.competitions.views import CompetitionViewSet
from api.views import HealthCheckAPIView

router = DefaultRouter()
router.register("competitions", CompetitionViewSet, basename="competition")

urlpatterns = [
    path("health/", HealthCheckAPIView.as_view(), name="health"),
    path("", include(router.urls)),
]
