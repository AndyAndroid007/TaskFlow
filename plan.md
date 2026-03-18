# TaskFlow — Technical Plan

> **Project Name:** TaskFlow
> **Type:** Personal Full-Stack Portfolio Project
> **Repository:** `MERN-Demo-App`
> **Author:** Anirudh
> **Last Updated:** 2026-03-14

---

## 1. Project Overview

TaskFlow is a task management dashboard built to demonstrate strong backend engineering practices in a real, functioning application. The system covers modular backend architecture, event-driven processing with Kafka, real-time frontend updates, and production-grade observability.

The project starts as a **modular monolith** and incrementally introduces event-driven components — balancing engineering depth with the scope of a personal project.

### Learning Goals

- Layered, modular backend architecture (Controller → Service → Repository)
- Event-driven systems with Apache Kafka
- Asynchronous consumer processing (notifications, analytics)
- Real-time client updates via WebSocket / SSE
- Structured logging and observability
- Automated testing (unit, integration, E2E)
- Scalable service design without over-engineering

### Scope Boundaries

| In Scope | Out of Scope |
|---|---|
| Modular monolith architecture | Kubernetes / container orchestration |
| Kafka event pipeline | Service mesh (Istio, Linkerd) |
| WebSocket / SSE notifications | Multi-region deployment |
| Structured logging (Winston) | Excessive microservices |
| Docker containerization (later) | CI/CD pipelines (nice-to-have) |
| Automated testing (unit, integration, E2E) | Time tracking / billable hours |

---

## 2. Technology Stack

| Layer | Technology | Status |
|---|---|---|
| **Runtime** | Node.js | ✅ In use |
| **API Framework** | Express.js | ✅ In use |
| **Database** | MongoDB + Mongoose | ✅ In use |
| **Validation** | Joi | ✅ In use |
| **Authentication** | JWT (jsonwebtoken + bcrypt) | ✅ In use |
| **Logging** | Winston + Morgan + Correlation IDs | ✅ In use |
| **Frontend** | React 18 + Vite | ✅ In use |
| **Styling** | Tailwind CSS | ✅ In use |
| **HTTP Client** | Axios | ✅ In use |
| **OAuth** | Passport.js (Google, GitHub, LinkedIn, Discord) | ❌ Not started |
| **Backend Testing** | Jest + Supertest | ❌ Not started |
| **Frontend Testing** | Vitest + React Testing Library | ❌ Not started |
| **E2E Testing** | Cypress | ❌ Not started |
| **Event Infrastructure** | Apache Kafka + KafkaJS | ❌ Not started |
| **Real-Time** | Server-Sent Events (SSE) | ❌ Not started |
| **Containerization** | Docker + Docker Compose | ❌ Not started |

---

## 3. Current State Assessment

Based on a thorough review of the codebase as of March 2026, here is what exists today:

### 3.1 What's Built ✅

#### Backend
- **Layered Architecture:** Controllers → Services → Repositories → MongoDB
- **Task CRUD:** Full create, read (by user, by ID), update, delete
- **Auth:** Login + Register with JWT tokens and bcrypt password hashing
- **Enriched Task Model:** `title`, `description`, `status` (Open/In Progress/In Review/Completed), `priority` (Low/Medium/High), `dueDate`, `tags` (string array), `assignee` (User ObjectId ref), `userId`, plus Mongoose `timestamps`
- **Validation:** Joi schemas for auth and task endpoints
- **Error Handling:** Custom `ApiError` class + centralized `errorHandler` middleware
- **Logging:** Winston (daily rotating file transports), Morgan HTTP logger, UUID correlation IDs per request
- **User Management:** Basic user CRUD (routes, service, repository)

#### Frontend
- **Login Page:** Email/password form → JWT token stored in localStorage
- **Task Dashboard:** Grid layout with `TaskCard` components showing title, description, status badge, priority indicator, due date, and tags
- **Task Sidedraw:** Slide-out drawer for creating/editing tasks with dropdowns for status, priority, assignee (fetched from users API), date picker, and tag pills
- **Delete:** Delete task with confirmation
- **Alert System:** Toast-style `AlertBox` component for success/error/warning notifications
- **API Layer:** Axios-based API client with auth headers (`apiClient.js`, `task.js`, `auth.js`, `user.js`)

#### Infrastructure
- **MCP Server:** For AI-assisted local development against `localhost:5000`

### 3.2 What's Partially Done 🔧

| Feature | Details |
|---|---|
| Frontend auth flow | Backend done; frontend has login page but logout is basic (no token refresh, no protected route HOC) |
| Loading states | Not fully implemented across all async operations |
| Joi validation on task routes | Schema exists but needs alignment with current model and wiring to routes |

### 3.3 What's Not Started ❌

| Feature | Phase |
|---|---|
| Kafka event infrastructure | Phase 3 |
| Event producers (task events) | Phase 3 |
| Kafka consumers (notification, analytics) | Phase 3 |
| Retry / DLQ / idempotency mechanisms | Phase 4 |
| SSE real-time server | Phase 5 |
| Frontend real-time notification UI | Phase 5 |
| Analytics dashboard features | Phase 6 |
| Automated tests | Phase 7 |
| Docker containerization | Phase 8 |

---

## 4. System Architecture

### 4.1 Current Architecture

```
┌─────────────────┐         ┌──────────────────────────────────────────┐
│   React Client  │  HTTP   │              Express Server              │
│   (Vite, :5173) │ ◀─────▶ │                (:5000)                   │
│                 │         │                                          │
│  • LoginPage    │         │  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  • TaskDashboard│         │  │Controller│─▶│ Service  │─▶│  Repo  │ │
│  • TaskSidedraw │         │  └──────────┘  └──────────┘  └────┬───┘ │
│  • TaskCard     │         │                                   │     │
│  • AlertBox     │         │  Middleware: auth, correlationId,  │     │
│                 │         │  httpLogger, validate, errorHandler│     │
└─────────────────┘         └───────────────────────────────────┼─────┘
                                                                │
                                                         ┌──────▼───────┐
                                                         │   MongoDB    │
                                                         │  (Mongoose)  │
                                                         └──────────────┘
```

### 4.2 Target Architecture (Post-Kafka)

