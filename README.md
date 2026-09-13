# LLD Practice Platform — AI-Powered Low-Level Design Judge

> **Primary GitHub Account:** [RajatXAI](https://github.com/RajatXAI) — This is my primary working GitHub account where I maintain my practice work, experiments, learning repositories, and other development projects.
>
> **Project Deployment Account:** [RajatAIX](https://github.com/RajatAIX) — This GitHub account is used specifically for deploying and hosting project repositories, including this assignment.

An end-to-end Low-Level Design (LLD) practice platform for software engineers. Practice architectural challenges such as Parking Lot, Elevator System, Rate Limiter, and more, write object-oriented designs, and receive asynchronous, rubric-based feedback powered by Google Gemini AI.

Submitted as part of the **CipherSchools 2-Day Engineering Hiring Assignment**.

---

## Features

- **Curated Problem Catalog:** Realistic engineering interview challenges with functional requirements, constraints, and difficulty levels.

- **AI Architectural Judge:** Automated evaluation powered by Google Gemini. The evaluator receives the selected problem, its requirements, the learner's submission, and a defined rubric.

  Initial evaluation dimensions include:
  - **Requirement Understanding**
  - **Class Responsibilities**
  - **Encapsulation / Interfaces**
  - **Abstraction / Design Patterns**

- **Structured Feedback:** Evaluation results can include:
  - Overall summary
  - Strengths
  - Improvements
  - Recommendations
  - Criterion-level score
  - Evidence
  - Concern
  - Suggestion
  - Confidence

- **Offline / Fallback Mode:** If Gemini evaluation cannot be performed, the application has a fallback evaluator path so the end-to-end prototype can still return an evaluation result. The fallback should be treated as a prototype fallback, not as a full deterministic analysis engine.

- **Historical Tracking:** Review previous attempts with problem context, statuses, timestamps, scores, and evaluation feedback.

- **Clean Architecture / Domain-Oriented Design:** TypeScript domain entities with separated application logic, repository abstractions, controllers, and infrastructure adapters.

- **Security & Validation:** Zod request validation, Helmet security headers, CORS configuration, and rate limiting.

- **Automated Tests:** Vitest and Supertest tests covering domain state transitions, application/use-case behaviour, API validation, and important edge cases.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Vanilla Modern CSS |
| **Backend** | Node.js (v20+), Express 4, TypeScript 5, Mongoose 8 |
| **Database** | MongoDB (Local or MongoDB Atlas M0 Free Tier) |
| **AI Evaluation** | Google Gemini via `@google/genai`, with prototype fallback evaluation |
| **Validation & Security** | Zod, Helmet, Express Rate Limit, CORS |
| **Testing** | Vitest, Supertest |
| **Deployment** | Docker, Render (`render.yaml`), Vercel (`vercel.json`) |

---

## Quick Start (Local Development)

### Prerequisites

- **Node.js:** v20 or higher (`node -v`)
- **MongoDB:** Running locally on `mongodb://localhost:27017` **or** a MongoDB Atlas connection string.

### 1. Clone & Configure Backend

```bash
cd server

cp .env.example .env
```

Ensure `server/.env` has:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/lld_platform
GEMINI_API_KEY=your_gemini_api_key_here
ALLOWED_ORIGIN=http://localhost:5173
```

`GEMINI_API_KEY` is optional if you want to use the application's fallback evaluation path.

Install dependencies and start the backend:

```bash
npm install
npm run dev
```

Server runs on:

```text
http://localhost:5000
```

> **Note:** On first startup, the server automatically seeds the database with initial LLD problems if the database is empty.

### 2. Configure & Start Frontend

In a new terminal:

```bash
cd client

cp .env.example .env
```

Ensure `client/.env` has:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

Install dependencies and start the client:

```bash
npm install
npm run dev
```

Client runs on:

```text
http://localhost:5173
```

For the deployed prototype, open the configured live frontend URL.

---

## Running Automated Tests

Run the backend test suite:

```bash
cd server

npm test
```

### Test Coverage Summary

The test suite covers important domain and API behaviour, including:

- **`Attempt.test.ts`**
  - Entity creation
  - `IN_PROGRESS → SUBMITTED → EVALUATED` lifecycle
  - Invalid transition guards
  - Serialization behaviour

- **`Submission.test.ts`**
  - Draft mutations
  - `DRAFT → SUBMITTED` transition
  - Mutation rejection after submission
  - Duplicate submission protection

- **`Evaluation.test.ts`**
  - `PENDING → IN_PROGRESS → COMPLETED`
  - Failure lifecycle
  - Score assignment
  - Feedback mapping

- **`CreateAttempt.test.ts`**
  - Use-case behaviour
  - Problem existence checks
  - Problem-title snapshotting

- **`api.test.ts`**
  - Health endpoint
  - Unknown-route handling
  - Request validation failures
  - API error responses

---

## API Reference

All application endpoints are prefixed with `/api/v1`.

### Health Check

- `GET /api/v1/health` — Server health/status information.

### Problems

- `GET /api/v1/problems` — List available LLD problems.
- `GET /api/v1/problems/:id` — Fetch a single problem with detailed requirements.
- `POST /api/v1/problems` — Create a problem after request validation.

### Attempts

- `POST /api/v1/attempts` — Start an attempt:
  ```json
  { "problemId": "..." }
  ```
  The attempt retains the problem title as historical context.

- `GET /api/v1/attempts` — Retrieve attempts.
- `GET /api/v1/attempts/:id` — Retrieve an attempt by ID.
- `POST /api/v1/attempts/:id/submit` — Mark an attempt as submitted.

### Submissions

- `POST /api/v1/submissions` — Create/save a draft submission:
  ```json
  { "attemptId": "...", "solution": "..." }
  ```

- `PUT /api/v1/submissions/:id` — Update an active draft.
- `POST /api/v1/submissions/:id/submit` — Lock a submission into `SUBMITTED` state.

### Evaluations

- `POST /api/v1/evaluations/start` — Initiate evaluation:
  ```json
  { "submissionId": "..." }
  ```
  Returns an evaluation identifier and starts asynchronous evaluation.

- `GET /api/v1/evaluations/:id` — Poll evaluation status:
  `PENDING | IN_PROGRESS | COMPLETED | FAILED`

- `GET /api/v1/evaluations/submission/:submissionId` — Retrieve the evaluation associated with a submission.

---

## Evaluation Flow

The evaluation is intentionally asynchronous:

```text
Learner Submission
       +
Selected Problem
       +
Evaluation Rubric
       ↓
   AI Evaluator
       ↓
Structured Evaluation
       ↓
Persist Evaluation
       ↓
Frontend Polling
       ↓
Feedback + Score
```

The evaluator receives the actual problem requirements. This is important because an LLD submission should be judged against the problem being solved rather than against a generic notion of "good code."

The MVP uses asynchronous in-process execution. A persistent queue/worker system can be introduced later if evaluation volume grows.

---

## Production-Oriented Deployment

### Option 1: Docker

Build the backend image:

```bash
cd server

docker build -t lld-practice-server .
```

Run it with environment variables:

```bash
docker run -p 5000:5000   -e MONGO_URI="mongodb+srv://..."   -e GEMINI_API_KEY="..."   -e ALLOWED_ORIGIN="https://your-frontend.vercel.app"   lld-practice-server
```

### Option 2: Render (Backend) + Vercel (Frontend)

#### Backend — Render

1. Import the repository into Render.
2. Use the provided `render.yaml` blueprint or create a Web Service with root directory `server`.
3. Build command:

```bash
npm install && npm run build
```

4. Start command:

```bash
npm run start
```

5. Configure:
   - `MONGO_URI`
   - `GEMINI_API_KEY`
   - `ALLOWED_ORIGIN`
   - `NODE_ENV=production`

#### Frontend — Vercel

1. Import the repository into Vercel.
2. Set root directory to `client`.
3. Build command:

```bash
npm run build
```

4. Output directory:

```text
dist
```

5. Configure:

```env
VITE_API_URL=https://your-render-backend.onrender.com/api/v1
```

`client/vercel.json` provides SPA route rewrites.

---

## Assignment Documentation Index

The repository contains the documentation requested by the CipherSchools assignment:

- [`RESEARCH_NOTE.md`](RESEARCH_NOTE.md) — Learner problem, existing approaches, research findings, product gaps, and product direction.

- [`DESIGN_NOTE.md`](DESIGN_NOTE.md) — MVP scope, user flow, domain model, architecture, evaluation approach, extensibility, trade-offs, and testing strategy.

- [`AI_USAGE.md`](AI_USAGE.md) — AI tools used, meaningful AI-assisted engineering decisions, AI limitations, review process, and future AI-evaluation improvements.

---

## Project Structure

```text
LLD_practice/
├── client/
│   ├── src/
│   ├── public/
│   └── vercel.json
│
├── server/
│   ├── src/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── controllers/
│   │   ├── infrastructure/
│   │   └── ...
│   ├── tests/
│   └── render.yaml
│
├── README.md
├── RESEARCH_NOTE.md
├── DESIGN_NOTE.md
└── AI_USAGE.md
```

---

## MVP Limitations

This is an assignment-focused MVP rather than a claim of fully production-scale infrastructure.

Current limitations include:

- AI evaluation is probabilistic.
- Fallback evaluation is intended to keep the prototype flow functional and is not a complete static-analysis engine.
- Evaluation currently uses asynchronous in-process execution rather than a distributed job queue.
- HTTP polling is used instead of WebSockets/SSE.
- The primary submission format is code/design text.
- Advanced progress analytics and human evaluation are not included.
- Additional deterministic design checks can be added in future iterations.

These trade-offs keep the implementation focused on the core learning loop:

> **Choose Problem → Think / Design → Submit → Feedback → Review → Try Again**

---

## License

MIT License. Built for the CipherSchools Engineering Hiring Assignment.
