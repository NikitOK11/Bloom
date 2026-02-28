import math
import random

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.competitions.models import CompetitionParticipant, CompetitionTeam, CompetitionTeamRequest


def split_competition_teams(*, competition, owner, team_size: int, random_seed: int | None = None) -> list[dict]:
    participants = list(
        CompetitionParticipant.objects.filter(competition=competition)
        .select_related("user")
        .order_by("joined_at", "id")
    )
    users = [participant.user for participant in participants]

    if not users:
        raise ValidationError("No participants to split into teams.")

    if random_seed is not None:
        random.Random(random_seed).shuffle(users)
    else:
        random.shuffle(users)

    team_count = max(1, math.ceil(len(users) / team_size))

    with transaction.atomic():
        CompetitionTeamRequest.objects.filter(competition_team__competition=competition).delete()
        CompetitionTeam.objects.filter(competition=competition).delete()

        teams = [
            CompetitionTeam.objects.create(
                competition=competition,
                owner=owner,
                name=f"Team {index + 1}",
            )
            for index in range(team_count)
        ]
        team_sizes = {team.id: 0 for team in teams}

        for index, user in enumerate(users):
            team = teams[index % team_count]
            CompetitionTeamRequest.objects.create(competition_team=team, user=user)
            team_sizes[team.id] += 1

    return [
        {"id": team.id, "name": team.name, "size": team_sizes[team.id]}
        for team in teams
    ]
