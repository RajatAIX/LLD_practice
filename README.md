# ⚡ LLD Practice Platform — AI-Powered Low-Level Design Judge

An end-to-end, production-grade Low-Level Design (LLD) practice platform built for software engineers. Practice architectural challenges (Parking Lot, Elevator System, Rate Limiter, etc.), write object-oriented designs, and receive real-time, rubric-based feedback powered by Google Gemini AI.

Submitted as part of the **CipherSchools 2-Day Engineering Hiring Assignment**.

---

## 🌟 Features

- 🎯 **Curated Problem Catalog:** Realistic engineering interview challenges complete with functional requirements, constraints, and difficulty tags.
- ⚡ **AI Architectural Judge:** Automated evaluation powered by Google Gemini 2.5 Flash evaluating 4 key dimensions:
  - **Requirements Coverage (0–10)**
  - **Design & Modeling (0–10)**
  - **Extensibility & Patterns (0–10)**
  - **Code Quality & Clean Architecture (0–10)**
- 🛡️ **Offline / Fallback Mode:** Seamless deterministic heuristic mock evaluator when Gemini API key is not supplied or when rate limits are reached.
- 📜 **Historical Tracking:** Inspect all previous attempts with problem snapshots, statuses, and timestamps.
- 🏗️ **Clean Architecture (DDD):** Pure TypeScript domain entities with decoupled use cases, repositories, and infrastructure adapters.
- 🔒 **Enterprise-Grade Hardening:** Zod payload validation, Helmet security headers, CORS origin isolation, and dual-layer rate limiting.
- 🧪 **Comprehensive Test Suite:** 24 automated Vitest unit & Supertest API tests covering domain state machines and edge cases.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Vanilla Modern CSS |
| **Backend** | Node.js (v20+), Express 4, TypeScript 5, Mongoose 8 |
| **Database** | MongoDB (Local or MongoDB Atlas M0 Free Tier) |
| **AI Evaluation** | Google Gemini 2.5 Flash (`@google/genai`) with Mock Fallback |
| **Validation & Security** | Zod, Helmet, Express Rate Limit, CORS |
| **Testing** | Vitest 5, Supertest |
| **Deployment** | Docker (Multi-stage build), Render (`render.yaml`), Vercel (`vercel.json`) |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js**: v20 or higher (`node -v`)
- **MongoDB**: Running locally on `mongodb://localhost:27017` **or** a free [MongoDB Atlas](https://cloud.mongodb.com) connection string.

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
GEMINI_API_KEY=your_gemini_api_key_here # Optional: Platform uses Mock Evaluator if left blank
ALLOWED_ORIGIN=http://localhost:5173
```

Install dependencies and start the backend:
```bash
npm install
npm run dev
# Server runs on http://localhost:5000
```
> **Note:** On first startup, the server automatically seeds the database with initial LLD problems if empty!

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
# Client runs on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Running Automated Tests

Run the test suite across domain state machines and API endpoints:

```bash
cd server
npm test
```

### Test Coverage Summary:
- **`Attempt.test.ts`**: Verifies entity creation, `IN_PROGRESS` → `SUBMITTED` → `EVALUATED` state transitions, illegal transition guards, and JSON serialization.
- **`Submission.test.ts`**: Verifies draft mutations, `DRAFT` → `SUBMITTED` lock, mutation rejection after submission, and duplicate submission guards.
- **`Evaluation.test.ts`**: Verifies evaluation lifecycle (`PENDING` → `IN_PROGRESS` → `COMPLETED` / `FAILED`), score assignment, and feedback payload mapping.
- **`CreateAttempt.test.ts`**: Tests use case logic with mock repositories, asserting problem existence checks and title snapshotting.
- **`api.test.ts`**: Supertest integration tests verifying `GET /health` (200), unknown routes (404), and Zod validation failure rejections (400).

---

## 📡 API Reference

All application endpoints are prefixed with `/api/v1`.

### Health Check
- `GET /health`: Server status, environment, and server timestamp.

### Problems
- `GET /api/v1/problems`: List all available LLD problems.
- `GET /api/v1/problems/:id`: Fetch a single problem with detailed requirements.
- `POST /api/v1/problems`: Create a problem (validated via Zod).

### Attempts
- `POST /api/v1/attempts`: Start an attempt `{ "problemId": "..." }`. Snapshots `problemTitle`.
- `GET /api/v1/attempts`: Retrieve all user attempts (sorted newest first).
- `GET /api/v1/attempts/:id`: Retrieve attempt by ID.
- `POST /api/v1/attempts/:id/submit`: Mark attempt as submitted.

### Submissions
- `POST /api/v1/submissions`: Create or save a draft submission `{ "attemptId": "...", "solution": "..." }`.
- `PUT /api/v1/submissions/:id`: Update solution code for an active draft.
- `POST /api/v1/submissions/:id/submit`: Lock submission into `SUBMITTED` state.

### Evaluations
- `POST /api/v1/evaluations/start`: Initiate evaluation `{ "submissionId": "..." }` (Returns 202 with `evaluationId`).
- `GET /api/v1/evaluations/:id`: Poll evaluation status (`PENDING` | `IN_PROGRESS` | `COMPLETED` | `FAILED`).
- `GET /api/v1/evaluations/submission/:submissionId`: Lookup evaluation result by submission ID.

---

## 🚢 Production Deployment

### Option 1: Docker (Single Container)
Build and run the production image:
```bash
cd server
docker build -t lld-practice-server .
docker run -p 5000:5000 \
  -e MONGO_URI="mongodb+srv://..." \
  -e GEMINI_API_KEY="..." \
  -e ALLOWED_ORIGIN="https://your-frontend.vercel.app" \
  lld-practice-server
```

### Option 2: Render (Backend) + Vercel (Frontend)
1. **Backend (Render):**
   - Import repository on [Render](https://render.com).
   - Use the provided `render.yaml` blueprint or choose **Web Service** with root directory `server`.
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Add environment variables: `MONGO_URI`, `GEMINI_API_KEY`, `ALLOWED_ORIGIN`, `NODE_ENV=production`.
2. **Frontend (Vercel):**
   - Import repository on [Vercel](https://vercel.com).
   - Root directory: `client`.
   - Build Command: `npm run build` (output: `dist`).
   - Environment Variable: `VITE_API_URL=https://your-render-backend.onrender.com/api/v1`.
   - `client/vercel.json` provides automated SPA route rewrites.

---

## 📑 Assignment Documentation Index

- 📘 [Research Note (`RESEARCH_NOTE.md`)](RESEARCH_NOTE.md): In-depth analysis of the learner problem, technical approaches surveyed, market gaps, and architectural tradeoffs.
- 📐 [Design Note (`DESIGN_NOTE.md`)](DESIGN_NOTE.md): Detailed architectural design, DDD domain entity models, evaluation pipeline mechanics, and security controls.
- 🤖 [AI Usage Report (`AI_USAGE.md`)](AI_USAGE.md): Transparent declaration of AI tooling, prompting strategies, hallucination fixes, and human engineering judgements.

---

## 📄 License
MIT License. Built for CipherSchools Engineering Hiring Assignment.
