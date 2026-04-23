# Expected Output Guide

## Seeded Demo Inventory

- 8 NGOs across the required domains
- 15 surveyors
- 30 volunteers
- 40 citizens
- 80 reports
- Duplicate cluster scenario with one canonical fire case and 2 merged duplicates
- Escalated reports and tasks
- Verified closures with evidence

## Demo Accounts

- Super Admin: `admin@reliefgrid.org`
- Surveyor: `surveyor1@reliefgrid.demo`
- Volunteer: `volunteer1@reliefgrid.demo`
- Citizen: `citizen1@reliefgrid.demo`
- Shared password: `Demo@12345`

## Role Permission Matrix

- `SUPER_ADMIN`: approve NGOs, view all reports, merge duplicates, reroute reports, mark invalid, handle escalations, review analytics.
- `NGO_ADMIN`: accept or reject routed tasks, assign volunteers, override AI suggestions, verify evidence, request rework, view NGO analytics.
- `SURVEYOR`: submit field reports, route same-domain same-region cases directly, track report history, view region context.
- `VOLUNTEER`: accept or reject assignments, update progress, upload evidence, maintain availability.
- `USER`: submit public issues, track lifecycle, receive notifications.

## Sample Workflow Outputs

### Citizen report submission

Expected API result:

```json
{
  "success": true,
  "data": {
    "id": "cmasterreport...",
    "status": "ROUTED_TO_NGO",
    "priorityLabel": "HIGH",
    "aiPredictedCategory": {
      "slug": "animal-care"
    },
    "routedNgo": {
      "name": "PawCare Alliance"
    }
  }
}
```

### NGO task view

Expected fields:

- task title and location
- NGO decision state
- assigned volunteer
- task status history
- linked evidence uploads

### User tracking timeline

Expected stages shown in UI:

- Submitted
- Classified
- Routed
- Accepted by NGO
- Volunteer Assigned
- In Progress
- Completed Pending Verification
- Verified Closed

## Presentation Scenarios Ready

- Injured animal reported by citizen and closed after NGO verification
- Surveyor same-domain direct routing to own NGO
- Surveyor cross-domain routing into central queue
- Duplicate issue merge avoiding duplicate volunteer dispatch
- NGO rejection and reassignment flow
