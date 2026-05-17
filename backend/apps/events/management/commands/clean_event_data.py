from __future__ import annotations

from collections import defaultdict
from typing import Iterable

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import F, Model


PLACEHOLDER_NAMES = {"test", "demo", "sample", "asdf", "qwerty", "123", "temp", "placeholder"}


def normalize_string(value) -> str:
    if value is None:
        return ""
    return " ".join(str(value).split()).strip()


def truncate_ids(ids: Iterable[int], max_count: int = 50) -> str:
    id_list = list(ids)
    if len(id_list) <= max_count:
        return f"[{', '.join(str(item) for item in id_list)}]"
    hidden_count = len(id_list) - max_count
    prefix = ", ".join(str(item) for item in id_list[:max_count])
    return f"[{prefix}, ...(+{hidden_count})]"


def has_field(model: type[Model], field_name: str) -> bool:
    try:
        model._meta.get_field(field_name)
    except Exception:
        return False
    return True


def normalize_fields(instance: Model, field_names: Iterable[str]) -> bool:
    changed = False
    for field_name in field_names:
        if not has_field(instance.__class__, field_name):
            continue
        current_value = getattr(instance, field_name)
        normalized_value = normalize_string(current_value)
        if normalized_value != (current_value or ""):
            setattr(instance, field_name, normalized_value)
            changed = True
    return changed


def snapshot_signature(instance: Model, field_names: Iterable[str]) -> tuple:
    values = []
    for field_name in field_names:
        if has_field(instance.__class__, field_name):
            value = getattr(instance, field_name)
            if isinstance(value, str):
                value = normalize_string(value)
            elif isinstance(value, list):
                value = tuple(value)
            values.append((field_name, value))
    return tuple(values)


