# Design Note: LLD Practice Platform Architecture

**Author:** Candidate Submission  
**Assignment:** CipherSchools 2-Day Engineering Hiring Challenge  
**Architecture Style:** Domain-Driven Design (DDD) / Clean Hexagonal Architecture  

---

## 1. System Architecture Overview

The platform is designed following **Clean Architecture / Domain-Driven Design (DDD)** principles to guarantee separation of concerns, framework independence, and testability.

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (React 19 + Vite)                 │
│         - Problem Catalog  - Code Editor  - Rubric View     │
│         - Attempt History  - Error Banner - Polling Hook    │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST (JSON)
┌──────────────────────────────▼──────────────────────────────┐
│                    Express API Gateway                      │
│   - Helmet Security          - Rate Limiter (General/Eval)  │
│   - CORS Whitelist           - Zod Request Validation       │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                 Application & Use Cases Layer               │
│   - CreateAttempt            - SubmitSubmission             │
│   - EvaluateSubmission       - GetAttempt / GetAllAttempts  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                      Domain Entity Layer                    │
│   (Pure TypeScript, Zero Framework/DB Dependencies)         │
│   - Problem: Catalog entity with requirements & difficulty  │
│   - Attempt: State machine (IN_PROGRESS → SUBMITTED → EVAL) │
│   - Submission: State machine (DRAFT → SUBMITTED)           │
│   - Evaluation: Lifecycle (PENDING → IN_PROGRESS → COMPL)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌──────────────────────────────┐    ┌─────────────────────────┐
│   Infrastructure / Storage   │    │  Infrastructure / AI    │
│      MongoDB + Mongoose      │    │    Google Gemini 2.5    │
│  - MongoAttemptRepository    │    │ - GeminiEvaluationSvc   │
│  - MongoSubmissionRepository │    │ - MockEvaluatorFallback │
│  - MongoProblemRepository    │    └─────────────────────────┘
└──────────────────────────────┘
```

---

## 2. Domain Entities & State Machines

### 2.1 Attempt Lifecycle
```
 [ Creation ] ──► (IN_PROGRESS) ──submit()──► (SUBMITTED) ──completeEvaluation()──► (EVALUATED)
```
* **Invariants & Guards:**
  * Cannot call `submit()` on an attempt unless it is currently in `IN_PROGRESS`.
  * Cannot transition to `EVALUATED` unless the attempt was previously `SUBMITTED`.
  * `problemTitle` is immutably snapshotted at creation time to preserve historical context without joins.

### 2.2 Submission Lifecycle
```
 [ Creation ] ──► (DRAFT) ──updateSolution()──► (DRAFT) ──markSubmitted()──► (SUBMITTED) [Locked]
```
* **Invariants & Guards:**
  * Once `status === 'SUBMITTED'`, calls to `updateSolution()` throw an invariant violation error, preventing tampering after evaluation has been initiated.

### 2.3 Evaluation Lifecycle
```
 [ Creation ] ──► (PENDING) ──start()──► (IN_PROGRESS) ─┬─complete()─► (COMPLETED)
                                                        └─fail()─────► (FAILED)
```
* **Invariants & Guards:**
  * Evaluation is decoupled from the synchronous HTTP request cycle. It is assigned a unique ID in `PENDING` status, executes asynchronously, and transitions to either `COMPLETED` (with 4 rubric scores + feedback payload) or `FAILED` (with error message).

---

## 3. The AI Evaluation Pipeline

### Step 1: Request & Validation
1. Client issues `POST /api/v1/evaluations/start` with `{ submissionId: "..." }`.
2. Zod validation middleware verifies `submissionId` presence and format.
3. Evaluation record is initialized in `PENDING` state and persisted.
4. Server responds with `202 Accepted` + `{ evaluationId: "..." }`.

### Step 2: Asynchronous Execution
1. Background evaluation worker transitions status to `IN_PROGRESS`.
2. Gathers the problem description, requirements, and candidate's code.
3. Formulates the prompt with strict system instructions and structured JSON Schema:

```json
{
  "score": {
    "overall": 8,
    "requirements": 8,
    "design": 9,
    "extensibility": 7,
    "codeQuality": 8
  },
  "feedback": {
    "summary": "Concise architectural assessment",
    "strengths": ["Clear Separation of Concerns", "Correct use of Strategy Pattern"],
    "improvements": ["Missing thread-safety for spot reservation"],
    "recommendations": ["Introduce a ConcurrentHashMap or Mutex for slot allocation"]
  }
}
```

### Step 3: Resilient Fallback Engine
If Gemini encounters network timeouts, missing API credentials, or API quota limits (429):
* The system invokes `MockEvaluationService`.
* Analyzes candidate submission heuristics (class count, interface presence, methods).
* Generates a calibrated score and rubric breakdown, guaranteeing uninterrupted UX.

---

## 4. Security, Resilience & Production Hardening

1. **Helmet & Security Headers:** Enforces CSP, XSS protection, HSTS, and frameguard to protect against clickjacking.
2. **Layered Rate Limiting:**
   * **General Limiter:** 100 requests per 15 minutes per IP across all standard endpoints.
   * **Evaluation Limiter:** 10 requests per minute per IP specifically on evaluation endpoints to prevent LLM quota exhaustion and DDoS attacks.
3. **Strict Input Sanitization (Zod):**
   * Validates all incoming payloads before controllers execute. Rejects malformed requests with field-level 400 errors.
4. **Body Size Clamping:** Express parser clamped at `50kb` to prevent memory exhaustion attacks via massive payloads.
5. **CORS Isolation:** Only allows origins explicitly declared in `ALLOWED_ORIGIN` (defaulting to the frontend host).
6. **Graceful Shutdown:** `SIGTERM` and `SIGINT` hooks ensure active MongoDB connections and in-flight HTTP requests are gracefully flushed before exit.

---

## 5. Persistence & Schema Design

* **Collection `problems`:** Indexed on `_id`. Pre-seeded with production-grade LLD challenges (Parking Lot, Elevator System, Rate Limiter).
* **Collection `attempts`:** Indexed on `_id` and `{ startedAt: -1 }`. Contains `problemTitle` snapshot for sub-millisecond retrieval.
* **Collection `submissions`:** Indexed on `_id` and `attemptId`. Tracks `status` and immutable `submittedAt` timestamp.
* **Collection `evaluations`:** Indexed on `_id` and `submissionId`. Stores structured feedback and granular rubric scores.
