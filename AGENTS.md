# Repository Guidelines

## Project Structure & Module Organization
- `src/`: Express backend. Core layers are organized by `routes/`, `controllers/`, `services/`, `repositories/`, `models/`, `middlewares/`, and `validation/`.
- `src/__tests__/`: Backend unit and integration tests, with shared setup in `src/__tests__/setup.js`.
- `mern-frontend/src/`: React + Vite frontend. UI lives in `pages/`, reusable logic in `api/`, `context/`, `hooks/`, and `components/`.
- `mern-frontend/cypress/e2e/`: End-to-end browser tests.
- `docker-compose.yml`: Local Kafka service used by the event-driven backend features.

## Build, Test, and Development Commands
- `npm run dev`: Start the backend with `nodemon` on port `8080`.
- `npm start`: Run the backend without reloads.
- `npm test`: Run backend Jest tests.
- `npm run dev:all`: Start Kafka, backend, and frontend together via `scripts/start-dev.sh`.
- `cd mern-frontend && npm run dev`: Start the Vite frontend on port `5173`.
- `cd mern-frontend && npm run build`: Create a production frontend build.
- `cd mern-frontend && npm run lint`: Run frontend ESLint checks.
- `cd mern-frontend && npm test`: Run frontend Vitest tests.
- `cd mern-frontend && npm run cypress:run`: Execute frontend E2E coverage in headless mode.

## Coding Style & Naming Conventions
Match the existing style in each app. The backend uses CommonJS, semicolons, and 4-space indentation. The frontend uses ES modules/JSX, semicolons, and 2-space indentation in config files. Use `PascalCase` for React components, `camelCase` for functions and hooks, and suffix backend files by role, for example `task.service.js` or `auth.routes.js`. Run `mern-frontend` lint before opening a PR; there is no root lint script yet.

## AI Assistant Workflow
Follow the repository rule in `GEMINI.md`: default to learning mode. Start with a short concept explanation in plain English, then give one concrete next step, and only provide a small hint or partial snippet if the user explicitly asks for implementation or has attempted the step. Do not dump full solutions by default, and do not continue multi-step teaching flows without user confirmation.

## Testing Guidelines
Backend tests use Jest with `**/*.test.js` matching. Keep unit tests under `src/__tests__/unit/` and route/integration coverage under `src/__tests__/integration/`. Frontend browser tests use Cypress (`*.cy.js`); frontend unit tests use Vitest. Add or update tests for new routes, auth flows, analytics changes, and SSE behavior.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commit prefixes such as `feat:`, `fix:`, `refactor:`, `test:`, and `docs:`. Keep commit subjects imperative and specific. PRs should include a short summary, affected areas (`backend`, `frontend`, `Kafka`, or tests), linked issues when applicable, and screenshots for visible UI changes. Note any new environment variables or local services required to validate the change.

## Security & Configuration Tips
Do not commit secrets. The backend depends on `MONGO_URI`, `JWT_SECRET`, OAuth credentials, `FRONTEND_URL`, `BACKEND_URL`, and optional Kafka settings. The frontend expects `VITE_API_BASE_URL`. Keep local ports aligned with the current defaults: frontend `5173`, backend `8080`, Kafka `9092`. When documenting config, use `.env.example` if available and never read `.env` directly.
