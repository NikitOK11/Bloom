"""
Management command to verify and summarize data migration from legacy Event to
the new event-centric schema (EventEdition, EventEditionStage, etc.).
"""

from django.core.management.base import BaseCommand
from django.db.models import Count, F
from apps.events.models import (
    Event, EventEdition, EventEditionStage, University, 
    UniversityProgram, EventEditionAdmissionBenefit
)


class Command(BaseCommand):
    help = "Summarize event data migration to event-centric schema"

    def add_arguments(self, parser):
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Print detailed records',
        )

    def handle(self, *args, **options):
        verbose = options.get('verbose', False)
        
        self.stdout.write(self.style.HTTP_INFO('=' * 70))
        self.stdout.write(self.style.HTTP_INFO('Event Data Migration Summary'))
        self.stdout.write(self.style.HTTP_INFO('=' * 70))
        
        # Count records
        event_count = Event.objects.count()
        edition_count = EventEdition.objects.count()
        stage_count = EventEditionStage.objects.count()
        university_count = University.objects.count()
        program_count = UniversityProgram.objects.count()
        benefit_count = EventEditionAdmissionBenefit.objects.count()
        
        self.stdout.write('\n' + self.style.HTTP_SUCCESS('Core Event Data:'))
        self.stdout.write(f'  Events: {event_count}')
        self.stdout.write(f'  EventEditions: {edition_count}')
        self.stdout.write(f'  EventEditionStages: {stage_count}')
        
        self.stdout.write('\n' + self.style.HTTP_SUCCESS('University & Benefits Data:'))
        self.stdout.write(f'  Universities: {university_count}')
        self.stdout.write(f'  UniversityPrograms: {program_count}')
        self.stdout.write(f'  AdmissionBenefits: {benefit_count}')
        
        # Check coverage: events with editions
        events_with_editions = Event.objects.filter(editions__isnull=False).distinct().count()
        events_without_editions = event_count - events_with_editions
        
        self.stdout.write('\n' + self.style.HTTP_SUCCESS('Coverage:'))
        self.stdout.write(f'  Events with editions: {events_with_editions}')
        self.stdout.write(f'  Events without editions: {events_without_editions}')
        
        # Check editions with stages
        editions_with_stages = EventEdition.objects.filter(stages__isnull=False).distinct().count()
        editions_without_stages = edition_count - editions_with_stages
        
        self.stdout.write(f'  Editions with stages: {editions_with_stages}')
        self.stdout.write(f'  Editions without stages: {editions_without_stages}')
        
        # Detailed listing if verbose
        if verbose:
            self.stdout.write('\n' + self.style.HTTP_INFO('--- Detailed Event Records ---'))
            for event in Event.objects.all():
                self.stdout.write(f'\nEvent {event.id}: {event.title}')
                self.stdout.write(f'  Name: {event.name}')
                self.stdout.write(f'  Type: {event.event_type_code or "N/A"}')
                self.stdout.write(f'  Active: {event.is_active}')
                self.stdout.write(f'  Created: {event.created_at}')
                
                editions = event.editions.all()
                self.stdout.write(f'  Editions: {editions.count()}')
                for edition in editions:
                    self.stdout.write(f'    - {edition.edition_label}: {edition.status}')
                    stages = edition.stages.all()
                    self.stdout.write(f'      Stages: {stages.count()}')
                    for stage in stages:
                        self.stdout.write(f'        - Stage {stage.stage_number}: {stage.stage_name}')
        
        # Status summary
        self.stdout.write('\n' + self.style.HTTP_SUCCESS('Migration Status:'))
        if events_without_editions > 0:
            self.stdout.write(self.style.WARNING(
                f'  ⚠ {events_without_editions} events still lack editions - may need manual review'
            ))
        else:
            self.stdout.write(self.style.SUCCESS('  ✓ All events have editions'))
        
        if editions_without_stages > 0:
            self.stdout.write(self.style.WARNING(
                f'  ⚠ {editions_without_stages} editions lack stages - may need manual review'
            ))
        else:
            self.stdout.write(self.style.SUCCESS('  ✓ All editions have stages'))
        
        self.stdout.write('\n' + self.style.HTTP_INFO('=' * 70))
        self.stdout.write(self.style.SUCCESS('✓ Migration summary complete'))
        self.stdout.write(self.style.HTTP_INFO('=' * 70))