```
┌──────────────┐        ┌──────────────────────────────────────────────────┐
│ React Client │  HTTP  │                Express Server                    │
│   (:5173)    │◀──────▶│                  (:5000)                         │
│              │        │                                                  │
│  Dashboard   │◀──SSE──│  ┌──────────┐ ┌──────────┐ ┌──────┐            │
│  Notifs UI   │        │  │Controller│─│ Service  │─│ Repo │            │
│  Analytics   │        │  └──────────┘ └─────┬────┘ └──┬───┘            │
└──────────────┘        │                     │         │                  │
                        │               ┌─────▼─────┐   │                  │
                        │               │  Kafka    │   │                  │
                        │               │ Producer  │   │                  │
                        │               └─────┬─────┘   │                  │
                        │                     │         │                  │
                        │  ┌──────────────────▼───────┐ │                  │
                        │  │      Kafka Broker        │ │                  │
                        │  │  Topics:                 │ │                  │
                        │  │  • task.created          │ │                  │
                        │  │  • task.updated          │ │                  │
                        │  │  • task.completed        │ │                  │
                        │  │  • task.overdue          │ │                  │
                        │  │  • *.dlq (dead-letter)   │ │                  │
                        │  └──┬──────────────┬────────┘ │                  │
                        │     │              │          │                  │
                        │  ┌──▼────────┐ ┌───▼───────┐  │                  │
                        │  │Notif      │ │Analytics  │  │                  │
                        │  │Consumer   │ │Consumer   │  │                  │
                        │  └─────┬─────┘ └─────┬─────┘  │                  │
                        │       │              │        │                  │
                        │  ┌────▼────┐   ┌─────▼─────┐  │                  │
                        │  │  SSE    │   │ Analytics │  │                  │
                        │  │ Server  │   │  Store    │  │                  │
                        │  └─────────┘   └───────────┘  │                  │
                        └──────────────────────────────┼──────────────────┘
                                                       │
                                                ┌──────▼───────┐
                                                │   MongoDB    │
                                                └──────────────┘
```

### 4.3 Request Flow

```
Client Request
      │
      ▼
  CORS Middleware
      │
      ▼
  Correlation ID (UUID v4)
      │
      ▼
  HTTP Logger (Morgan → Winston)
      │
      ▼
  JSON Body Parser
      │
      ▼
  Route Matching
      │
      ▼
  Auth Middleware (JWT verify)     ← Protected routes only
      │
      ▼
  Joi Validation Middleware        ← Routes with validation schemas
      │
      ▼
  Controller (HTTP logic only)
      │
      ▼
  Service (business logic + Kafka produce)
      │
      ▼
  Repository (Mongoose operations)
      │
      ▼
  MongoDB
```

---

## 5. Enriched Task Model

### 5.1 Schema Definition

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `title` | String | ✅ | — | Task title (trimmed) |
| `description` | String | ❌ | `""` | Detailed description |
| `status` | String (enum) | ❌ | `"Open"` | One of: Open, In Progress, In Review, Completed |
| `priority` | String (enum) | ❌ | `"Low"` | One of: Low, Medium, High |
| `dueDate` | Date | ❌ | `Date.now` | Task deadline |
| `tags` | [String] | ❌ | `[]` | Categorization labels |
| `assignee` | ObjectId (ref: User) | ✅ | — | Assigned user |
| `userId` | ObjectId (ref: User) | ✅ | — | Task creator / owner |
| `createdAt` | Date | auto | — | Mongoose timestamp |
| `updatedAt` | Date | auto | — | Mongoose timestamp |

### 5.2 Design Decisions

> [!NOTE]
> **`status` enum over `completed` boolean:** The original plan mentioned a `completed: Boolean` field. The current implementation uses a `status` enum (`Open`, `In Progress`, `In Review`, `Completed`) which is confirmed as the better design — it captures richer workflow state and eliminates the need for a separate boolean.

> [!NOTE]
> **`assignee` as ObjectId:** The `assignee` field is an `ObjectId` reference to the User model (not a plain string). This is the correct relational design — it enables population of user details and referential integrity.

---

## 6. Authentication & OAuth Strategy

### 6.1 Current Auth State

The current auth implementation covers the basics:
- **Backend:** JWT-based login/register with bcrypt password hashing
- **Frontend:** Login page stores JWT in localStorage, basic logout clears storage
- **Middleware:** `auth.middleware.js` verifies JWT on protected routes

### 6.2 Auth Improvements Needed

| Area | Current | Target |
|---|---|---|
| **Login** | Email/password only | Email/password + OAuth (Google, GitHub, LinkedIn, Discord) |
| **Signup** | Email/password only | Email/password + OAuth auto-registration |
| **Logout** | `localStorage.removeItem()` only | Server-side token invalidation + client cleanup |
| **Token management** | No expiry handling | Token refresh flow or re-auth prompt on expiry |
| **Protected routes** | Inline `if (!token)` check | Reusable `ProtectedRoute` wrapper component |
| **User model** | Email + password only | Add `provider` field, `providerId`, optional password, `avatar` |

### 6.3 OAuth Providers

| Provider | Strategy Package | Why Include? |
|---|---|---|
| **Google** | `passport-google-oauth20` | Most widely used OAuth — expected by users |
| **GitHub** | `passport-github2` | Perfect for a developer portfolio project |
| **LinkedIn** | `passport-linkedin-oauth2` | Professional credibility — relevant for a task management app |
| **Discord** | `passport-discord` | Popular in developer communities — easy to set up |

> [!TIP]
> **Passport.js** is the de-facto standard for Node.js OAuth. It provides a clean strategy pattern — each provider is a plugin, and you wire them into the same Express middleware chain. This avoids building custom OAuth flows from scratch.

### 6.4 OAuth Flow

```
User clicks "Login with Google"
        │
        ▼
Frontend redirects to:
  /auth/google
        │
        ▼
Passport redirects to Google consent screen
        │
        ▼
User authorizes → Google redirects to:
  /auth/google/callback?code=...
        │
        ▼
Passport exchanges code for user profile
        │
        ▼
auth.service.js:
  - Find user by providerId
  - If not found → create new user
  - Generate JWT
        │
        ▼
Redirect to frontend with JWT:
  /dashboard?token=<jwt>
        │
        ▼
Frontend stores token in localStorage
```

### 6.5 User Model Changes

The User model needs to support both email/password and OAuth users:

```javascript
const userSchema = new mongoose.Schema({
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, minlength: 6 },        // Optional for OAuth users
    provider: { type: String, default: 'local' },     // 'local', 'google', 'github', 'linkedin', 'discord'
    providerId: { type: String },                      // OAuth provider's user ID
    avatar: { type: String },                          // Profile picture URL from OAuth
}, { timestamps: true });
```

> [!IMPORTANT]
> `password` becomes optional — OAuth users won't have one. Add a pre-save hook or validation to require password only when `provider === 'local'`.

### 6.6 Improved Logout Strategy

**Current:** Frontend simply clears localStorage — the JWT remains valid until it expires.

