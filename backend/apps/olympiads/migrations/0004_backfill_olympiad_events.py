from django.db import migrations


def _get_olympiad_event_type(EventType):
    event_type, _ = EventType.objects.get_or_create(
        slug="olympiad",
        defaults={
            "name": "Olympiad",
            "is_active": True,
            "sort_order": 0,
        },
    )
    return event_type


def backfill_olympiad_events(apps, schema_editor):
    Event = apps.get_model("events", "Event")
    EventType = apps.get_model("events", "EventType")
    Olympiad = apps.get_model("olympiads", "Olympiad")
    Team = apps.get_model("teams", "Team")

    olympiads = Olympiad.objects.filter(event__isnull=True).order_by("id")
    if not olympiads.exists():
        return

    olympiad_event_type = _get_olympiad_event_type(EventType)

    for olympiad in olympiads:
        participation_type = "BOTH"
        if not Team.objects.filter(olympiad_id=olympiad.id).exists():
            participation_type = "INDIVIDUAL"

        event = Event.objects.create(
            title=olympiad.title,
            short_description="",
            description=olympiad.description or "",
            official_url="",
            organizer="",
            is_active=getattr(olympiad, "is_active", True),
            registration_deadline=None,
            event_type=olympiad_event_type,
            level=None,
            participation_type=participation_type,
            preferences="",
        )
        olympiad.event_id = event.id
        olympiad.save(update_fields=["event"])


class Migration(migrations.Migration):
    dependencies = [
        ("olympiads", "0003_olympiad_event"),
        ("teams", "0005_team_event_alter_team_olympiad"),
    ]

    operations = [
        migrations.RunPython(backfill_olympiad_events, migrations.RunPython.noop),
    ]
