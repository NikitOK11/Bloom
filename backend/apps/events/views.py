from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from apps.events.models import Event, EventEdition, University
from apps.events.serializers import (
    EventDetailSerializer,
    EventEditionDetailSerializer,
    EventEditionListSerializer,
    EventListSerializer,
    UniversitySerializer,
)


class EventViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only API for listing active events and retrieving event details.
    """
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return EventDetailSerializer
        return EventListSerializer

    def get_queryset(self):
        queryset = Event.objects.all().order_by("id")
        
        event_type = self.request.query_params.get("event_type")
        if event_type:
            queryset = queryset.filter(event_type_code=event_type)
            
        profile = self.request.query_params.get("profile")
        if profile:
            queryset = queryset.filter(profile_code=profile)
            
        participation_mode = self.request.query_params.get("participation_mode")
        if participation_mode:
            queryset = queryset.filter(participation_mode=participation_mode)
            
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            active_bool = str(is_active).lower() in ("true", "1", "yes", "t")
            queryset = queryset.filter(is_active=active_bool)
            
        return queryset


class EventEditionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only API for listing and retrieving event editions.
    """
    queryset = EventEdition.objects.all().order_by("id")
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return EventEditionDetailSerializer
        return EventEditionListSerializer


class UniversityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only API for listing and retrieving universities.
    """
    queryset = University.objects.all().order_by("id")
    permission_classes = [AllowAny]
    serializer_class = UniversitySerializer