**Improved approach:**

| Strategy | Description | Complexity |
|---|---|---|
| **Short-lived JWT + refresh token** | Access token expires in 15 min, refresh token in 7 days. Refresh endpoint issues new access token. | Medium |
| **Token blacklist** | On logout, add JWT to a blacklisted set (Redis or MongoDB with TTL). Auth middleware checks blacklist. | Medium |
| **Simple: short-lived JWT only** | Set JWT expiry to 1–2 hours. On expiry, redirect to login. No refresh flow. | Low |

> **Recommendation for TaskFlow:** Use **short-lived JWT (1h) + frontend expiry detection**. If the token is expired, redirect to login. This avoids refresh token complexity while being secure enough for a portfolio project. Add a token blacklist if you want to demonstrate that pattern.

### 6.7 Frontend Auth Improvements

| Component | Description |
|---|---|
| `ProtectedRoute.jsx` | Wrapper that checks for valid token, redirects to `/` if missing/expired |
| `OAuthButtons.jsx` | Google / GitHub / LinkedIn / Discord login buttons on the login page |
| `useAuth.js` (hook) | Custom hook for auth state management (token, user, isAuthenticated, logout) |
| Token expiry check | Decode JWT on load, check `exp` claim, redirect if expired |

### 6.8 Backend Auth Routes (Updated)

```
# Existing
POST   /auth/register            → Email/password registration
POST   /auth/login                → Email/password login

# New — OAuth initiation
GET    /auth/google               → Redirect to Google consent screen
GET    /auth/github               → Redirect to GitHub consent screen
GET    /auth/linkedin             → Redirect to LinkedIn consent screen
GET    /auth/discord              → Redirect to Discord consent screen

# New — OAuth callbacks
GET    /auth/google/callback      → Google callback → JWT → redirect to frontend
GET    /auth/github/callback      → GitHub callback → JWT → redirect to frontend
GET    /auth/linkedin/callback    → LinkedIn callback → JWT → redirect to frontend
GET    /auth/discord/callback     → Discord callback → JWT → redirect to frontend

# New — Logout
POST   /auth/logout               → Invalidate token (optional blacklist)
```

### 6.9 OAuth Environment Variables

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:5000/auth/github/callback

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_CALLBACK_URL=http://localhost:5000/auth/linkedin/callback

# Discord OAuth
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_CALLBACK_URL=http://localhost:5000/auth/discord/callback
```

---

## 7. Backend Architecture

### 7.1 Current Folder Structure

```
src/
├── app.js                          # Express app setup, middleware chain, route mounting
├── server.js                       # Entry point — DB connect, port listen, process handlers
│
├── config/
│   ├── db.js                       # MongoDB connection via Mongoose
│   └── env.js                      # Environment variable loader
│
├── controllers/
│   ├── auth.controller.js          # POST /auth/login, /auth/register
│   ├── task.controller.js          # CRUD /tasks — thin HTTP handlers
│   └── user.controller.js          # GET/POST /users
│
├── services/
│   ├── auth.service.js             # Login/register business logic, JWT signing
│   ├── task.service.js             # Task CRUD logic, ownership checks
│   └── user.service.js             # User lookup logic
│
├── repositories/
│   ├── task.repository.js          # Task Mongoose operations
│   └── user.repository.js          # User Mongoose operations
│
├── models/
│   ├── task.model.js               # Mongoose Task schema
│   └── user.model.js               # Mongoose User schema
│
├── validation/
│   ├── auth.validation.js          # Joi schemas for auth
│   ├── task.validation.js          # Joi schemas for tasks
│   └── user.validation.js          # Joi schemas for users
│
├── middlewares/
│   ├── auth.middleware.js          # JWT verification
│   ├── correlationId.js            # UUID per request
│   ├── httpLogger.js               # Morgan → Winston
│   └── validate.js                 # Joi validation middleware
│
├── exceptions/
│   ├── ApiError.js                 # Custom error class (statusCode + message)
│   └── errorHandler.js             # Centralized error handler middleware
│
└── utils/
    └── logger.js                   # Winston logger (console + rotating files)
```

### 7.2 Target Folder Structure (Post-Kafka Phases)

New directories and files to be added during Phases 3–6:

```
src/
├── ...existing structure...
│
├── infrastructure/                  # [NEW] Shared system components
│   ├── kafka/
│   │   ├── kafkaClient.js          # KafkaJS client singleton
│   │   ├── producer.js             # Generic Kafka producer wrapper
│   │   ├── consumer.js             # Generic Kafka consumer wrapper
│   │   └── topics.js               # Topic name constants
│   └── sse/
│       └── sseManager.js           # SSE connection manager
│
├── modules/                         # [NEW] Event-driven modules
│   ├── notifications/
│   │   ├── notification.consumer.js # Kafka consumer for notification events
│   │   └── notification.service.js  # Notification processing logic
│   │
│   └── analytics/
│       ├── analytics.consumer.js   # Kafka consumer for analytics events
│       ├── analytics.service.js    # Analytics processing logic
│       └── analytics.model.js      # Analytics data model
│
├── events/                          # [NEW] Event definitions
│   ├── taskEvents.js               # Task event type constants + payload builders
│   └── eventProcessor.js           # Processed event tracker (for idempotency)
│
├── schedulers/                      # [NEW] Scheduled jobs
│   └── overdueChecker.js           # Cron-style checker for overdue tasks
│
└── __tests__/                       # [NEW] Test files
    ├── unit/
    │   ├── services/
    │   └── middlewares/
    ├── integration/
    │   └── routes/
    └── setup.js