class Command(BaseCommand):
    help = "Conservative, auditable cleanup for event-centric data. Dry-run by default."

    def add_arguments(self, parser):
        parser.add_argument("--apply", action="store_true", help="Apply changes instead of dry-run.")
        parser.add_argument("--verbose", action="store_true", help="Print additional details.")

    def handle(self, *args, **options):
        apply_changes = bool(options.get("apply"))
        verbose = bool(options.get("verbose"))

        from apps.events.models import (
            Event,
            EventEdition,
            EventEditionAdmissionBenefit,
            EventEditionStage,
            University,
            UniversityProgram,
        )
        from apps.teams.models import Team

        mode = "APPLY" if apply_changes else "DRY RUN"
        self.stdout.write("# Bloom Event Data Cleanup")
        self.stdout.write(f"Mode: {mode}")

        plan = []
        skipped = []

        event_fields_to_trim = ["name", "title", "short_description", "description", "official_url", "organizer", "profile_code", "preferences"]
        edition_fields_to_trim = ["edition_label"]
        stage_fields_to_trim = ["stage_name", "description"]
        university_fields_to_trim = ["name", "short_name", "city", "website_url"]
        program_fields_to_trim = ["name", "code"]
        benefit_fields_to_trim = ["winner_benefit", "prizewinner_benefit", "source_url", "note"]

        event_whitespace_ids = list(Event.objects.all().values_list("id", flat=True))
        edition_whitespace_ids = list(EventEdition.objects.all().values_list("id", flat=True))
        stage_whitespace_ids = list(EventEditionStage.objects.all().values_list("id", flat=True))
        university_whitespace_ids = list(University.objects.all().values_list("id", flat=True))
        program_whitespace_ids = list(UniversityProgram.objects.all().values_list("id", flat=True))
        benefit_whitespace_ids = list(EventEditionAdmissionBenefit.objects.all().values_list("id", flat=True))

        placeholder_event_ids = []
        for event in Event.objects.all():
            if has_field(Event, "is_active") and event.is_active and normalize_string(event.name).lower() in PLACEHOLDER_NAMES:
                placeholder_event_ids.append(event.id)

        duplicate_event_groups = self._find_duplicate_event_groups(Event)
        duplicate_university_groups = self._find_duplicate_university_groups(University)
        duplicate_program_groups = self._find_duplicate_program_groups(UniversityProgram)
        duplicate_benefit_groups = self._find_duplicate_benefit_groups(EventEditionAdmissionBenefit)

        edition_date_swaps = list(
            EventEdition.objects.filter(start_date__gt=F("end_date")).values_list("id", flat=True)
        )
        stage_date_swaps = list(
            EventEditionStage.objects.filter(start_date__gt=F("end_date")).values_list("id", flat=True)
        )

        total_stage_fixes = []
        for edition in EventEdition.objects.all().prefetch_related("stages"):
            actual_stage_count = edition.stages.count()
            if actual_stage_count > 0 and edition.total_stages != actual_stage_count:
                total_stage_fixes.append(edition.id)

        edition_trim_conflicts = set()
        edition_label_groups = defaultdict(list)
        for edition in EventEdition.objects.select_related("event").all():
            edition_label_groups[(edition.event_id, normalize_string(edition.edition_label).lower())].append(edition.id)
        for ids in edition_label_groups.values():
            if len(ids) > 1:
                edition_trim_conflicts.update(ids)

        current_stage_null_fixes = []
        current_stage_set_fixes = []
        for edition in EventEdition.objects.select_related("current_stage").all().prefetch_related("stages"):
            if edition.current_stage_id and edition.current_stage and edition.current_stage.edition_id != edition.id:
                current_stage_null_fixes.append(edition.id)
                continue
            if not edition.current_stage_id:
                ongoing_stages = list(edition.stages.filter(status="ongoing"))
                if len(ongoing_stages) == 1:
                    current_stage_set_fixes.append((edition.id, ongoing_stages[0].id))

        if event_whitespace_ids:
            plan.append(("Trim whitespace in Event text fields", event_whitespace_ids))
        if placeholder_event_ids:
            plan.append(("Deactivate placeholder Events", placeholder_event_ids))
        if duplicate_event_groups:
            plan.append(("Merge exact duplicate Events", [item for group in duplicate_event_groups for item in group]))
        if edition_whitespace_ids:
            plan.append(("Trim whitespace in EventEdition labels", edition_whitespace_ids))
        if edition_date_swaps:
            plan.append(("Swap inverted EventEdition dates", edition_date_swaps))
        if total_stage_fixes:
            plan.append(("Recalculate EventEdition.total_stages", total_stage_fixes))
        if current_stage_null_fixes or current_stage_set_fixes:
            plan.append(("Repair EventEdition.current_stage", [*current_stage_null_fixes, *(edition_id for edition_id, _ in current_stage_set_fixes)]))
        if stage_whitespace_ids:
            plan.append(("Trim whitespace in EventEditionStage text fields", stage_whitespace_ids))
        if stage_date_swaps:
            plan.append(("Swap inverted EventEditionStage dates", stage_date_swaps))
        if university_whitespace_ids:
            plan.append(("Trim whitespace in University text fields", university_whitespace_ids))
        if duplicate_university_groups:
            plan.append(("Merge exact duplicate Universities", [item for group in duplicate_university_groups for item in group]))
        if program_whitespace_ids:
            plan.append(("Trim whitespace in UniversityProgram text fields", program_whitespace_ids))
        if duplicate_program_groups:
            plan.append(("Merge exact duplicate UniversityPrograms", [item for group in duplicate_program_groups for item in group]))
        if benefit_whitespace_ids:
            plan.append(("Trim whitespace in EventEditionAdmissionBenefit text fields", benefit_whitespace_ids))
        if duplicate_benefit_groups:
            plan.append(("Merge exact duplicate AdmissionBenefits", [item for group in duplicate_benefit_groups for item in group]))

        if not plan:
            self.stdout.write(self.style.SUCCESS("No planned changes detected."))
            self.stdout.write("Database modified: NO")
            return

        self.stdout.write("## Planned Actions")
        for description, ids in plan:
            self.stdout.write(f"[PLAN] {description}: count={len(ids)} ids={truncate_ids(ids)}")

        if not apply_changes:
            self.stdout.write("## Summary")
            self.stdout.write("Mode: DRY RUN")
            self.stdout.write(f"Planned changes: {sum(len(ids) for _, ids in plan)}")
            self.stdout.write("Applied changes: 0")
            self.stdout.write(f"Skipped ambiguous issues: {len(skipped)}")
            self.stdout.write("Database modified: NO")
            return

        applied_count = 0
        with transaction.atomic():
            for event in Event.objects.all():
                changed = normalize_fields(event, event_fields_to_trim)
                if has_field(Event, "is_active") and event.is_active and normalize_string(event.name).lower() in PLACEHOLDER_NAMES:
                    event.is_active = False
                    changed = True
                if changed:
                    event.save()
                    applied_count += 1

            for event_id, keep_id, source_ids in duplicate_event_groups:
                source_ids = [source_id for source_id in source_ids if source_id != keep_id]
                if not source_ids:
                    continue
                if self._event_merge_is_ambiguous(Event, EventEdition, Team, keep_id, source_ids):
                    skipped.append(("ambiguous_event_merge", [keep_id, *source_ids]))
                    continue
                for source_id in source_ids:
                    EventEdition.objects.filter(event_id=source_id).update(event_id=keep_id)
                    Team.objects.filter(event_id=source_id).update(event_id=keep_id)
                    Event.objects.filter(id=source_id).delete()
                    applied_count += 1

            for edition in EventEdition.objects.all():
                changed = False
                if edition.id not in edition_trim_conflicts:
                    changed = normalize_fields(edition, edition_fields_to_trim)
                if edition.start_date and edition.end_date and edition.start_date > edition.end_date:
                    edition.start_date, edition.end_date = edition.end_date, edition.start_date
                    changed = True
                if edition.id in total_stage_fixes:
                    edition.total_stages = edition.stages.count()
                    changed = True
                if edition.id in current_stage_null_fixes:
                    edition.current_stage = None
                    changed = True
                for current_stage_edition_id, stage_id in current_stage_set_fixes:
                    if edition.id == current_stage_edition_id:
                        edition.current_stage_id = stage_id
                        changed = True
                        break
                if changed:
                    edition.save()
                    applied_count += 1

            for stage in EventEditionStage.objects.all():
                changed = normalize_fields(stage, stage_fields_to_trim)
                if stage.start_date and stage.end_date and stage.start_date > stage.end_date:
                    stage.start_date, stage.end_date = stage.end_date, stage.start_date
                    changed = True
                if changed:
                    stage.save()
                    applied_count += 1

            for university_id, keep_id, source_ids in duplicate_university_groups:
                source_ids = [source_id for source_id in source_ids if source_id != keep_id]
                for source_id in source_ids:
                    UniversityProgram.objects.filter(university_id=source_id).update(university_id=keep_id)
                    EventEditionAdmissionBenefit.objects.filter(university_id=source_id).update(university_id=keep_id)
                    University.objects.filter(id=source_id).delete()
                    applied_count += 1

            for university in University.objects.all():
                if normalize_fields(university, university_fields_to_trim):
                    university.save()
                    applied_count += 1

            for university_program_id, keep_id, source_ids in duplicate_program_groups:
                source_ids = [source_id for source_id in source_ids if source_id != keep_id]
                for source_id in source_ids:
                    for benefit in EventEditionAdmissionBenefit.objects.filter(programs__id=source_id):
                        benefit.programs.remove(source_id)
                        benefit.programs.add(keep_id)
                    UniversityProgram.objects.filter(id=source_id).delete()
                    applied_count += 1

            for program in UniversityProgram.objects.select_related("university").all():
                if normalize_fields(program, program_fields_to_trim):
                    program.save()
                    applied_count += 1

            for benefit in EventEditionAdmissionBenefit.objects.all():
                if normalize_fields(benefit, benefit_fields_to_trim):
                    benefit.save()
                    applied_count += 1

            for benefit_id, keep_id, source_ids in duplicate_benefit_groups:
                source_ids = [source_id for source_id in source_ids if source_id != keep_id]
                if not source_ids:
                    continue
                keep_benefit = EventEditionAdmissionBenefit.objects.get(id=keep_id)
                keep_program_ids = set(keep_benefit.programs.values_list("id", flat=True))
                for source_id in source_ids:
                    source_benefit = EventEditionAdmissionBenefit.objects.get(id=source_id)
                    source_program_ids = set(source_benefit.programs.values_list("id", flat=True))
                    if keep_program_ids and source_program_ids and keep_program_ids != source_program_ids:
                        skipped.append(("ambiguous_benefit_merge", [keep_id, source_id]))
                        continue
                    for program_id in source_program_ids:
                        keep_benefit.programs.add(program_id)
                    EventEditionAdmissionBenefit.objects.filter(id=source_id).delete()
                    applied_count += 1

        self.stdout.write("## Summary")
        self.stdout.write(f"Mode: {mode}")
        self.stdout.write(f"Planned changes: {sum(len(ids) for _, ids in plan)}")
        self.stdout.write(f"Applied changes: {applied_count}")
        self.stdout.write(f"Skipped ambiguous issues: {len(skipped)}")
        self.stdout.write(f"Database modified: {'YES' if applied_count else 'NO'}")

    def _find_duplicate_event_groups(self, model):
        groups = defaultdict(list)
        for event in model.objects.all().order_by("id"):
            signature = snapshot_signature(
                event,
                [
                    "name",
                    "title",
                    "event_type_code",
                    "profile_code",
                    "level_code",
                    "participation_mode",
                    "official_url",
                    "short_description",
                    "organizer",
                    "registration_deadline",
                    "is_active",
                    "event_type_id",
                    "level_id",
                    "participation_type",
                    "preferences",
                    "eligible_groups",
                ],
            )
            groups[signature].append(event.id)

        duplicate_groups = []
        for ids in groups.values():
            if len(ids) > 1:
                duplicate_groups.append((ids[0], ids[0], ids))
        return duplicate_groups

    def _find_duplicate_university_groups(self, model):
        groups = defaultdict(list)
        for university in model.objects.all().order_by("id"):
            signature = snapshot_signature(university, ["name", "short_name", "city", "website_url"])
            groups[signature].append(university.id)

        duplicate_groups = []
        for ids in groups.values():
            if len(ids) > 1:
                duplicate_groups.append((ids[0], ids[0], ids))
        return duplicate_groups

    def _find_duplicate_program_groups(self, model):
        groups = defaultdict(list)
        for program in model.objects.select_related("university").all().order_by("id"):
            signature = snapshot_signature(program, ["university_id", "name", "level", "code"])
            groups[signature].append(program.id)

        duplicate_groups = []
        for ids in groups.values():
            if len(ids) > 1:
                duplicate_groups.append((ids[0], ids[0], ids))
        return duplicate_groups

    def _find_duplicate_benefit_groups(self, model):
        groups = defaultdict(list)
        for benefit in model.objects.prefetch_related("programs").all().order_by("id"):
            signature = snapshot_signature(
                benefit,
                [
                    "event_edition_id",
                    "university_id",
                    "benefit_type",
                    "winner_benefit",
                    "prizewinner_benefit",
                    "source_url",
                    "note",
                ],
            ) + (("program_ids", tuple(sorted(benefit.programs.values_list("id", flat=True)))),)
            groups[signature].append(benefit.id)

        duplicate_groups = []
        for ids in groups.values():
            if len(ids) > 1:
                duplicate_groups.append((ids[0], ids[0], ids))
        return duplicate_groups

    def _event_merge_is_ambiguous(self, event_model, edition_model, team_model, keep_id: int, source_ids: list[int]) -> bool:
        keep_labels = set(
            edition_model.objects.filter(event_id=keep_id).values_list("edition_label", flat=True)
        )
        source_labels = set(
            edition_model.objects.filter(event_id__in=source_ids).values_list("edition_label", flat=True)
        )
        if keep_labels.intersection(source_labels):
            return True

        return False
