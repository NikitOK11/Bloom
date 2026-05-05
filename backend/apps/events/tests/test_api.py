from datetime import date

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

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


class EventAPITestCase(APITestCase):
    def setUp(self):
        # Create legacy dependencies to create Event
        self.event_type = EventType.objects.create(name="Test Type", slug="test-type")
        self.event_level = EventLevel.objects.create(name="Test Level", slug="test-level")
        
        self.event_active = Event.objects.create(
            title="Active Event",
            name="Active Event Name",
            event_type_code="olympiad",
            profile_code="math",
            participation_mode="individual",
            is_active=True,
            event_type=self.event_type,
            level=self.event_level,
            participation_type="INDIVIDUAL",
        )
        self.event_inactive = Event.objects.create(
            title="Inactive Event",
            name="Inactive Event Name",
            event_type_code="hackathon",
            profile_code="it",
            participation_mode="team",
            is_active=False,
            event_type=self.event_type,
            level=self.event_level,
            participation_type="TEAM",
        )
        
        self.edition = EventEdition.objects.create(
            event=self.event_active,
            edition_label="2025/2026",
            start_date=date(2025, 9, 1),
            end_date=date(2026, 5, 30),
            total_stages=2,
            status="planned",
        )
        
        self.stage = EventEditionStage.objects.create(
            edition=self.edition,
            stage_number=1,
            stage_name="Qualifying",
            status="planned",
        )
        
        self.edition.current_stage = self.stage
        self.edition.save()
        
        self.university = University.objects.create(
            name="Test University",
            short_name="TU",
            city="Moscow",
        )
        
        self.program = UniversityProgram.objects.create(
            university=self.university,
            name="Computer Science",
            level="bachelor",
        )
        
        self.benefit = EventEditionAdmissionBenefit.objects.create(
            event_edition=self.edition,
            university=self.university,
            benefit_type="bvi",
        )
        self.benefit.programs.add(self.program)

    def test_list_events(self):
        url = reverse("event-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return both active and inactive events by default as we don't implicitly filter
        self.assertEqual(len(response.data), 2)

    def test_filter_events_is_active(self):
        url = reverse("event-list")
        response = self.client.get(url, {"is_active": "true"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.event_active.id)

    def test_filter_events_event_type(self):
        url = reverse("event-list")
        response = self.client.get(url, {"event_type": "hackathon"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.event_inactive.id)

    def test_event_detail_includes_editions(self):
        url = reverse("event-detail", args=[self.event_active.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("editions", response.data)
        self.assertEqual(len(response.data["editions"]), 1)
        self.assertEqual(response.data["editions"][0]["id"], self.edition.id)

    def test_edition_detail_includes_stages_and_benefits(self):
        url = reverse("event_edition-detail", args=[self.edition.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertIn("stages", response.data)
        self.assertEqual(len(response.data["stages"]), 1)
        self.assertEqual(response.data["stages"][0]["id"], self.stage.id)
        
        self.assertIn("admission_benefits", response.data)
        self.assertEqual(len(response.data["admission_benefits"]), 1)
        self.assertEqual(response.data["admission_benefits"][0]["id"], self.benefit.id)
        
        # Test benefit includes university and programs
        benefit_data = response.data["admission_benefits"][0]
        self.assertEqual(benefit_data["university"]["id"], self.university.id)
        self.assertEqual(len(benefit_data["programs"]), 1)
        self.assertEqual(benefit_data["programs"][0]["id"], self.program.id)

    def test_list_universities(self):
        url = reverse("university-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.university.id)
