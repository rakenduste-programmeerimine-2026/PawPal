from pathlib import Path

content = r"""# GymLog — Database Documentation

**Project:** GymLog  
**Backend:** Supabase (PostgreSQL)  
**Document status:** Initial database and security documentation  
**Last updated:** 18 November 2026

---

## 1. Purpose and scope

This document records the database and security work completed for GymLog. The scope covered here is database design, Supabase configuration, access control, and database-level testing.

The mobile application has not yet been created. Therefore, this document does not claim that client-side authentication, application integration, or SQLite functionality has been implemented.

GymLog is intended to support:
- A shared exercise catalogue.
- User-owned workout sessions.
- Workout sets linked to workouts and exercises.
- Workout history.
- Locally stored custom exercise definitions using SQLite in the future application.

## 2. Supabase project configuration

The GymLog Supabase project has been created. The Email authentication provider has been enabled, and two test accounts have been created for database permission testing.

The following configuration has been completed:
- Supabase PostgreSQL database created.
- Email authentication provider enabled.
- Three application tables created.
- Row Level Security (RLS) enabled on all three application tables.
- Database indexes, foreign keys, grants, and RLS policies configured.

There is currently no application frontend. Authentication redirect URLs and client-side authentication flows will need to be configured when the application is developed.

### Key security note

The Supabase publishable/anon key can be used by a client application when RLS is correctly configured. A service-role or secret key bypasses RLS and must never be placed in a mobile/web frontend or committed to a public repository.

## 3. Database structure

The database contains three application tables:

1. `public.exercises`
2. `public.workouts`
3. `public.workout_sets`

### 3.1 `public.exercises`

Stores global exercises and user-owned exercise records.

| Column | Type | Nullable | Description |
|---|---|---:|---|
| `id` | UUID | No | Primary key; generated with `gen_random_uuid()` |
| `name` | TEXT | No | Exercise name |
| `category` | TEXT | Yes | Optional exercise category |
| `user_id` | UUID | Yes | Owner; references `auth.users(id)` |
| `created_at` | TIMESTAMPTZ | No | Creation timestamp; defaults to `NOW()` |

Ownership convention:
- `user_id IS NULL`: global exercise, readable under the global-exercise SELECT policy.
- `user_id = auth.uid()`: exercise owned by the authenticated user.
- Ordinary users may not create, update, or delete another user's private exercise.

A CHECK constraint prevents an exercise name that is empty after trimming whitespace.

### 3.2 `public.workouts`

Stores workout sessions created by users.

| Column | Type | Nullable | Description |
|---|---|---:|---|
| `id` | UUID | No | Primary key; generated with `gen_random_uuid()` |
| `user_id` | UUID | No | Workout owner; references `auth.users(id)` |
| `date` | DATE | No | Calendar date associated with the workout |
| `created_at` | TIMESTAMPTZ | No | Creation timestamp; defaults to `NOW()` |
| `name` | TEXT | Yes | Optional workout name |

Each workout belongs to one authenticated user. The RLS policies restrict access to the workout owner.

### 3.3 `public.workout_sets`

Stores set-level information belonging to a workout.

| Column | Type | Nullable | Description |
|---|---|---:|---|
| `id` | UUID | No | Primary key; generated with `gen_random_uuid()` |
| `workout_id` | UUID | No | Parent workout; references `workouts(id)` |
| `exercise_id` | UUID | Yes | Optional reference to `exercises(id)` |
| `exercise_name` | TEXT | No | Exercise name snapshot stored with the set |
| `weight` | NUMERIC(10,2) | Yes | Recorded weight |
| `reps` | INTEGER | Yes | Recorded repetitions |
| `set_order` | INTEGER | No | Order number for the set |
| `created_at` | TIMESTAMPTZ | No | Creation timestamp; defaults to `NOW()` |

The `exercise_name` snapshot preserves the exercise name in historical workout data if the linked exercise is later deleted. The `exercise_id` is nullable for the same reason.

## 4. Constraints and relationships

### 4.1 Data constraints

The schema includes these data-integrity rules:
- Exercise names cannot be empty after trimming whitespace.
- Workout-set exercise names cannot be empty after trimming whitespace.
- Workout-set weight must be non-negative when provided.
- Workout-set repetitions must be non-negative when provided.
- `set_order` must be greater than zero.
- A unique constraint exists on (`workout_id`, `exercise_id`, `set_order`).

**Design consideration:** PostgreSQL UNIQUE constraints normally allow multiple rows containing NULL in a constrained column. Since `exercise_id` is nullable, the unique constraint does not prevent duplicate ordering values for rows where `exercise_id` is NULL. If the application later supports multiple separate blocks of the same exercise in one workout, the ordering design should be reviewed. A dedicated exercise-block identifier may be more suitable.

### 4.2 Foreign keys

The following four foreign keys were inspected and verified:

| Child column | References | On parent deletion |
|---|---|---|
| `exercises.user_id` | `auth.users.id` | CASCADE |
| `workouts.user_id` | `auth.users.id` | CASCADE |
| `workout_sets.workout_id` | `workouts.id` | CASCADE |
| `workout_sets.exercise_id` | `exercises.id` | SET NULL |

Implications:
- Deleting an auth user cascades to that user's exercises and workouts.
- Deleting a workout cascades to its workout sets.
- Deleting an exercise does not delete historical workout sets; their `exercise_id` becomes NULL while `exercise_name` remains.

The foreign-key definitions were verified in the database catalog. Their deletion behavior has not yet been separately tested with dedicated deletion tests.

## 5. Indexes

Ten indexes were verified:

| Index | Table | Purpose |
|---|---|---|
| `exercises_pkey` | `exercises` | Primary-key lookup |
| `idx_exercises_name` | `exercises` | Exercise-name lookup |
| `idx_exercises_user_id` | `exercises` | Filter exercises by owner |
| `workouts_pkey` | `workouts` | Primary-key lookup |
| `idx_workouts_date` | `workouts` | Filter workouts by date |
| `idx_workouts_user_id` | `workouts` | Filter workouts by owner |
| `workout_sets_pkey` | `workout_sets` | Primary-key lookup |
| `idx_workout_sets_exercise_id` | `workout_sets` | Filter sets by exercise |
| `idx_workout_sets_workout_id` | `workout_sets` | Retrieve sets for a workout |
| `workout_sets_unique_order` | `workout_sets` | Enforces the unique constraint on workout, exercise, and set order |

## 6. Row Level Security (RLS)

RLS is enabled on all three application tables. Twelve policies were created and inspected: four policies per table.

### 6.1 Exercises

| Operation | Intended access |
|---|---|
| SELECT | Read global exercises (`user_id IS NULL`) and the current user's own exercises |
| INSERT | Authenticated users may insert only exercises whose `user_id` equals `auth.uid()` |
| UPDATE | Authenticated users may update only their own exercises |
| DELETE | Authenticated users may delete only their own exercises |

Global exercises are readable but are not intended to be editable or deletable by ordinary users.

### 6.2 Workouts

| Operation | Intended access |
|---|---|
| SELECT | Users may read only workouts where `user_id = auth.uid()` |
| INSERT | Users may create workouts only for themselves |
| UPDATE | Users may update only their own workouts |
| DELETE | Users may delete only their own workouts |

### 6.3 Workout sets

Access to a workout set is determined through its parent workout.

| Operation | Intended access |
|---|---|
| SELECT | Read sets only when the parent workout belongs to the current user |
| INSERT | Insert sets only into the current user's workout; a referenced exercise must be global or owned by the current user |
| UPDATE | Update sets only when the parent workout belongs to the current user; referenced exercise ownership is also checked |
| DELETE | Delete sets only when the parent workout belongs to the current user |

The policies were created and inspected. Workout-set RLS behavior has not yet been tested as extensively as the exercises and workouts policies.

## 7. Testing performed

Two Supabase Auth test accounts were used. Database-level tests simulated the `authenticated` role and JWT subject claims in the Supabase SQL Editor. Test transactions were rolled back where appropriate so temporary test changes did not remain in the database.

### 7.1 Read-access tests

| Test | Expected result | Observed result | Status |
|---|---:|---:|---|
| User A reads User B's workout | 0 rows | 0 rows | Passed |
| User B reads User A's workout | 0 rows | 0 rows | Passed |
| User B reads a global exercise | 1 row | 1 row | Passed |
| User B reads User A's private exercise | 0 rows | 0 rows | Passed |
| User A reads their own private exercise | 1 row | 1 row | Passed |

### 7.2 Workout write-access tests

| Test | Expected result | Observed result | Status |
|---|---|---|---|
| User A inserts their own workout | Insert succeeds | Row returned by `INSERT ... RETURNING` | Passed |
| User A inserts a workout owned by User B | Rejected by RLS | RLS error `42501` | Passed |
| User B updates User A's workout | No row updated | Original workout name remained unchanged | Passed |
| User B deletes User A's workout | No row deleted | Original workout remained present | Passed |

### 7.3 Exercise write-access tests

| Test | Expected result | Observed result | Status |
|---|---|---|---|
| User A inserts an exercise owned by User B | Rejected by RLS | RLS error `42501` | Passed |
| User A inserts their own exercise | Insert succeeds | Row returned by `INSERT ... RETURNING` | Passed |
| User B updates User A's private exercise | No row updated | Original name and User A ownership remained unchanged after correcting test data | Passed |
| User B deletes User A's private exercise | No row deleted | Exercise remained present and owned by User A | Passed |
| User A updates their own private exercise | Update succeeds | Updated row returned | Passed |
| User A deletes their own private exercise | Delete succeeds | Deleted row returned | Passed |

**Testing note:** An early exercise update attempt was inconclusive because the test exercise had accidentally been created with User B's UUID. The owner was corrected to User A, and the cross-user update test was repeated. The repeated test showed that User B could not modify User A's exercise.

### 7.4 Configuration verification

The following database configuration was inspected and verified:
- Three application tables exist.
- RLS is enabled on all three tables.
- Twelve RLS policies exist (four per table).
- Four foreign-key relationships exist.
- Ten indexes exist.
- Two test accounts were created.

## 8. Remaining work

The following work is not yet complete:

1. **Client-side integration testing:** repeat authentication and RLS tests through the actual Supabase client once the application exists. SQL Editor role simulation is useful, but it is not a substitute for end-to-end client testing.
2. **Workout-set RLS tests:** test SELECT, INSERT, UPDATE, and DELETE using two users, including attempts to reference another user's private exercise.
3. **Constraint tests:** test invalid names, negative weights, negative repetitions, invalid set order, and duplicate ordering.
4. **Foreign-key deletion tests:** verify workout deletion cascades to sets, exercise deletion sets `exercise_id` to NULL while preserving `exercise_name`, and user deletion behavior in a controlled test environment.
5. **Application authentication:** implement and test registration, login, logout, and session handling when the application is developed.
6. **SQLite integration:** implement local storage for custom exercises when the client application is developed.
7. **Operational security review:** confirm production key handling, database grants, backup/recovery arrangements, and any additional access requirements before release.

## 9. Security recommendations

- Never include the Supabase service-role or secret key in a client application.
- Keep secrets out of Git repositories, screenshots, public issue trackers, and documentation.
- Use the publishable/anon key in the client only with correctly configured RLS.
- Restrict database administration credentials to trusted maintainers.
- Use separate test accounts and non-production data for permission testing.
- Re-test RLS whenever policies, table relationships, or client access patterns change.
- Review whether changes to the global exercise catalogue should be restricted to trusted administrators rather than ordinary users.

## 10. Current status summary

**Completed:** Supabase project setup, three-table schema, indexes, foreign keys, constraints, RLS enablement and policies, Email provider setup, two test accounts, and the documented read/write ownership tests for workouts and exercises.

**Still pending:** workout-set policy testing, constraint and deletion-behavior testing, client-side integration testing, application authentication flows, and SQLite integration.

This document describes the database state and tests reported during the GymLog setup work. It should be updated if the schema or policies change.
"""

path = Path("/mnt/data/GymLog_Database_Documentation.md")
path.write_text(content, encoding="utf-8")
print(f"Created {path} ({path.stat().st_size:,} bytes)")
