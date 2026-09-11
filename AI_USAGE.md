# AI Usage & Attribution Report

**Project:** LLD Practice Platform  
**Candidate Submission:** CipherSchools 2-Day Engineering Hiring Assignment  
**Date:** September 2026  

---

## 1. Overview & Tooling

In accordance with the assignment guidelines, this document transparently details how artificial intelligence tools were employed during the design, development, and debugging phases of this project.

### Tools Used
1. **Google Antigravity IDE (Gemini / Claude Agents):** Used as an intelligent pair-programmer for architectural scaffolding, refactoring, boilerplate generation, and initial test setup.
2. **Google Gemini 2.5 Flash (`@google/genai`):** Used inside the platform itself as the automated evaluation engine for grading Low-Level Design submissions against rubrics.

---

## 2. Where AI Was Used & Prompting Strategy

### A. Architectural & Domain Modeling
* **Intent:** Implement Domain-Driven Design (DDD) with clean separation between Domain entities, Use Cases, Repository interfaces, and Infrastructure adapters.
* **Prompt Strategy:** Outlined strict bounded contexts: Problem, Attempt, Submission, and Evaluation. Requested pure TypeScript classes for Domain models with zero database or framework dependencies to ensure testability.
* **Human Validation & Refactoring:**
  * AI initially missed state machine constraints on `Submission` (it did not track `status` and `markSubmitted()` was a stub).
  * We added explicit status types (`DRAFT`, `SUBMITTED`), guard clauses against invalid state transitions, and `toJSON()` serialization methods.

### B. LLM Evaluation Pipeline & Prompt Engineering
* **Intent:** Have Gemini act as a Principal Software Engineer evaluating candidates' LLD submissions against a strict 4-dimensional rubric (Requirements, Design, Extensibility, Code Quality) and producing structured JSON.
* **Prompt Strategy:**
  * System prompt defined the persona: "You are a Principal Software Engineer and Staff System Architect conducting a strict Low-Level Design (LLD) technical interview."
  * Provided a rigid JSON Schema with typed fields: `score` (0-10 integer per dimension + overall), `feedback` (`summary`, `strengths`, `improvements`, `recommendations`).
  * Used JSON-mode enforcement (`responseMimeType: "application/json"`) to prevent markdown chatter.
* **Fallback Strategy:**
  * Implemented a deterministic Mock Evaluator fallback in `GeminiEvaluationService.ts` when `GEMINI_API_KEY` is not provided or rate limits are exceeded, ensuring the platform works out of the box in offline/evaluation environments.

### C. Testing & Edge Cases
* **Intent:** Achieve comprehensive test coverage for domain rules and validation endpoints.
* **Prompt Strategy:** Prompted for Vitest unit tests covering valid state transitions, illegal transitions throwing errors, and Supertest API tests for request validation.
* **Human Validation:**
  * Hand-verified mock repositories for `CreateAttempt` use cases.
  * Verified rate limiter middleware behavior and Zod issue reporting.

---

## 3. Where AI Failed or Hallucinated (And How It Was Fixed)

1. **Express Route Ordering Wildcard Collision:**
   * *Issue:* The route `GET /evaluations/submission/:submissionId` was placed after `GET /evaluations/:id`. In Express, `/:id` matches all single segment paths, swallowing the `/submission` route and treating `"submission"` as the `id` parameter.
   * *Correction:* Reordered specific sub-routes before wildcard parameter routes.

2. **Dead Rate Limiter Placement:**
   * *Issue:* `app.use("/api/v1/evaluations", evaluationLimiter)` was mounted *after* `app.use("/api/v1", routes)` in `app.ts`. Because Express evaluates middleware top-down, the rate limiter never executed for evaluation requests.
   * *Correction:* Mounted the rate limiter before the routes barrel mount.

3. **No-op Stubs:**
   * *Issue:* The initial prototype had `SubmissionController.markSubmitted` returning `{ success: true, message: "ok" }` without updating any database document or checking entity state.
   * *Correction:* Built proper `SubmitSubmission` usecase and repository methods that validate the transition and update MongoDB.

4. **Missing Entity Snapshots for Fast Rendering:**
   * *Issue:* The History view in the UI only received `problemId` without `problemTitle`, requiring N+1 network lookups or empty headers.
   * *Correction:* Refactored `Attempt` entity to snapshot `problemTitle` at creation time, ensuring instantaneous history retrieval without relational joins.

---

## 4. Key Takeaways

AI proved extraordinarily effective for accelerating repetitive boilerplate, drafting domain schemas, and providing baseline CSS styling. However, **critical engineering decisions**—such as transaction integrity, state machine guards, route precedence, middleware ordering, and defensive fallbacks—required rigorous human oversight and architectural verification.