```

### 7.3 Layer Responsibilities

| Layer | Responsibility | Logging? |
|---|---|---|
| **Controller** | Parse HTTP request, delegate to service, format HTTP response | Never |
| **Service** | Business logic, authorization checks, Kafka event production | **Primary** |
| **Repository** | Mongoose queries, data access | Never |
| **Middleware** | Cross-cutting concerns (auth, validation, logging, errors) | Selective |
| **Routes** | Declarative endpoint → controller mapping | Never |

---

## 7. Kafka Hosting & Integration Strategy

### 7.1 Hosting Options Comparison

Choosing where to run Kafka is a key decision. Here's a comparison tailored to this project's needs:

| Criteria | Local Docker | Upstash Kafka | Confluent Cloud |
|---|---|---|---|
| **Cost** | Free | Free tier (10K msgs/day) | Free $400 credits (60 days) |
| **Setup difficulty** | Medium (Docker Compose) | Very Low (web console) | Low (web console) |
| **Learning value** | 🟢 High — you see everything | 🟡 Medium — abstracted | 🟡 Medium — abstracted |
| **Offline dev** | ✅ Yes | ❌ No | ❌ No |
| **Production-like** | ❌ Single broker, no HA | ✅ Managed, serverless | ✅ Full-featured |
| **Resource usage** | ⚠️ Heavy (~1-2GB RAM for Kafka+ZK) | None (cloud) | None (cloud) |
| **KafkaJS compatible** | ✅ Native protocol | ✅ + REST API | ✅ Native protocol |
| **Operational overhead** | Medium (you manage it) | None | None |
| **Portfolio demo** | Needs Docker on reviewer's machine | Works anywhere (cloud hosted) | Works anywhere |
| **Best for** | Learning Kafka internals | Quick dev + deployment | Enterprise-scale learning |

### 7.2 Recommendation for TaskFlow

> [!IMPORTANT]
> **Recommended approach: Hybrid (Local Docker for dev → Upstash for demo/deploy)**

**Phase 1 (Development):** Use **Local Docker** with Docker Compose.
- Spin up Kafka + Zookeeper (or KRaft mode) alongside MongoDB
- Zero cost, full control, works offline
- Best learning experience — you'll see broker logs, topic creation, partition behavior
- Docker Compose file makes it reproducible

**Phase 2 (Demo/Deploy):** Migrate to **Upstash Kafka** for deployment.
- Serverless, pay-per-request model (free tier: 10,000 messages/day — more than enough for a portfolio app)
- No infrastructure to manage
- Portfolio reviewers can see the app working without running Docker
- KafkaJS works with Upstash's native Kafka protocol endpoint

**Why not Confluent Cloud?**
- Overkill for a personal project — the free credits expire after 60 days
- Standard clusters cost ~$385/month after credits
- The extra features (Schema Registry, ksqlDB, managed connectors) aren't needed here

### 7.3 Docker Compose Setup (Dev Environment)

```yaml
# docker-compose.yml
version: '3.8'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

### 7.4 Environment Abstraction

The Kafka client should be configured via environment variables so switching between local Docker and Upstash is just a `.env` change:

```javascript
// infrastructure/kafka/kafkaClient.js
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'taskflow-backend',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    // Upstash requires SASL — only add if credentials present
    ...(process.env.KAFKA_USERNAME && {
        ssl: true,
        sasl: {
            mechanism: 'scram-sha-256',
            username: process.env.KAFKA_USERNAME,
            password: process.env.KAFKA_PASSWORD,
        },
    }),
});

module.exports = kafka;
```

**Local `.env`:**
```env
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=taskflow-backend
```

**Upstash `.env`:**
```env
KAFKA_BROKERS=full-grouse-12345-us1-kafka.upstash.io:9092
KAFKA_CLIENT_ID=taskflow-backend
KAFKA_USERNAME=ZnVsbC1ncm91c2UtMTIzNDU...
KAFKA_PASSWORD=MDQ5ZmE2OTctYzM4...
```

---

## 8. Event-Driven Architecture (Kafka)

### 8.1 Event Catalog

| Event | Topic | Producer | Consumers | Trigger |
|---|---|---|---|---|
| `TaskCreated` | `task.created` | Task Service | Notification, Analytics | Task created via API |
| `TaskUpdated` | `task.updated` | Task Service | Analytics | Task fields modified |
| `TaskCompleted` | `task.completed` | Task Service | Notification, Analytics | Status changed to "Completed" |
| `TaskDeleted` | `task.deleted` | Task Service | Analytics | Task deleted via API |
| `TaskOverdue` | `task.overdue` | Scheduler | Notification | Scheduled check finds past-due tasks |

### 8.2 Event Payload Schema

```json
{
  "eventId": "uuid-v4",
  "eventType": "TaskCreated",
  "timestamp": "2026-03-14T12:00:00Z",
  "correlationId": "request-correlation-id",
  "payload": {
    "taskId": "mongo-object-id",
    "userId": "owner-user-id",
    "title": "Task title",
    "status": "Open",
    "priority": "High",
    "assignee": "assigned-user-id"
  }
}
```

### 8.3 Event Flow

```
User creates/updates/completes task
            │
            ▼
    Task API Endpoint
            │
            ▼
    Task stored in MongoDB
            │
            ▼
    Service produces Kafka event
    (with correlationId + eventId)
            │
            ▼
     ┌──────┴──────┐
     │ Kafka Broker │
     └──────┬──────┘
            │
     ┌──────┴──────────────┐
     ▼                     ▼
Notification           Analytics
  Consumer              Consumer
     │                     │
     ▼                     ▼
SSE push to            Aggregate stats
React client           in MongoDB
```

### 8.4 Kafka Integration in Task Service

The Kafka producer calls will be added **after** the database operation succeeds in the service layer:

```javascript
// task.service.js — after Kafka integration
const createTask = async (userId, data) => {
    const task = await taskRepo.createTask({ ...data, userId });
    logger.debug('Task created', { taskId: task._id, userId });

    // Produce event asynchronously — fire-and-forget
    await kafkaProducer.produce('task.created', {
        eventId: uuid(),
        eventType: 'TaskCreated',
        correlationId: data.correlationId,
        timestamp: new Date().toISOString(),
        payload: { taskId: task._id, userId, title: task.title, status: task.status }
    });

    return task;
};
```

---

## 9. Reliability Mechanisms

### 9.1 At-Least-Once Delivery

Kafka guarantees at-least-once delivery by default. Consumers **must** handle duplicate events gracefully.

### 9.2 Idempotent Consumers

Each event includes a unique `eventId`. Consumers track processed event IDs to prevent duplicate processing.

```
Event arrives
      │
      ▼
Check: Has eventId been processed?
      │
   ┌──┴──┐
   │ Yes │ → Skip (log + acknowledge)
   └──┬──┘
      │ No
      ▼
Process event
      │
      ▼
Store eventId in processed-events collection
      │
      ▼
Acknowledge to Kafka
```

**Implementation:** A `processedEvents` MongoDB collection with a TTL index for auto-cleanup:

```javascript
// events/eventProcessor.js
const ProcessedEvent = mongoose.model('ProcessedEvent', {
    eventId: { type: String, unique: true, required: true },
    processedAt: { type: Date, default: Date.now, expires: 604800 } // 7-day TTL
});
```

### 9.3 Retry Mechanism

Failed event processing should be retried with exponential backoff:

| Attempt | Delay |
|---|---|
| 1st retry | 1 second |
| 2nd retry | 5 seconds |
| 3rd retry | 30 seconds |
| After 3 failures | Move to Dead Letter Topic |

