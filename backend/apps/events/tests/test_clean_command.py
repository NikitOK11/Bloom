from datetime import date
from io import StringIO

from django.core.management import call_command
from django.test import TestCase

from apps.events.models import (
    Event,
    EventEdition,
    EventEditionAdmissionBenefit,
    EventEditionStage,
    EventLevel,
    EventType,
    University,
    UniversityProgram,
)


class CleanEventDataCommandTestCase(TestCase):
    def setUp(self):
        self.event_type = EventType.objects.create(name="Test Type", slug="test-type")
        self.event_level = EventLevel.objects.create(name="Test Level", slug="test-level")

    def run_command(self, *args):
        output = StringIO()
        call_command("clean_event_data", *args, stdout=output)
        return output.getvalue()

    def create_event(self, **overrides):
        defaults = {
            "name": "Math Olympiad",
            "title": "Math Olympiad",
            "event_type_code": "olympiad",
            "profile_code": "math",
            "level_code": "level_1",
            "participation_mode": "individual",
            "is_active": True,
            "event_type": self.event_type,
            "level": self.event_level,
            "participation_type": "INDIVIDUAL",
            "official_url": "https://example.com",
            "eligible_groups": ["student"],
        }
        defaults.update(overrides)
        return Event.objects.create(**defaults)

    def test_dry_run_on_empty_database(self):
        output = self.run_command()
        self.assertIn("Bloom Event Data Cleanup", output)
        self.assertIn("Mode: DRY RUN", output)
        self.assertIn("Database modified: NO", output)

    def test_apply_trims_whitespace_updates_stages_and_deactivates_placeholders(self):
        event = self.create_event(name="  test  ", title="  Math Olympiad  ", is_active=True)
        edition = EventEdition.objects.create(
            event=event,
            edition_label=" 2025/2026 ",
            start_date=date(2025, 9, 1),
            end_date=date(2026, 5, 30),
            total_stages=2,
            status="planned",
        )
        stage = EventEditionStage.objects.create(
            edition=edition,
            stage_number=1,
            stage_name="  Qualifying  ",
            status="ongoing",
        )
        edition.current_stage = stage
        edition.save(update_fields=["current_stage"])

        university = University.objects.create(
            name=" Test University ",
            short_name=" TU ",
            city=" Moscow ",
            website_url=" https://example.com ",
        )
        program = UniversityProgram.objects.create(
            university=university,
            name=" Computer Science ",
            level="bachelor",
            code=" 01.03.02 ",
        )
        benefit = EventEditionAdmissionBenefit.objects.create(
            event_edition=edition,
            university=university,
            benefit_type="bvi",
            winner_benefit=" 100% ",
            prizewinner_benefit=" 90% ",
            source_url=" https://example.com/benefit ",
            note="  note  ",
        )
        benefit.programs.add(program)

        output = self.run_command("--apply")

        event.refresh_from_db()
        edition.refresh_from_db()
        stage.refresh_from_db()
        university.refresh_from_db()
        program.refresh_from_db()
        benefit.refresh_from_db()

        self.assertIn("Mode: APPLY", output)
        self.assertIn("Database modified: YES", output)
        self.assertEqual(event.name, "test")
        self.assertFalse(event.is_active)
        self.assertEqual(edition.edition_label, "2025/2026")
        self.assertEqual(edition.total_stages, 1)
        self.assertEqual(stage.stage_name, "Qualifying")
        self.assertEqual(university.name, "Test University")
        self.assertEqual(university.short_name, "TU")
        self.assertEqual(university.city, "Moscow")
        self.assertEqual(program.name, "Computer Science")
        self.assertEqual(program.code, "01.03.02")
        self.assertEqual(benefit.winner_benefit, "100%")
        self.assertEqual(benefit.prizewinner_benefit, "90%")
        self.assertEqual(benefit.note, "note")

    def test_apply_merges_exact_duplicate_events(self):
        first = self.create_event(name="Math Olympiad")
        second = self.create_event(name=" Math Olympiad ", title="Math Olympiad")

        output = self.run_command("--apply")

        self.assertIn("Merge exact duplicate Events", output)
        self.assertEqual(Event.objects.count(), 1)
        remaining_event = Event.objects.get()
        self.assertIn(remaining_event.id, {first.id, second.id})
        self.assertEqual(remaining_event.name, "Math Olympiad")

    def test_apply_merges_duplicate_universities_and_reassigns_programs_and_benefits(self):
        event = self.create_event()
        edition = EventEdition.objects.create(
            event=event,
            edition_label="2026",
            start_date=date(2026, 1, 1),
            end_date=date(2026, 12, 31),
            total_stages=1,
            status="planned",
        )

        keep_university = University.objects.create(
            name="Test University",
            short_name="TU",
            city="Moscow",
            website_url="https://example.com",
        )
        source_university = University.objects.create(
            name=" Test University ",
            short_name="TU",
            city="Moscow",
            website_url="https://example.com",
        )
        program = UniversityProgram.objects.create(
            university=source_university,
            name=" Computer Science ",
            level="bachelor",
            code="01.03.02",
        )
        benefit = EventEditionAdmissionBenefit.objects.create(
            event_edition=edition,
            university=source_university,
            benefit_type="bvi",
            winner_benefit=" 100% ",
        )
        benefit.programs.add(program)

        output = self.run_command("--apply")

        self.assertIn("Merge exact duplicate Universities", output)
        self.assertEqual(University.objects.count(), 1)
        benefit.refresh_from_db()
        program.refresh_from_db()
        self.assertEqual(benefit.university_id, keep_university.id)
        self.assertEqual(program.university_id, keep_university.id)
        self.assertEqual(benefit.winner_benefit, "100%")

    def test_apply_repairs_current_stage_when_it_points_to_wrong_edition(self):
        event = self.create_event(name="Physics Olympiad", title="Physics Olympiad")
        first_edition = EventEdition.objects.create(
            event=event,
            edition_label="2025",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 12, 31),
            total_stages=1,
            status="planned",
        )
        second_edition = EventEdition.objects.create(
            event=event,
            edition_label="2026",
            start_date=date(2026, 1, 1),
            end_date=date(2026, 12, 31),
            total_stages=1,
            status="planned",
        )
        wrong_stage = EventEditionStage.objects.create(
            edition=second_edition,
            stage_number=1,
            stage_name="Final",
            status="ongoing",
        )
        first_edition.current_stage = wrong_stage
        first_edition.save(update_fields=["current_stage"])

        self.run_command("--apply")

        first_edition.refresh_from_db()
        self.assertIsNone(first_edition.current_stage)
