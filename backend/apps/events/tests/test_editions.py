from datetime import date

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase

from apps.events.models import (
    Event,
    EventEdition,
    EventEditionStage,
    EventParticipationType,
    EventType,
)


class EventEditionTests(TestCase):
    def setUp(self):
        self.event_type = EventType.objects.create(name="Hackathon", slug="hackathon")
        self.event = Event.objects.create(
            title="Product Hackathon",
            event_type=self.event_type,
            participation_type=EventParticipationType.TEAM,
        )

    def create_edition(self, event=None, label="2026") -> EventEdition:
        return EventEdition.objects.create(
            event=event or self.event,
            edition_label=label,
            start_date=date(2026, 1, 1),
            end_date=date(2026, 12, 31),
            total_stages=2,
        )

    def test_event_edition_unique_per_event_and_label(self):
        self.create_edition()

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                self.create_edition()

    def test_event_edition_stage_unique_number_within_edition(self):
        edition = self.create_edition()
        EventEditionStage.objects.create(
            edition=edition,
            stage_number=1,
            stage_name="Registration",
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                EventEditionStage.objects.create(
                    edition=edition,
                    stage_number=1,
                    stage_name="Qualification",
                )

    def test_event_edition_current_stage_must_belong_to_same_edition(self):
        first_edition = self.create_edition(label="2026")
        second_edition = self.create_edition(label="2027")
        other_stage = EventEditionStage.objects.create(
            edition=second_edition,
            stage_number=1,
            stage_name="Registration",
        )

        first_edition.current_stage = other_stage

        with self.assertRaises(ValidationError) as exc:
            first_edition.full_clean()

        self.assertIn("current_stage", exc.exception.message_dict)

    def test_event_edition_validates_stage_count_and_date_order(self):
        edition = EventEdition(
            event=self.event,
            edition_label="Invalid",
            start_date=date(2026, 12, 31),
            end_date=date(2026, 1, 1),
            total_stages=0,
        )

        with self.assertRaises(ValidationError) as exc:
            edition.full_clean()

        self.assertIn("__all__", exc.exception.message_dict)

    def test_event_edition_stage_validates_stage_number_and_date_order(self):
        edition = self.create_edition()
        stage = EventEditionStage(
            edition=edition,
            stage_number=0,
            stage_name="Invalid stage",
            start_date=date(2026, 3, 1),
            end_date=date(2026, 2, 1),
        )

        with self.assertRaises(ValidationError) as exc:
            stage.full_clean()

        self.assertIn("__all__", exc.exception.message_dict)
