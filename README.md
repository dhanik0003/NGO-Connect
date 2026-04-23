# Relief Grid

Relief Grid is a hackathon-ready NGO dispatch and volunteer coordination platform built around one centralized PostgreSQL database, AI-assisted routing, and auditable report-to-closure workflows.

## What Is Included

- `Frontend/`: the existing Vite/TanStack dashboard app, upgraded with API/session wiring for auth, report submission, notifications, user report tracking, and NGO incoming tasks.
- `server/`: new Express + TypeScript + Prisma backend with JWT auth, RBAC, report routing, volunteer assignment, duplicate handling, escalation, evidence verification, and seeded demo data.
- `docs/`: database and expected-output references for presentation and pgAdmin review.

## Stack

- Frontend: Vite, React, TypeScript, TanStack Router, TanStack Query, Tailwind, shadcn/ui, Zustand, Leaflet, Framer Motion
- Backend: Node.js, Express, TypeScript, Prisma, PostgreSQL, Zod, JWT, Socket.io, Multer
- Database: single PostgreSQL database with NGO segregation via `ngo_id` and RBAC

## Quick Start

### 1. Start PostgreSQL

Use Docker or your own PostgreSQL instance.

```bash
docker compose up -d postgres pgadmin
```

`pgAdmin` will be available at `http://localhost:5050`.

### 2. Configure environment files

- Copy `server/.env.example` to `server/.env`
- Copy `Frontend/.env.example` to `Frontend/.env`
- If you want live Gemini-powered AI instead of fallback heuristics, paste your key into `server/.env`:

```env
GEMINI_API_KEY=your_google_ai_studio_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
```

### 3. Prepare the backend

```bash
cd server
npm install
npm run prisma:generate
npm run prisma:push
npm run seed
```

### 4. Run the backend

```bash
cd server
npm run dev
```

### 5. Run the frontend

```bash
cd Frontend
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173`

Backend default URL: `http://localhost:4000`

## Demo Accounts

- `admin@reliefgrid.org`
- `surveyor1@reliefgrid.demo`
- `volunteer1@reliefgrid.demo`
- `citizen1@reliefgrid.demo`

Password for all seeded users: `Demo@12345`

## Backend Highlights

- Central `master_reports` ledger with no hard deletes
- NGO task routing with acceptance, rejection, reassignment, and escalation flows
- Volunteer matching using location, availability, skills, workload, and transport signals
- Evidence upload and NGO verification before final closure
- Duplicate detection with canonical grouping
- Full history in `report_status_history`, `task_status_history`, `ai_decisions`, and `audit_logs`
- Gemini integration for domain classification, urgency scoring, NGO matching, volunteer matching, and duplicate review
- Automatic fallback to local heuristics when `GEMINI_API_KEY` is not configured or Gemini is unavailable

## Frontend Highlights

- Existing SaaS-style dashboards preserved
- Real API/session support added for:
  - login and role-specific registration
  - citizen report submission
  - citizen report history and detail timeline
  - notifications dropdown and notification page
  - NGO incoming task board

## Useful Commands

### Backend

```bash
npm run dev
npm run build
npm run prisma:generate
npm run prisma:push
npm run seed
```

### Frontend

```bash
npm run dev
npm run build
```

## Reference Docs

- [Database Reference](./docs/database-reference.md)
- [Expected Output Guide](./docs/expected-output.md)