### 9.4 Dead Letter Topics (DLQ)

Events that fail after all retry attempts are published to a dead-letter topic for manual inspection:

```
Original Topic: task.created
Dead Letter Topic: task.created.dlq
```

DLQ events retain the original event payload plus error metadata (failure reason, attempt count, timestamps).

---

## 10. Real-Time Notifications

### 10.1 Architecture

```
  Kafka Event (e.g., TaskCompleted)
            │
            ▼
   Notification Consumer
            │
            ▼
   Build notification payload
            │
            ▼
   SSE Server broadcasts
   to connected clients
            │
            ▼
   React Client receives
   and displays notification
```

### 10.2 Notification Types

| Event | Notification Message | Recipients |
|---|---|---|
| `TaskCompleted` | "Task '{title}' has been completed" | Task owner + assignee |
| `TaskOverdue` | "Task '{title}' is past its due date" | Task owner + assignee |
| `TaskCreated` | "New task '{title}' assigned to you" | Assignee (if different from creator) |

### 10.3 SSE over WebSocket

| Criteria | WebSocket | SSE |
|---|---|---|
| Direction | Bidirectional | Server → Client only |
| Complexity | Higher | Lower |
| Browser support | Universal | Universal |
| Reconnection | Manual | Automatic |
| **Verdict** | Overkill for notifications | **✅ Chosen** |

SSE is the right choice here — notifications are purely server-to-client. WebSocket would be appropriate if the project expands to real-time collaboration features (e.g., live task editing), but that's out of scope.

---

## 11. Observability

### 11.1 Current Implementation ✅

| Component | Package | Purpose |
|---|---|---|
| Structured Logger | `winston` | JSON logs, log levels, file transports |
| Log Rotation | `winston-daily-rotate-file` | Daily rotation, 20MB caps, auto-cleanup |
| HTTP Logger | `morgan` | Request method, URL, status, response time |
| Correlation IDs | `uuid` | UUID v4 per request for end-to-end tracing |

### 11.2 Logging by Layer

| Layer | Logs? | What Gets Logged |
|---|---|---|
| Middleware | Selective | HTTP requests (Morgan), auth failures, errors |
| Controllers | Never | Thin pass-throughs |
| Services | **Primary** | Business events: task CRUD, login, register |
| Repositories | Never | Thin Mongoose wrappers |
| Kafka Producer | Yes | Event produced, topic, eventId |
| Kafka Consumers | Yes | Event received, processing result, errors |

### 11.3 Log Levels

| Level | Usage | Dev | Prod |
|---|---|---|---|
| `error` | DB failures, unhandled exceptions, consumer crashes | ✅ | ✅ |
| `warn` | Auth failures, duplicate events, DLQ moves | ✅ | ✅ |
| `info` | Startup, DB connected, Kafka connected, task events | ✅ | ✅ |
| `http` | Every HTTP request via Morgan | ✅ | ❌ |
| `debug` | Task CRUD operations, event processing details | ✅ | ❌ |

### 11.4 Correlation ID Flow (Current + Future)

```
Client Request
      │
      ▼
correlationId middleware (generates UUID)
      │
      ▼
Flows through service layer logs
      │
      ▼
Embedded in Kafka event payload          ← Phase 3
      │
      ▼
Consumer logs include correlationId      ← Phase 3
      │
      ▼
X-Correlation-ID response header
```

---

## 12. Analytics Metrics & Dashboard

### 12.1 Overkill Assessment

> [!TIP]
> Analytics in a task management app is **not overkill** — it's a powerful portfolio differentiator. The key is to keep it **event-driven** (data comes naturally from Kafka consumers) rather than building expensive real-time aggregation. The metrics below are organized into two tiers: **Core** (implement these) and **Nice-to-Have** (only if time permits).

### 12.2 Core Analytics Metrics (Recommended)

These metrics come directly from the Kafka events already being produced — minimal extra work:

| Metric | Source Event | Query/Aggregation | Visualization |
|---|---|---|---|
| **Total tasks by status** | All task events | Count tasks grouped by `status` | Donut/pie chart |
| **Tasks by priority** | All task events | Count tasks grouped by `priority` | Horizontal bar chart |
| **Completion rate** | `TaskCompleted` | `completed / total × 100` | Single stat card |
| **Overdue task count** | `TaskOverdue` | Count tasks with `dueDate < now && status !== 'Completed'` | Single stat card with alert color |
| **Tasks completed over time** | `TaskCompleted` | Group completions by day/week | Line chart |
| **Average time to completion** | `TaskCreated` + `TaskCompleted` | `completedAt - createdAt` averaged | Single stat card |

### 12.3 Nice-to-Have Metrics (Stretch)

These require additional data or more complex processing — only pursue if the core is solid:

| Metric | Extra Work Needed | Worth It? |
|---|---|---|
| Tasks per assignee | Aggregate by assignee from existing data | ✅ Yes — easy win |
| Workload distribution chart | Same as above, different visualization | ✅ Yes — looks great in portfolio |
| Completion trends by priority | Cross-reference priority + completion events | 🟡 Maybe |
| Tag frequency analysis | Aggregate tags across all tasks | 🟡 Maybe — interesting but niche |
| Overdue rate over time | Track overdue events with timestamps | ❌ Skip — overkill |
| Peak productivity hours | Requires tracking event timestamps at hour granularity | ❌ Skip — overkill |
| Burndown chart | Requires sprint/iteration concept | ❌ Skip — needs scope change |

### 12.4 Analytics Data Strategy

**Option A: Query MongoDB directly** (simpler, recommended for this project)
- The analytics endpoint queries the tasks collection using Mongoose aggregation pipelines
- No separate analytics store needed
- Works well for the scale of a personal project

**Option B: Separate analytics store** (more complex, better architecture demo)
- Kafka analytics consumer writes pre-aggregated data to an `analytics` collection
- Dashboard reads from the pre-aggregated store
- Better separation of concerns, but more moving parts

> **Decision:** Start with **Option A** for simplicity. Migrate to Option B if you want to demonstrate CQRS-like patterns for the portfolio.

### 12.5 Frontend Analytics Components

| Component | Description |
|---|---|
| `AnalyticsDashboard.jsx` | Main analytics page with chart grid |
| `StatCard.jsx` | Single metric display (number + label + trend indicator) |
| Chart library | Use **Recharts** (React-native, lightweight, good docs) — or **Chart.js** via `react-chartjs-2` |

---

## 13. Testing Strategy

### 13.1 Testing Stack

