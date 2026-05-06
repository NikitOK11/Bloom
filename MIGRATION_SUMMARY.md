# Data Migration: Event-Centric Schema Backfill - Completed

## Overview

Successfully implemented a non-destructive data migration that backfills the new event-centric schema from existing legacy Event records. This PR creates the foundational EventEdition and EventEditionStage records that connect Events to the new normalized database structure.

**Commit:** `e34a214` pushed to `origin/main`

## What Was Implemented

### 1. Data Migration (0006_backfill_event_editions_and_stages.py)

**Purpose:** Normalize existing Event records by creating corresponding EventEdition and EventEditionStage entries.

**Key Features:**
- **Idempotent Design:** Uses `get_or_create()` to safely re-run without creating duplicates
- **Safe Reverse:** Conservative rollback that only removes auto-generated records
- **Intelligent Defaults:**
  - Edition labels derived from event creation year (e.g., "2026")
  - Start/end dates calculated from event.registration_deadline or safe ranges (180 days)
  - Single-stage editions with "Main Stage" placeholder
  - Status set to "draft" for safe review before activation

**Non-Destructive:** No legacy data is deleted; all changes are additive

### 2. Verification Command (summarize_migration.py)

**Purpose:** Provide transparency and audit trail for migration state.

**Features:**
- Counts records across all event-centric tables
- Calculates coverage: % of events with editions, % of editions with stages
- Verbose mode: Lists all records with full hierarchy
- Status indicators: Green checkmarks for complete migrations, warnings for incomplete

**Usage:**
```bash
python manage.py summarize_migration                    # Quick summary
python manage.py summarize_migration --verbose          # Detailed listing
```

### 3. Migration Tests (test_migration_backfill.py)

**4 Test Cases:**
1. **Schema Completeness:** Events can have Edition → Stage relationships
2. **Edition Labeling:** Edition labels correctly derive from year
3. **Stage Naming:** Stages properly numbered (1, 2, ...) with names
4. **Idempotency:** get_or_create prevents duplicates on re-run

All tests **PASS** ✓

## Migration Results

### Before Migration
```
Events:                    1 ("Test Olympiad")
EventEditions:            0
EventEditionStages:       0
Universities:            0
UniversityPrograms:      0
AdmissionBenefits:       0
```

### After Migration (Current State)
```
Events:                    1 (unchanged)
EventEditions:            1 (backfilled)
EventEditionStages:       1 (backfilled)
Universities:            0 (ready for future backfill)
UniversityPrograms:      0 (ready for future backfill)
AdmissionBenefits:       0 (ready for future backfill)
```

**Coverage:** ✓ 100% of events have editions, ✓ 100% of editions have stages

## Verification & Tests

✅ **python manage.py migrate** - All migrations apply successfully
✅ **python manage.py check** - No system check issues
✅ **python manage.py test** - All 99 tests pass (34 event tests including 4 migration tests)
✅ **python manage.py audit_event_data** - Data integrity verified
✅ **python manage.py summarize_migration --verbose** - Migration summary shows proper state

## Files Changed

1. **apps/events/migrations/0006_backfill_event_editions_and_stages.py** (127 lines)
   - Data migration with forward/reverse operations
   - Comprehensive logging and comments

2. **apps/events/management/commands/summarize_migration.py** (97 lines)
   - Non-invasive verification command
   - Human-readable output with status indicators

3. **apps/events/tests/test_migration_backfill.py** (104 lines)
   - Schema relationship tests
   - get_or_create idempotency verification

## Design Decisions

### 1. Edition Label Strategy
- Uses event.created_at.year for stable, reproducible labels
- Falls back to current year if created_at is unavailable
- Format: Simple year string (e.g., "2026")

### 2. Date Calculation
- Respects existing event.registration_deadline if available
- Defaults to 180-day duration when no deadline present
- Ensures start_date ≤ end_date to satisfy database constraints

### 3. Single Default Stage
- Creates one "Main Stage" per edition (stable default)
- Avoids inventing stage names when none exist
- Allows manual refinement later if needed

### 4. Idempotent Reverse
- Conservative: Only removes records that match auto-generated patterns
- Prevents accidental deletion of intentional data
- Safe to rollback without data loss

## Future Work (Not in Scope)

This PR establishes the foundation for:
- [ ] Backfill University and UniversityProgram from existing preferences/metadata
- [ ] Backfill EventEditionAdmissionBenefit from legacy benefit data
- [ ] Manual review and refinement of backfilled dates
- [ ] Data cleanup command for orphaned or duplicate records

## CODEX Compliance

✅ **No new dependencies added**
✅ **No legacy data deleted**
✅ **No legacy models recreated**
✅ **Uses apps.get_model(...) in migration**
✅ **Preserves all existing data**
✅ **Non-destructive approach**
✅ **Changes committed and pushed to origin/main**
✅ **Follows event-centric domain model (Event → EventEdition → EventEditionStage)**

## Acceptance Criteria Met

- ✅ Existing Event data is backfilled into canonical EventEdition records
- ✅ Existing date/season data backfilled into EventEditionStage where possible
- ✅ Legacy source data (Event) is not deleted
- ✅ Migration uses historical models via apps.get_model()
- ✅ Running migration does not create duplicate canonical rows
- ✅ python manage.py migrate passes
- ✅ python manage.py check passes
- ✅ python manage.py test passes (all 99 tests)
- ✅ python manage.py audit_event_data runs successfully after migration
- ✅ Changes committed and pushed to origin/main
