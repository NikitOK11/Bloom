import re
from collections import defaultdict
from datetime import date
from typing import Any, Dict, List, Set, Tuple

from django.core.management.base import BaseCommand
from django.db.models import Count, Q

from apps.events.models import (
    Event,
    EventEdition,
    EventEditionAdmissionBenefit,
    EventEditionStage,
    University,
    UniversityProgram,
)


class AuditCommand(BaseCommand):
    """Non-destructive database audit command for event data."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.issues = defaultdict(list)
        self.total_suspicious_categories = 0
        self.total_suspicious_records = set()

    def normalize_string(self, s: str | None) -> str:
        """Normalize a string for comparison: trim, collapse spaces, lowercase."""
        if not s:
            return ""
        return " ".join(s.strip().split()).lower()

    def truncate_ids(self, ids: List[int], max_count: int = 50) -> str:
        """Format a list of IDs, truncating if necessary."""
        if len(ids) <= max_count:
            return str(ids)
        return str(ids[:max_count]) + f" ... ({len(ids) - max_count} more)"

    def add_issue(self, category: str, issue_type: str, count: int, ids: List[int]) -> None:
        """Add an issue to the report."""
        self.issues[category].append({
            "type": issue_type,
            "count": count,
            "ids": ids,
        })
        self.total_suspicious_categories += 1
        self.total_suspicious_records.update(ids)

    def get_model_choices(self, model, field_name: str) -> Set[str]:
        """Safely get choice values for a model field."""
        try:
            field = model._meta.get_field(field_name)
            if hasattr(field, "choices"):
                return {choice[0] for choice in field.choices}
        except Exception:
            pass
        return set()

    def has_placeholder_name(self, name: str | None) -> bool:
        """Check if a name looks like a placeholder."""
        if not name:
            return False
        normalized = self.normalize_string(name)
        placeholders = {"test", "demo", "sample", "asdf", "qwerty", "123", "temp", "placeholder"}
        return normalized in placeholders

    def check_events(self) -> None:
        """Check Events for suspicious data."""
        events = Event.objects.all()
        total = events.count()
        self.stdout.write("Events")
        self.stdout.write("-" * 40)
        self.stdout.write(f"[OK] Total records: {total}")

        if total == 0:
            return

        issues_found = {}

        # Empty or null names
        empty_names = list(events.filter(Q(name__isnull=True) | Q(name__exact="")).values_list("id", flat=True))
        if empty_names:
            issues_found["empty_names"] = empty_names

        # Empty or null profile_code
        empty_profiles = list(events.filter(Q(profile_code__isnull=True) | Q(profile_code__exact="")).values_list("id", flat=True))
        if empty_profiles:
            issues_found["empty_profiles"] = empty_profiles

        # Invalid event_type_code
        valid_event_types = self.get_model_choices(Event, "event_type_code")
        if valid_event_types:
            invalid_types = list(
                events.filter(event_type_code__isnull=False).exclude(event_type_code__in=valid_event_types).values_list("id", flat=True)
            )
            if invalid_types:
                issues_found["invalid_event_types"] = invalid_types

        # Invalid participation_mode
        valid_modes = self.get_model_choices(Event, "participation_mode")
        if valid_modes:
            invalid_modes = list(
                events.filter(participation_mode__isnull=False).exclude(participation_mode__in=valid_modes).values_list("id", flat=True)
            )
            if invalid_modes:
                issues_found["invalid_participation_modes"] = invalid_modes

        # Placeholder names
        placeholder_events = [e.id for e in events if self.has_placeholder_name(e.name)]
        if placeholder_events:
            issues_found["placeholder_names"] = placeholder_events

        # Duplicate events by normalized name and event_type
        seen = {}
        duplicates = defaultdict(list)
        for event in events:
            key = (self.normalize_string(event.name), event.event_type_code)
            if key not in seen:
                seen[key] = event.id
            else:
                duplicates[key].append(event.id)

        duplicate_ids = set()
        for key, event_id in seen.items():
            if key in duplicates:
                duplicate_ids.add(event_id)
                duplicate_ids.update(duplicates[key])

        if duplicate_ids:
            issues_found["duplicate_events"] = list(duplicate_ids)

        # Inactive events with active editions
        inactive_with_active_editions = []
        for event in events.filter(is_active=False):
            active_statuses = {"planned", "registration_open", "ongoing"}
            if event.editions.filter(status__in=active_statuses).exists():
                inactive_with_active_editions.append(event.id)
        if inactive_with_active_editions:
            issues_found["inactive_with_active_editions"] = inactive_with_active_editions

        # Events with no editions
        events_no_editions = list(events.filter(editions__isnull=True).values_list("id", flat=True))
        if events_no_editions:
            issues_found["no_editions"] = events_no_editions

        # Report issues
        for issue_type, ids in issues_found.items():
            self.add_issue("events", issue_type, len(ids), ids)
            issue_labels = {
                "empty_names": "Empty names",
                "empty_profiles": "Empty profiles",
                "invalid_event_types": "Invalid event types",
                "invalid_participation_modes": "Invalid participation modes",
                "placeholder_names": "Placeholder names",
                "duplicate_events": "Duplicate events",
                "inactive_with_active_editions": "Inactive with active editions",
                "no_editions": "No editions",
            }
            self.stdout.write(f"[ISSUE] {issue_labels.get(issue_type, issue_type)}: count={len(ids)} ids={self.truncate_ids(ids)}")

    def check_event_editions(self) -> None:
        """Check EventEditions for suspicious data."""
        editions = EventEdition.objects.all()
        total = editions.count()
        self.stdout.write("\nEvent Editions")
        self.stdout.write("-" * 40)
        self.stdout.write(f"[OK] Total records: {total}")

        if total == 0:
            return

        issues_found = {}

        # Empty or null edition_label
        empty_labels = list(editions.filter(Q(edition_label__isnull=True) | Q(edition_label__exact="")).values_list("id", flat=True))
        if empty_labels:
            issues_found["empty_labels"] = empty_labels

        # Invalid date ranges (start_date > end_date)
        invalid_dates = []
        for edition in editions:
            if edition.start_date and edition.end_date and edition.start_date > edition.end_date:
                invalid_dates.append(edition.id)
        if invalid_dates:
            issues_found["invalid_date_ranges"] = invalid_dates

        # Invalid registration date ranges
        invalid_reg_dates = []
        for edition in editions:
            if (
                edition.registration_start_date
                and edition.registration_end_date
                and edition.registration_start_date > edition.registration_end_date
            ):
                invalid_reg_dates.append(edition.id)
        if invalid_reg_dates:
            issues_found["invalid_reg_date_ranges"] = invalid_reg_dates

        # total_stages <= 0
        invalid_stages_count = list(editions.filter(total_stages__lte=0).values_list("id", flat=True))
        if invalid_stages_count:
            issues_found["invalid_stages_count"] = invalid_stages_count

        # total_stages mismatch with actual stages
        stage_mismatches = []
        for edition in editions:
            actual_count = edition.stages.count()
            if actual_count != edition.total_stages:
                stage_mismatches.append(edition.id)
        if stage_mismatches:
            issues_found["stage_count_mismatch"] = stage_mismatches

        # Null current_stage while status is active/ongoing
        active_statuses_without_stage = []
        for edition in editions:
            if not edition.current_stage and edition.status in {"registration_open", "ongoing"}:
                active_statuses_without_stage.append(edition.id)
        if active_statuses_without_stage:
            issues_found["null_current_stage_active"] = active_statuses_without_stage

        # current_stage from another edition
        current_stage_wrong_edition = []
        for edition in editions.filter(current_stage__isnull=False):
            if edition.current_stage.edition_id != edition.id:
                current_stage_wrong_edition.append(edition.id)
        if current_stage_wrong_edition:
            issues_found["current_stage_wrong_edition"] = current_stage_wrong_edition

        # Invalid status values
        valid_statuses = self.get_model_choices(EventEdition, "status")
        if valid_statuses:
            invalid_status = list(editions.exclude(status__in=valid_statuses).values_list("id", flat=True))
            if invalid_status:
                issues_found["invalid_status"] = invalid_status

        # Duplicate editions (event, edition_label)
        seen = {}
        duplicates_set = set()
        for edition in editions:
            key = (edition.event_id, self.normalize_string(edition.edition_label))
            if key not in seen:
                seen[key] = edition.id
            else:
                duplicates_set.add(seen[key])
                duplicates_set.add(edition.id)
        if duplicates_set:
            issues_found["duplicate_editions"] = list(duplicates_set)

        # Report issues
        for issue_type, ids in issues_found.items():
            self.add_issue("event_editions", issue_type, len(ids), ids)
            issue_labels = {
                "empty_labels": "Empty labels",
                "invalid_date_ranges": "Invalid date ranges",
                "invalid_reg_date_ranges": "Invalid registration date ranges",
                "invalid_stages_count": "Invalid stages count",
                "stage_count_mismatch": "Stage count mismatch",
                "null_current_stage_active": "Null current stage in active edition",
                "current_stage_wrong_edition": "Current stage from wrong edition",
                "invalid_status": "Invalid status",
                "duplicate_editions": "Duplicate editions",
            }
            self.stdout.write(f"[ISSUE] {issue_labels.get(issue_type, issue_type)}: count={len(ids)} ids={self.truncate_ids(ids)}")

    def check_event_edition_stages(self) -> None:
        """Check EventEditionStages for suspicious data."""
        stages = EventEditionStage.objects.all()
        total = stages.count()
        self.stdout.write("\nEvent Edition Stages")
        self.stdout.write("-" * 40)
        self.stdout.write(f"[OK] Total records: {total}")

        if total == 0:
            return

        issues_found = {}

        # stage_number <= 0
        invalid_stage_numbers = list(stages.filter(stage_number__lte=0).values_list("id", flat=True))
        if invalid_stage_numbers:
            issues_found["invalid_stage_numbers"] = invalid_stage_numbers

        # Empty stage_name
        empty_names = list(stages.filter(Q(stage_name__isnull=True) | Q(stage_name__exact="")).values_list("id", flat=True))
        if empty_names:
            issues_found["empty_names"] = empty_names

        # Invalid date ranges
        invalid_dates = []
        for stage in stages:
            if stage.start_date and stage.end_date and stage.start_date > stage.end_date:
                invalid_dates.append(stage.id)
        if invalid_dates:
            issues_found["invalid_date_ranges"] = invalid_dates

        # Invalid status values
        valid_statuses = self.get_model_choices(EventEditionStage, "status")
        if valid_statuses:
            invalid_status = list(stages.exclude(status__in=valid_statuses).values_list("id", flat=True))
            if invalid_status:
                issues_found["invalid_status"] = invalid_status

        # Invalid format values
        valid_formats = self.get_model_choices(EventEditionStage, "format")
        if valid_formats:
            invalid_format = list(stages.exclude(format__in=valid_formats).values_list("id", flat=True))
            if invalid_format:
                issues_found["invalid_format"] = invalid_format

        # Duplicate stage_number within edition
        duplicate_stage_numbers = []
        for stage in stages:
            other_with_same_number = stages.filter(
                edition_id=stage.edition_id,
                stage_number=stage.stage_number
            ).exclude(id=stage.id).exists()
            if other_with_same_number:
                duplicate_stage_numbers.append(stage.id)
        if duplicate_stage_numbers:
            issues_found["duplicate_stage_numbers"] = list(set(duplicate_stage_numbers))

        # Multiple ongoing stages per edition
        multiple_ongoing = []
        editions_with_multiple_ongoing = stages.filter(
            status="ongoing"
        ).values("edition_id").annotate(
            count=Count("id")
        ).filter(count__gt=1)
        
        for row in editions_with_multiple_ongoing:
            ongoing_ids = list(
                stages.filter(edition_id=row["edition_id"], status="ongoing").values_list("id", flat=True)
            )
            multiple_ongoing.extend(ongoing_ids)

        # Report issues
        for issue_type, ids in issues_found.items():
            self.add_issue("event_edition_stages", issue_type, len(ids), ids)
            issue_labels = {
                "invalid_stage_numbers": "Invalid stage numbers",
                "empty_names": "Empty names",
                "invalid_date_ranges": "Invalid date ranges",
                "invalid_status": "Invalid status",
                "invalid_format": "Invalid format",
                "duplicate_stage_numbers": "Duplicate stage numbers in edition",
                "multiple_ongoing": "Multiple ongoing stages per edition",
            }
            self.stdout.write(f"[ISSUE] {issue_labels.get(issue_type, issue_type)}: count={len(ids)} ids={self.truncate_ids(ids)}")

    def check_universities(self) -> None:
        """Check Universities for suspicious data."""
        universities = University.objects.all()
        total = universities.count()
        self.stdout.write("\nUniversities")
        self.stdout.write("-" * 40)
        self.stdout.write(f"[OK] Total records: {total}")

        if total == 0:
            return

        issues_found = {}

        # Empty name
        empty_names = list(universities.filter(Q(name__isnull=True) | Q(name__exact="")).values_list("id", flat=True))
        if empty_names:
            issues_found["empty_names"] = empty_names

        # Placeholder names
        placeholder_unis = [u.id for u in universities if self.has_placeholder_name(u.name)]
        if placeholder_unis:
            issues_found["placeholder_names"] = placeholder_unis

        # Duplicate universities by normalized name
        seen = {}
        duplicates_set = set()
        for uni in universities:
            key = self.normalize_string(uni.name)
            if key in seen:
                duplicates_set.add(seen[key])
                duplicates_set.add(uni.id)
            else:
                seen[key] = uni.id
        if duplicates_set:
            issues_found["duplicate_names"] = list(duplicates_set)

        # Invalid website URLs
        invalid_urls = []
        for uni in universities.filter(website_url__isnull=False).exclude(website_url__exact=""):
            if not (uni.website_url.startswith("http://") or uni.website_url.startswith("https://")):
                invalid_urls.append(uni.id)
        if invalid_urls:
            issues_found["invalid_urls"] = invalid_urls

        # Report issues
        for issue_type, ids in issues_found.items():
            self.add_issue("universities", issue_type, len(ids), ids)
            issue_labels = {
                "empty_names": "Empty names",
                "placeholder_names": "Placeholder names",
                "duplicate_names": "Duplicate names",
                "invalid_urls": "Invalid URLs",
            }
            self.stdout.write(f"[ISSUE] {issue_labels.get(issue_type, issue_type)}: count={len(ids)} ids={self.truncate_ids(ids)}")

    def check_university_programs(self) -> None:
        """Check UniversityPrograms for suspicious data."""
        programs = UniversityProgram.objects.all()
        total = programs.count()
        self.stdout.write("\nUniversity Programs")
        self.stdout.write("-" * 40)
        self.stdout.write(f"[OK] Total records: {total}")

        if total == 0:
            return

        issues_found = {}

        # Empty name
        empty_names = list(programs.filter(Q(name__isnull=True) | Q(name__exact="")).values_list("id", flat=True))
        if empty_names:
            issues_found["empty_names"] = empty_names

        # Placeholder names
        placeholder_progs = [p.id for p in programs if self.has_placeholder_name(p.name)]
        if placeholder_progs:
            issues_found["placeholder_names"] = placeholder_progs

        # Invalid level values
        valid_levels = self.get_model_choices(UniversityProgram, "level")
        if valid_levels:
            invalid_levels = list(programs.exclude(level__in=valid_levels).values_list("id", flat=True))
            if invalid_levels:
                issues_found["invalid_levels"] = invalid_levels

        # Duplicate programs (university, name, level)
        seen = {}
        duplicates_set = set()
        for prog in programs:
            key = (prog.university_id, self.normalize_string(prog.name), prog.level)
            if key in seen:
                duplicates_set.add(seen[key])
                duplicates_set.add(prog.id)
            else:
                seen[key] = prog.id
        if duplicates_set:
            issues_found["duplicate_programs"] = list(duplicates_set)

        # Report issues
        for issue_type, ids in issues_found.items():
            self.add_issue("university_programs", issue_type, len(ids), ids)
            issue_labels = {
                "empty_names": "Empty names",
                "placeholder_names": "Placeholder names",
                "invalid_levels": "Invalid levels",
                "duplicate_programs": "Duplicate programs",
            }
            self.stdout.write(f"[ISSUE] {issue_labels.get(issue_type, issue_type)}: count={len(ids)} ids={self.truncate_ids(ids)}")

    def check_admission_benefits(self) -> None:
        """Check EventEditionAdmissionBenefits for suspicious data."""
        benefits = EventEditionAdmissionBenefit.objects.all()
        total = benefits.count()
        self.stdout.write("\nAdmission Benefits")
        self.stdout.write("-" * 40)
        self.stdout.write(f"[OK] Total records: {total}")

        if total == 0:
            return

        issues_found = {}

        # Invalid benefit_type
        valid_types = self.get_model_choices(EventEditionAdmissionBenefit, "benefit_type")
        if valid_types:
            invalid_types = list(benefits.exclude(benefit_type__in=valid_types).values_list("id", flat=True))
            if invalid_types:
                issues_found["invalid_types"] = invalid_types

        # Empty winner_benefit and prizewinner_benefit
        both_empty = []
        for benefit in benefits:
            if (not benefit.winner_benefit or benefit.winner_benefit.strip() == "") and (
                not benefit.prizewinner_benefit or benefit.prizewinner_benefit.strip() == ""
            ):
                both_empty.append(benefit.id)
        if both_empty:
            issues_found["both_benefits_empty"] = both_empty

        # Missing or empty source_url
        missing_source = []
        for benefit in benefits:
            if not benefit.source_url or benefit.source_url.strip() == "":
                missing_source.append(benefit.id)
        if missing_source:
            issues_found["missing_source_url"] = missing_source

        # No linked programs
        no_programs = list(benefits.filter(programs__isnull=True).values_list("id", flat=True).distinct())
        if no_programs:
            issues_found["no_programs"] = no_programs

        # Placeholder text in benefits or note
        placeholder_text = []
        for benefit in benefits:
            texts = [benefit.winner_benefit, benefit.prizewinner_benefit, benefit.note]
            if any(self.has_placeholder_name(t) for t in texts if t):
                placeholder_text.append(benefit.id)
        if placeholder_text:
            issues_found["placeholder_text"] = placeholder_text

        # Duplicate benefits (event_edition, university, benefit_type)
        seen = {}
        duplicates_set = set()
        for benefit in benefits:
            key = (benefit.event_edition_id, benefit.university_id, benefit.benefit_type)
            if key in seen:
                duplicates_set.add(seen[key])
                duplicates_set.add(benefit.id)
            else:
                seen[key] = benefit.id
        if duplicates_set:
            issues_found["duplicate_benefits"] = list(duplicates_set)

        # Program university mismatch
        program_mismatch = []
        for benefit in benefits:
            for program in benefit.programs.all():
                if program.university_id != benefit.university_id:
                    program_mismatch.append(benefit.id)
                    break
        if program_mismatch:
            issues_found["program_university_mismatch"] = program_mismatch

        # Benefit connected to archived/cancelled edition
        archived_edition_benefits = list(
            benefits.filter(event_edition__status__in={"archived", "cancelled"}).values_list("id", flat=True)
        )
        if archived_edition_benefits:
            issues_found["archived_edition_benefits"] = archived_edition_benefits

        # Benefit university has no programs
        university_no_programs = []
        for benefit in benefits:
            if benefit.university.programs.count() == 0:
                university_no_programs.append(benefit.id)
        if university_no_programs:
            issues_found["university_no_programs"] = university_no_programs

        # Report issues
        for issue_type, ids in issues_found.items():
            self.add_issue("admission_benefits", issue_type, len(ids), ids)
            issue_labels = {
                "invalid_types": "Invalid benefit types",
                "both_benefits_empty": "Both benefits empty",
                "missing_source_url": "Missing source URL",
                "no_programs": "No linked programs",
                "placeholder_text": "Placeholder text",
                "duplicate_benefits": "Duplicate benefits",
                "program_university_mismatch": "Program university mismatch",
                "archived_edition_benefits": "Benefits on archived/cancelled editions",
                "university_no_programs": "University with no programs",
            }
            self.stdout.write(f"[ISSUE] {issue_labels.get(issue_type, issue_type)}: count={len(ids)} ids={self.truncate_ids(ids)}")

    def handle(self, *args, **options):
        """Execute the audit."""
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("Bloom Event Data Audit")
        self.stdout.write("=" * 60)

        self.check_events()
        self.check_event_editions()
        self.check_event_edition_stages()
        self.check_universities()
        self.check_university_programs()
        self.check_admission_benefits()

        # Print summary
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("Summary")
        self.stdout.write("-" * 60)
        self.stdout.write(f"Total suspicious categories: {self.total_suspicious_categories}")
        self.stdout.write(f"Total suspicious records: {len(self.total_suspicious_records)}")
        self.stdout.write("Database modified: NO")
        self.stdout.write("=" * 60 + "\n")


class Command(BaseCommand):
    """Django management command wrapper."""

    help = "Audit event data for suspicious records, duplicates, and inconsistencies."

    def handle(self, *args, **options):
        """Run the audit."""
        audit = AuditCommand(stdout=self.stdout, stderr=self.stderr)
        audit.handle(*args, **options)