| Type | Backend Tool | Frontend Tool |
|---|---|---|
| **Unit tests** | Jest | Vitest + React Testing Library |
| **Integration tests** | Jest + Supertest | — |
| **E2E tests** | — | Cypress |
| **API contract tests** | Custom Joi schema tests | — |

> [!NOTE]
> **Why Jest for backend and Vitest for frontend?** Jest has the most mature ecosystem for Node.js/Express testing with Supertest. Vitest is built for Vite projects and offers near-identical API to Jest but with significantly faster execution for the React frontend.

### 13.2 Backend Unit Tests

**What to test:**
| Layer | What to Test | Priority |
|---|---|---|
| **Services** | Business logic (task ownership, status transitions, JWT signing) | 🟢 High |
| **Middlewares** | Auth middleware (valid/invalid/missing tokens) | 🟢 High |
| **Validators** | Joi schemas (valid input, missing fields, invalid types) | 🟢 High |
| **Repositories** | Skip — thin Mongoose wrappers, tested via integration tests | ⚪ Skip |
| **Controllers** | Skip — thin pass-throughs, tested via integration tests | ⚪ Skip |

**Example: `task.service.test.js`**
```javascript
describe('TaskService', () => {
    describe('createTask', () => {
        it('should create task with valid data');
        it('should associate task with userId');
    });

    describe('getTaskById', () => {
        it('should return task if owner matches');
        it('should throw 403 if user does not own the task');
        it('should throw 404 if task does not exist');
        it('should throw 400 for invalid task ID format');
    });

    describe('deleteTask', () => {
        it('should delete task owned by user');
        it('should throw 403 for unauthorized deletion');
    });
});
```

### 13.3 Backend Integration Tests

**What to test:** Full HTTP request → response cycle via Supertest, using a test MongoDB instance.

```javascript
describe('Task Routes', () => {
    describe('POST /tasks', () => {
        it('should return 201 and created task with valid data');
        it('should return 400 with Joi validation errors');
        it('should return 401 without auth token');
    });

    describe('GET /tasks', () => {
        it('should return only tasks owned by authenticated user');
        it('should return empty array for user with no tasks');
    });

    describe('PUT /tasks/:id', () => {
        it('should update task fields');
        it('should return 403 when updating another user\'s task');
    });

    describe('DELETE /tasks/:id', () => {
        it('should delete and return 200');
        it('should return 404 for non-existent task');
    });
});
```

### 13.4 Frontend Tests

**What to test:**
| Component | What to Test | Priority |
|---|---|---|
| `TaskCard` | Renders title, status badge, priority, tags, due date | 🟢 High |
| `TaskSidedraw` | Form submission, validation, add vs edit mode | 🟢 High |
| `TaskDashboard` | Task list rendering, add/edit/delete handlers | 🟢 High |
| `LoginCard` | Form validation, login success/error flows | 🟡 Medium |
| `AlertBox` | Renders correct type/message | 🟡 Medium |
| `NavBar` | Logout handler fires | ⚪ Low |

### 13.5 Edge Cases & Security Tests

| Category | Test Cases |
|---|---|
| **Auth edge cases** | Expired JWT, malformed JWT, no Bearer prefix, empty token |
| **Input validation** | XSS in title/description, extremely long strings, special characters in tags |
| **Authorization** | User A cannot read/update/delete User B's tasks |
| **Concurrent ops** | Deleting a task that's being edited (race condition handling) |
| **Data integrity** | Creating task with non-existent assignee, invalid ObjectId formats |
| **Rate limiting** | (Future) Excessive API calls per user — not critical now but good to note |

### 13.6 E2E Tests (Cypress)

| Flow | Steps |
|---|---|
| **Login (email/password)** | Visit `/` → enter credentials → verify redirect to `/dashboard` |
| **Login (OAuth)** | Click "Login with GitHub" → verify redirect to provider → verify callback redirect to `/dashboard` |
| **Logout** | Click logout → verify redirect to `/` → verify protected route blocked |
| **Create task** | Click "Add Task" → fill form → submit → verify card appears in grid |
| **Edit task** | Click task card → modify fields → save → verify changes reflected |
| **Delete task** | Click delete icon → verify task removed from grid |
| **Validation** | Try submitting empty form → verify error alerts appear |
| **Token expiry** | Set expired token in localStorage → navigate to `/dashboard` → verify redirect to login |

### 13.7 Test File Structure

```
# Backend
src/__tests__/
├── unit/
│   ├── services/
│   │   ├── task.service.test.js
│   │   └── auth.service.test.js
│   ├── middlewares/
│   │   └── auth.middleware.test.js
│   └── validation/
│       └── task.validation.test.js
├── integration/
│   ├── routes/
│   │   ├── task.routes.test.js
│   │   └── auth.routes.test.js
│   └── setup.js                    # Test DB connection, cleanup helpers
└── jest.config.js

# Frontend
mern-frontend/src/__tests__/
├── components/
│   ├── TaskCard.test.jsx
│   ├── TaskSidedraw.test.jsx
│   └── AlertBox.test.jsx
├── pages/
│   ├── TaskDashboard.test.jsx
│   └── LoginPage.test.jsx
└── setup.js                        # Vitest setup, mocks

# E2E
mern-frontend/cypress/
├── e2e/
│   ├── login.cy.js
│   ├── task-crud.cy.js
│   └── validation.cy.js
├── fixtures/
└── support/
```

---

## 14. Frontend Overview

### 14.1 Current Components

| Component | Type | Description |
|---|---|---|
| `App.jsx` | Router | Route definitions (Login, Dashboard) |
| `LoginPage.jsx` | Page | Email/password login form |
| `TaskDashboard.jsx` | Page (Orchestrator) | Owns all task state, manages CRUD handlers |
| `Dashboard.jsx` | Page (Presentational) | Task grid layout, "Add Task" button |
| `TaskCard.jsx` | UI Component | Card with status badge, priority dot, due date, tags |
| `TaskSidedraw.jsx` | UI Component | Slide-out form for add/edit with assignee dropdown, tag pills |
| `NavBar.jsx` | UI Component | Top navigation bar |
| `AlertBox.jsx` | UI Component | Toast notification (success/error/warning) |
| `LoginCard.jsx` | Auth Component | Login form card |

### 14.2 Frontend Additions (Future Phases)

| Component | Phase | Description |
|---|---|---|
| `NotificationPanel.jsx` | Phase 5 | Real-time notification dropdown/panel |
| `NotificationBadge.jsx` | Phase 5 | Unread notification counter in navbar |
| `AnalyticsDashboard.jsx` | Phase 6 | Charts showing completion rates, productivity metrics |
| `StatCard.jsx` | Phase 6 | Single metric card component |
| `useSSE.js` (hook) | Phase 5 | Custom hook for SSE connection management |
| Side Drawer Navigation | Phase 6 | Sidebar for navigation between views |

