from rest_framework.permissions import BasePermission

from apps.competitions.models import CompetitionParticipant


class IsCompetitionOwner(BasePermission):
    def has_object_permission(self, request, view, obj) -> bool:
        return obj.owner_id == request.user.id


class IsCompetitionMemberOrOwner(BasePermission):
    def has_object_permission(self, request, view, obj) -> bool:
        if obj.owner_id == request.user.id:
            return True
        return CompetitionParticipant.objects.filter(competition=obj, user=request.user).exists()
