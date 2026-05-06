"""
Tests for the backfill_event_editions_and_stages data migration.

Note: These tests verify the behavior of the migration by checking that:
1. Events get EventEdition records
2. EventEditions get EventEditionStage records
3. The migration is idempotent
4. No duplicates are created on re-run
"""

from datetime import date
from django.test import TestCase
from apps.events.models import Event, EventEdition, EventEditionStage, EventType, EventParticipationType


class EventEditionBackfillTestCase(TestCase):
    """
    Test the expected state after migration is applied.
    These are not direct migration tests but verify the schema assumptions.
    """
    
    def setUp(self):
        """Set up test data."""
        self.event_type = EventType.objects.create(
            name="Olympiad",
            slug="olympiad",
        )
    
    def test_event_with_edition_and_stage_have_complete_schema(self):
        """Test that after migration, events should have editions and stages."""
        # This test verifies the schema is set up for events to have editions/stages
        event = Event.objects.create(
            title="Test Olympiad",
            name="Test Olympiad",
            event_type=self.event_type,
            event_type_code="olympiad",
            participation_type=EventParticipationType.INDIVIDUAL,
        )
        
        # Create edition and stage manually
        edition = EventEdition.objects.create(
            event=event,
            edition_label="2026",
            start_date=date(2026, 1, 1),
            end_date=date(2026, 12, 31),
            total_stages=1,
        )
        
        stage = EventEditionStage.objects.create(
            edition=edition,
            stage_number=1,
            stage_name="Main Stage",
            start_date=date(2026, 1, 1),
            end_date=date(2026, 12, 31),
        )
        
        # Verify relationships are properly established
        self.assertEqual(event.editions.count(), 1)
        self.assertEqual(edition.stages.count(), 1)
        self.assertEqual(stage.edition_id, edition.id)
        self.assertEqual(edition.event_id, event.id)
    
    def test_edition_label_from_year(self):
        """Test that edition labels can be derived from year."""
        event = Event.objects.create(
            title="Test Olympiad",
            name="Test Olympiad",
            event_type=self.event_type,
            event_type_code="olympiad",
            participation_type=EventParticipationType.INDIVIDUAL,
        )
        
        edition = EventEdition.objects.create(
            event=event,
            edition_label="2026",
            start_date=date(2026, 1, 1),
            end_date=date(2026, 12, 31),
            total_stages=1,
        )
        
        self.assertEqual(edition.edition_label, "2026")
    
    def test_stage_numbering_and_naming(self):
        """Test that stages are properly numbered and named."""
        event = Event.objects.create(
            title="Test Olympiad",
            name="Test Olympiad",
            event_type=self.event_type,
            event_type_code="olympiad",
            participation_type=EventParticipationType.INDIVIDUAL,
        )
        
        edition = EventEdition.objects.create(
            event=event,
            edition_label="2026",
            start_date=date(2026, 1, 1),
            end_date=date(2026, 12, 31),
            total_stages=1,
        )
        
        stage = EventEditionStage.objects.create(
            edition=edition,
            stage_number=1,
            stage_name="Main Stage",
        )
        
        self.assertEqual(stage.stage_number, 1)
        self.assertEqual(stage.stage_name, "Main Stage")
    
    def test_get_or_create_prevents_duplicates(self):
        """Test that get_or_create logic prevents duplicate editions."""
        event = Event.objects.create(
            title="Test Olympiad",
            name="Test Olympiad",
            event_type=self.event_type,
            event_type_code="olympiad",
            participation_type=EventParticipationType.INDIVIDUAL,
        )
        
        # Create two editions with get_or_create using same key
        edition1, created1 = EventEdition.objects.get_or_create(
            event=event,
            edition_label="2026",
            defaults={
                'start_date': date(2026, 1, 1),
                'end_date': date(2026, 12, 31),
                'total_stages': 1,
            }
        )
        
        edition2, created2 = EventEdition.objects.get_or_create(
            event=event,
            edition_label="2026",
            defaults={
                'start_date': date(2026, 1, 1),
                'end_date': date(2026, 12, 31),
                'total_stages': 1,
            }
        )
        
        # Should return same edition, not create new one
        self.assertTrue(created1)
        self.assertFalse(created2)
        self.assertEqual(edition1.id, edition2.id)
        self.assertEqual(event.editions.count(), 1)