---

## 15. API Reference

### 15.1 Auth Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | ❌ | Register user (email/password), returns JWT |
| `POST` | `/auth/login` | ❌ | Login (email/password), returns JWT + user object |
| `POST` | `/auth/logout` | ✅ | Invalidate current token |
| `GET` | `/auth/google` | ❌ | Initiate Google OAuth flow |
| `GET` | `/auth/google/callback` | ❌ | Google OAuth callback → JWT |
| `GET` | `/auth/github` | ❌ | Initiate GitHub OAuth flow |
| `GET` | `/auth/github/callback` | ❌ | GitHub OAuth callback → JWT |
| `GET` | `/auth/linkedin` | ❌ | Initiate LinkedIn OAuth flow |
| `GET` | `/auth/linkedin/callback` | ❌ | LinkedIn OAuth callback → JWT |
| `GET` | `/auth/discord` | ❌ | Initiate Discord OAuth flow |
| `GET` | `/auth/discord/callback` | ❌ | Discord OAuth callback → JWT |

### 15.2 Task Endpoints (Protected — `Authorization: Bearer <token>`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/tasks` | ✅ | Get all tasks for authenticated user |
| `GET` | `/tasks/:id` | ✅ | Get single task (ownership verified) |
| `POST` | `/tasks` | ✅ | Create new task |
| `PUT` | `/tasks/:id` | ✅ | Update task (ownership verified) |
| `DELETE` | `/tasks/:id` | ✅ | Delete task (ownership verified) |

### 15.3 User Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/users` | ✅ | Get all users (for assignee dropdown) |

### 15.4 Future Endpoints

| Method | Endpoint | Phase | Description |
|---|---|---|---|
| `GET` | `/analytics/summary` | Phase 6 | Task completion stats, metrics |
| `GET` | `/notifications` | Phase 5 | Get notification history |
| `GET` | `/events/stream` | Phase 5 | SSE endpoint for real-time events |
| `GET` | `/health` | Phase 8 | Health check for container orchestration |

---

## 16. Development Roadmap

### Phase 1: Backend Foundation ✅ DONE

- [x] Express server setup with middleware chain
- [x] MongoDB connection via Mongoose
- [x] User model + auth (register, login, JWT)
- [x] Task model + CRUD API
- [x] Layered architecture (Controller → Service → Repository)
- [x] Centralized error handling (`ApiError` + `errorHandler`)
- [x] Basic React frontend (Login, Dashboard, Task cards)

### Phase 2: Enriched Task Model + Fixes 🔧 IN PROGRESS

- [x] Add `status` field (Open, In Progress, In Review, Completed)
- [x] Add `priority` field (Low, Medium, High)
- [x] Add `dueDate` field (Date)
- [x] Add `tags` field (array of strings)
- [x] Add `assignee` field (User ObjectId reference)
- [x] Update frontend `TaskCard` with status badge, priority indicator, tags
- [x] Update `TaskSidedraw` with dropdowns, date picker, tag input
- [ ] Fix Joi validation schema — align with current model ⚡ (immediate fix)
- [ ] Wire Joi validation middleware to all task routes
- [ ] Add update validation schema (PUT — all fields optional)
- [ ] Frontend loading states — spinners / skeleton states
- [ ] **Auth improvements:**
  - [ ] Install Passport.js + OAuth strategy packages
  - [ ] Update User model (add `provider`, `providerId`, `avatar`; make `password` optional)
  - [ ] Create Passport strategies (Google, GitHub, LinkedIn, Discord)
  - [ ] Add OAuth routes (`/auth/google`, `/auth/github`, `/auth/linkedin`, `/auth/discord` + callbacks)
  - [ ] Create `OAuthButtons.jsx` — provider login buttons on login/register page
  - [ ] Create `ProtectedRoute.jsx` — reusable auth wrapper component
  - [ ] Create `useAuth.js` hook — token state, expiry check, logout handler
  - [ ] Implement proper logout (clear localStorage + optional token blacklist)
  - [ ] Add token expiry detection — decode JWT `exp`, redirect on expiry
  - [ ] Update login page UI with OAuth buttons + divider ("or sign in with")
- [ ] Update `CLAUDE.md` — reflect current feature status

### Phase 3: Kafka Integration ✅ DONE

- [x] Set up Docker Compose (Kafka using KRaft)
- [x] Install `kafkajs` dependency
- [x] Create `infrastructure/kafka/kafkaClient.js` — KafkaJS client singleton (env-agnostic)
- [x] Create `infrastructure/kafka/producer.js` — generic producer wrapper
- [x] Create `infrastructure/kafka/consumer.js` — generic consumer wrapper
- [x] Define topic constants in `infrastructure/kafka/topics.js` (taskEvents)
- [x] Add Kafka event production to `task.service.js` for:
  - `task.created` on createTask
  - `task.updated` on updateTask
  - `task.completed` on status change to "Completed"
  - `task.deleted` on deleteTask
- [x] Create `modules/notifications/notification.consumer.js`
- [x] Create `modules/analytics/analytics.consumer.js`
- [x] Wire consumer startup in `server.js` (added topic auto-creation script)
- [x] Add Kafka connection/error logging

### Phase 4: Reliability Mechanisms ❌ NOT STARTED

- [ ] Add `eventId` (UUID) to all Kafka event payloads
- [ ] Create `ProcessedEvent` model with TTL index
- [ ] Implement idempotent consumer wrapper (check eventId before processing)
- [ ] Add retry logic with exponential backoff (1s → 5s → 30s)
- [ ] Create dead-letter topics (`*.dlq`)
- [ ] Implement DLQ producer (move failed events after max retries)
- [ ] Log all retry attempts and DLQ moves at `warn` level
- [ ] Test duplicate event handling

### Phase 5: Real-Time Notifications ❌ NOT STARTED

- [ ] Set up SSE endpoint (`GET /events/stream`)
- [ ] Create `infrastructure/sse/sseManager.js` — manages client connections
- [ ] Connect notification consumer to SSE broadcaster
- [ ] Create `useSSE.js` custom React hook
- [ ] Create `NotificationPanel.jsx` — dropdown UI for notifications
- [ ] Create `NotificationBadge.jsx` — unread count in navbar
- [ ] Add notification types: Task completed, Task overdue, Task assigned
- [ ] Implement `notification.service.js` — format and route notifications
- [ ] Test real-time flow end-to-end

