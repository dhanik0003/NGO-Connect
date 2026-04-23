# Relief Grid Database Reference

## Core Design Rules

- `master_reports` is the platform source of truth.
- Routed work is never hard-deleted from the master database.
- NGO workspaces are tenant-filtered views over one centralized PostgreSQL database.
- AI decisions are stored as suggestions with confidence and payload history in `ai_decisions`.
- Exceptions such as rejection, reassignment, duplicate merge, escalation, and verification all stay auditable.

## Main Tables

### Identity and tenancy

- `users`: shared authentication table for super admins, NGO admins, surveyors, volunteers, and citizens.
- `ngos`: NGO workspace records with verification status, HQ coordinates, and service radius.
- `ngo_domains`: links NGOs to configurable category rows.
- `ngo_regions`: regional coverage zones for matching and routing.
- `surveyors`: surveyor profiles tied to a user and NGO.
- `volunteers`: volunteer profiles tied to a user and NGO, with availability, skills JSON, workload, and transport data.

### Operational workflow

- `master_reports`: central issue ledger for all submitted reports.
- `ngo_tasks`: NGO-side work items created from routed reports.
- `report_status_history`: immutable history for report lifecycle transitions.
- `task_status_history`: immutable history for task lifecycle transitions.
- `volunteer_assignments`: assignment response state, AI match score, and actor audit trail.
- `task_evidence`: volunteer-uploaded proof for closure and NGO verification.

### Trust, AI, and exception handling

- `duplicate_groups`: groups linked reports under one canonical report.
- `ai_decisions`: stores domain classification, priority, NGO ranking, volunteer ranking, and duplicate checks.
- `audit_logs`: generic action log across entities.
- `escalations`: open/resolved escalations tied to reports or tasks.
- `notifications`: in-app notification inbox for each user.

### Auth support

- `refresh_tokens`: refresh token hashes with revocation tracking.
- `password_reset_tokens`: forgot-password reset token hashes.
- `routing_config`: configurable business rules for direct routing, confidence thresholds, and duplicate windows.

## Relationship Notes

- One `master_report` can link to at most one `ngo_task`.
- Multiple duplicate reports can reference one `duplicate_group`.
- One `ngo_task` can have many assignment attempts and evidence uploads.
- One `volunteer` can be assigned to many tasks over time, but current workload remains stored on the profile.

## Lifecycle Coverage

### Master report statuses

- `SUBMITTED`
- `UNDER_REVIEW`
- `CLASSIFIED`
- `DUPLICATE_FLAGGED`
- `ROUTED_TO_NGO`
- `ACCEPTED_BY_NGO`
- `REJECTED_BY_NGO`
- `REASSIGNMENT_PENDING`
- `VOLUNTEER_ASSIGNED`
- `IN_PROGRESS`
- `COMPLETED_PENDING_VERIFICATION`
- `VERIFIED_CLOSED`
- `INVALID`
- `ESCALATED`
- `DUPLICATE_MERGED`

### NGO task statuses

- `PENDING_NGO_ACCEPTANCE`
- `ACCEPTED`
- `REJECTED`
- `VOLUNTEER_ASSIGNMENT_PENDING`
- `ASSIGNED`
- `VOLUNTEER_REJECTED`
- `REASSIGNMENT_NEEDED`
- `IN_PROGRESS`
- `COMPLETED_PENDING_VERIFICATION`
- `VERIFIED_CLOSED`
- `REWORK_NEEDED`
- `ESCALATED`
