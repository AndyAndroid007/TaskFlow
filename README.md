# TaskFlow

TaskFlow is a full-stack task management platform built with a layered Express backend and a React + Vite frontend. It includes JWT/OAuth authentication, Kafka-driven event processing, real-time notifications with SSE, analytics dashboards, and an AI task assistant.

## Live Deployment

- **Frontend:** Vercel
- **Backend:** Render
- **Kafka:** intentionally local-only for cost control (used in development workflows)

## Monorepo Structure

```text
.
├── src/                       # Backend (Express)
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── models/
│   ├── modules/               # Domain modules (analytics, notifications, ai)
│   ├── infrastructure/        # Kafka + SSE primitives
│   ├── events/                # Event payloads, DLQ, idempotency
│   └── __tests__/             # Jest unit + integration tests
├── mern-frontend/             # Frontend (React + Vite)
│   ├── src/
│   └── cypress/e2e/           # Cypress E2E coverage
├── docker-compose.yml         # Local Kafka broker for event-driven development
└── plan.md                    # Technical roadmap and implementation notes
```

## Core Features

### Backend
- Layered architecture: Controller → Service → Repository
- JWT auth (register/login/me)
- OAuth providers: Google, GitHub, LinkedIn
- Task CRUD with status, priority, tags, due dates, assignment
- Kafka event production for task lifecycle events
- Resilient consumers with idempotency, retries, and DLQ
- SSE event stream for real-time notification fanout
- Analytics aggregation endpoints
- AI assistant endpoints (conversation, chat, confirm-task)

### Frontend
- Login + OAuth entry points
- Task dashboard with create/edit/delete flows
- Analytics dashboard with charts/stat cards
- Real-time notification UX
- Assistant dashboard for conversational task creation

### Testing
- Backend: Jest + Supertest + mongodb-memory-server
- Frontend unit tests: Vitest + Testing Library
- E2E: Cypress (auth/tasks/assistant)

## Local Development

### Prerequisites
- Node.js 18+
- npm 9+
- Docker (for local Kafka)

### Install

```bash
npm install
cd mern-frontend && npm install && cd ..
```

### Start services

Backend only:
```bash
npm run dev
```

Frontend only:
```bash
cd mern-frontend && npm run dev
```

All local services (Kafka + backend + frontend):
```bash
npm run dev:all
```

## Environment Variables

### Backend (`.env`)
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `FRONTEND_URL`
- `BACKEND_URL`
- `KAFKA_BROKERS`
- `KAFKA_CLIENT_ID`
- `KAFKA_GROUP_ID`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`
- `GEMINI_API_KEY`

### Frontend (`mern-frontend/.env`)
- `VITE_API_BASE_URL`
- `VITE_SSE_URL`

## Test Commands

Backend:
```bash
npm test
```

Frontend unit:
```bash
cd mern-frontend && npm test
```

Frontend lint:
```bash
cd mern-frontend && npm run lint
```

E2E:
```bash
cd mern-frontend && npm run cypress:run
```

## API Surface (high-level)

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /auth/google`, `/auth/github`, `/auth/linkedin` (+ callbacks)
- `GET/POST/PUT/DELETE /tasks`
- `GET /analytics/summary`
- `GET /events/stream`
- `GET /notifications`
- `GET/POST/DELETE /ai/*`

## Notes

- Kafka is intentionally not hosted in production to avoid managed broker costs for this portfolio scope.
- The production app focuses on core product value while preserving full event-driven architecture in local/dev environments.