### Phase 6: Analytics Dashboard ❌ NOT STARTED

- [ ] Create analytics aggregation endpoint (`GET /analytics/summary`)
- [ ] Implement MongoDB aggregation pipelines for core metrics
- [ ] Build `AnalyticsDashboard.jsx` with:
  - Task status distribution (donut chart)
  - Tasks by priority (bar chart)
  - Completion rate (stat card)
  - Overdue count (stat card)
  - Completions over time (line chart)
  - Average time to completion (stat card)
- [ ] Add Recharts (or react-chartjs-2) as chart library
- [ ] Add side drawer navigation for switching between Tasks and Analytics views
- [ ] (Stretch) Tasks per assignee / workload distribution chart

### Phase 7: Testing ❌ NOT STARTED

- [ ] Set up Jest for backend testing
- [ ] Set up Vitest + React Testing Library for frontend testing
- [ ] Set up Cypress for E2E testing
- [ ] Write unit tests for services (task, auth)
- [ ] Write unit tests for auth middleware
- [ ] Write unit tests for Joi validation schemas
- [ ] Write integration tests for task routes (Supertest)
- [ ] Write integration tests for auth routes (Supertest)
- [ ] Write frontend component tests (TaskCard, TaskSidedraw, AlertBox)
- [ ] Write E2E tests (login flow, task CRUD, validation)
- [ ] Add edge case / security tests (expired JWT, XSS, authorization checks)

### Phase 8: DevOps, Deployment & Polish ❌ NOT STARTED

- [ ] Create `Dockerfile` for backend
- [ ] Create `Dockerfile` for frontend
- [ ] Create `docker-compose.yml` (backend, frontend, MongoDB, Kafka + Zookeeper)
- [ ] Add health-check endpoint (`GET /health`)
- [ ] Migrate Kafka config to Upstash for deployment environment
- [ ] Write comprehensive `README.md`
- [ ] Final `CLAUDE.md` update

---

## 17. Deployment Notes

### 17.1 Deployment Strategy

| Component | Development | Production / Demo |
|---|---|---|
| **Backend** | `nodemon` (local, :5000) | Docker container or cloud PaaS (Render, Railway) |
| **Frontend** | Vite dev server (local, :5173) | Static build (`npm run build`) → CDN/static hosting (Vercel, Netlify) |
| **MongoDB** | Local or Docker | MongoDB Atlas (free tier: 512MB) |
| **Kafka** | Docker Compose (local) | Upstash Kafka (serverless, free tier) |

### 17.2 Deployment Checklist

- [ ] Set `NODE_ENV=production` in backend environment
- [ ] Use environment variables for all secrets (JWT_SECRET, MONGO_URI, KAFKA credentials)
- [ ] Enable CORS for production frontend domain
- [ ] Configure Vite to build with correct `VITE_API_URL` pointing to production backend
- [ ] Set Winston log level to `info` in production (already handled via `NODE_ENV` check)
- [ ] Add `helmet` middleware for security headers (nice-to-have)
- [ ] Add rate limiting via `express-rate-limit` (nice-to-have)

### 17.3 Suggested Free Hosting Stack

| Service | Provider | Tier | Notes |
|---|---|---|---|
| Backend API | Render / Railway | Free tier | Auto-deploy from GitHub, supports Node.js |
| Frontend | Vercel / Netlify | Free tier | Auto-deploy from GitHub, Vite support |
| Database | MongoDB Atlas | M0 (Free) | 512MB storage, shared cluster |
| Kafka | Upstash | Free tier | 10K messages/day, serverless |

---

## 18. Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        TaskFlow System                          │
│                                                                 │
│  ┌────────────┐     ┌────────────────────────────────────┐      │
│  │   React    │     │         Express API Server          │      │
│  │  Frontend  │────▶│                                    │      │
│  │            │◀─SSE│  Controllers → Services → Repos    │      │
│  │ Dashboard  │     │         │                          │      │
│  │ Analytics  │     │         ▼ (produces events)        │      │
│  │ Notifs     │     │  ┌─────────────┐                   │      │
│  └────────────┘     │  │    Kafka    │◀── Overdue        │      │
│                     │  │   Broker    │    Scheduler       │      │
│                     │  └──┬──────┬──┘                    │      │
│                     │     │      │                        │      │
│                     │  ┌──▼──┐┌──▼──────┐                │      │
│                     │  │Notif││Analytics│                 │      │
│                     │  │Cons.││Consumer │                 │      │
│                     │  └──┬──┘└──┬──────┘                │      │
│                     │     │      │                        │      │
│                     │     │   ┌──▼──────┐                │      │
│                     │     │   │Analytics│                 │      │
│                     │     │   │  Store  │                 │      │
│                     │     │   └─────────┘                │      │
│                     │     ▼                               │      │
│                     │  SSE Push to React                  │      │
│                     └────────────────────────────────────┘      │
│                                    │                            │
│                             ┌──────▼───────┐                    │
│                             │   MongoDB    │                    │
│                             └──────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

**Summary:** The TaskFlow system consists of a React frontend communicating with an Express API server over HTTP. The API server follows a layered architecture (Controller → Service → Repository) backed by MongoDB. Task lifecycle events are produced to Kafka topics by the service layer. Kafka consumers process these events asynchronously — the notification consumer pushes real-time updates to the frontend via SSE, while the analytics consumer aggregates metrics into a MongoDB analytics store. A scheduled overdue checker produces `TaskOverdue` events. Reliability is ensured through idempotent consumers, retry with exponential backoff, and dead-letter topics for failed events. All layers emit structured logs via Winston with correlation IDs flowing from HTTP requests through Kafka events for end-to-end tracing.

---

## 19. Environment Variables

### Backend (`.env`)

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/mern-demo
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1h
NODE_ENV=development

# Kafka (Phase 3+)
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=taskflow-backend
KAFKA_GROUP_ID=taskflow-consumers
# Upstash only (Phase 8):
# KAFKA_USERNAME=...
# KAFKA_PASSWORD=...
```

### Frontend (`mern-frontend/.env`)

```env
VITE_API_URL=http://localhost:5000
VITE_SSE_URL=http://localhost:5000/events/stream   # Phase 5+
```

---

> **Note to AI models (Claude / Gemini):** When implementing any phase of this plan, always reference this document for context. Check "Current State Assessment" (§3) to understand what already exists. Follow the layered architecture conventions. Log at the service layer. Include correlation IDs in all Kafka event payloads. Maintain the existing code style (CommonJS modules, async/await, Express error middleware pattern). For Kafka setup, use the environment-agnostic client pattern in §7.4 to support both local Docker and Upstash.
