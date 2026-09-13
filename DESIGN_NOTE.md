# Design Note: LLD Practice Platform

## 1. MVP Goal

The goal of the MVP is to provide a focused Low-Level Design practice loop:

> **Choose Problem → Think / Design → Submit → Feedback → Review → Try Again**

The product should help a learner practice LLD problems and understand *why* a design is strong or weak, rather than only providing a reference solution.

The MVP intentionally focuses on a small end-to-end workflow instead of introducing unnecessary infrastructure.

---

## 2. MVP Scope

### In Scope

- Problem catalog
- Problem statement and requirements
- Attempt creation
- Code/design submission
- Asynchronous evaluation
- Rubric-based feedback
- Criterion-level evidence and suggestions
- Attempt history
- Review of previous evaluations
- Retry / new attempts

### Out of Scope for MVP

- Real-time collaborative editing
- WebSocket-based evaluation updates
- Distributed job queues
- Microservices
- Human review workflows
- Advanced analytics
- Full UML editor
- Multi-language compilation infrastructure

These can be added later if product usage demonstrates a need for them.

---

## 3. User Flow

```text
┌──────────────────┐
│  Problem Catalog │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ Select a Problem │
└────────┬─────────┘
         ↓
┌─────────────────────────┐
│ Read Requirements       │
│ Think / Design          │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│ Submit Attempt          │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│ Evaluation: PENDING     │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│ Evaluation: IN_PROGRESS │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│ Feedback + Score        │
│ Evidence + Suggestions  │
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│ Attempt History         │
└───────────┬─────────────┘
            ↓
       Try Again
```

The evaluation is asynchronous so the initial submission request does not have to wait for the LLM evaluation to finish.

---

## 4. Domain Model

The core domain is separated into the following entities and abstractions:

```text
Problem
   │
   ├───────────────┐
   │               │
   ↓               ↓
Attempt        Rubric
   │
   ↓
Submission
   │
   ↓
Evaluation
   │
   ↓
Feedback
```

### Problem

Represents an LLD challenge.

Important information includes:

- title
- description
- requirements
- difficulty

**Responsibility:** provide the design problem and its requirements.

---

### Attempt

Represents one learner attempt for a particular problem.

The attempt tracks its lifecycle:

```text
IN_PROGRESS
     ↓
 SUBMITTED
     ↓
 EVALUATED
```

**Responsibility:**

- associate a learner attempt with a problem,
- maintain attempt state,
- record the submission,
- transition the attempt through its lifecycle,
- retain problem context needed for historical display.

---

### Submission

Represents the learner's submitted solution/design.

Lifecycle:

```text
DRAFT
  ↓
SUBMITTED
```

**Responsibility:**

- hold submitted content,
- maintain submission state,
- prevent invalid state transitions.

---

### Evaluation

Represents the evaluation process and result.

Lifecycle:

```text
PENDING
   ↓
IN_PROGRESS
   ↓
COMPLETED

IN_PROGRESS
   ↓
FAILED
```

**Responsibility:**

- track evaluation status,
- retain the resulting score/feedback,
- expose whether evaluation completed successfully.

---

### Feedback

Represents learner-facing evaluation feedback.

It contains:

- summary
- strengths
- improvements
- recommendations
- criterion-level feedback

Each criterion-level feedback item contains:

```text
criterion
score
evidence[]
concern
suggestion
confidence
```

This structure keeps the evaluation actionable instead of reducing it to a single score.

---

### Rubric

Defines the criteria used by the evaluator.

The initial rubric focuses on:

1. Requirement Understanding
2. Class Responsibilities
3. Encapsulation / Interfaces
4. Abstraction / Design Patterns

A rubric is kept separate from the evaluator so evaluation rules can evolve independently from the practice flow.

---

## 5. Important Interfaces

### Evaluator

The evaluator abstraction separates the practice workflow from the evaluation implementation.

Conceptually:

```ts
interface Evaluator {
  evaluate(
    submission: Submission,
    problem: Problem,
    rubric: Rubric
  ): Promise<Evaluation>;
}
```

The evaluator receives the **actual problem context**, the learner submission, and the rubric. This is important because LLD quality must be evaluated against the requirements of the selected problem.

The current implementation uses a Gemini-based evaluator.

A future implementation could add another evaluator without changing the core submission flow.

---

### Repository Abstractions

The domain/application layer uses repository interfaces rather than depending directly on MongoDB.

Examples include:

```text
ProblemRepository
AttemptRepository
SubmissionRepository
EvaluationRepository
```

This reduces coupling between the application logic and persistence implementation.

The infrastructure layer provides MongoDB-backed implementations.

---

## 6. Layered Architecture

The application follows a lightweight Clean Architecture / domain-oriented structure.

```text
┌──────────────────────────────────────┐
│              Frontend                │
│          React + TypeScript          │
└──────────────────┬───────────────────┘
                   │ HTTP
                   ↓
┌──────────────────────────────────────┐
│          API / Controllers            │
│              Express                 │
└──────────────────┬───────────────────┘
                   ↓
┌──────────────────────────────────────┐
│       Application / Use Cases         │
│   Submission • Attempts • Evaluation  │
└──────────────────┬───────────────────┘
                   ↓
┌──────────────────────────────────────┐
│              Domain                  │
│ Problem • Attempt • Submission       │
│ Evaluation • Feedback • Rubric       │
│ Evaluator / Repository Interfaces     │
└───────────────┬───────────────┬──────┘
                │               │
                ↓               ↓
┌──────────────────────┐  ┌──────────────────────┐
│ MongoDB Repositories │  │   Gemini Evaluator   │
└──────────────────────┘  └──────────────────────┘
```

### Why this separation?

The main reason is **change isolation**.

For example:

- MongoDB can be replaced without rewriting domain entities.
- The evaluator can be replaced without rewriting the submission workflow.
- API controllers do not need to contain domain rules.
- The frontend communicates through API contracts rather than directly with persistence.

The architecture is intentionally kept within one application rather than splitting the MVP into microservices.

---

## 7. State Transitions

### Attempt

```text
IN_PROGRESS
     │
     │ submit
     ↓
SUBMITTED
     │
     │ evaluation completes
     ↓
EVALUATED
```

Invalid transitions should be rejected rather than silently changing state.

---

### Submission

```text
DRAFT
  │
  │ submit
  ↓
SUBMITTED
```

Once submitted, the submission should not behave like an editable draft.

---

### Evaluation

```text
PENDING
   │
   │ start
   ↓
IN_PROGRESS
   │
   ├──────────────→ COMPLETED
   │
   └──────────────→ FAILED
```

The explicit states allow the frontend to represent the evaluation lifecycle clearly.

---

## 8. Evaluation Approach

The evaluation pipeline is:

```text
Learner Submission
       +
Selected Problem
       +
Evaluation Rubric
       ↓
  Gemini Evaluator
       ↓
Structured Feedback
       ↓
Evaluation Result
       ↓
Frontend
```

The evaluator is instructed to assess the learner's design against the actual problem requirements and rubric rather than assuming a single reference implementation is the only valid solution.

### Feedback model

For each criterion:

```text
Criterion
   ↓
Score
   ↓
Evidence
   ↓
Concern
   ↓
Suggestion
   ↓
Confidence
```

This is more useful than returning only an overall score because the learner can connect the evaluation to concrete parts of the submitted design.

---

## 9. Evaluation Reliability Strategy

The product separates evaluation from submission persistence.

The intended flow is:

```text
1. Validate request
2. Create / persist submission
3. Create evaluation record
4. Return evaluation identifier
5. Run evaluation asynchronously
6. Update evaluation state
7. Store result
8. Frontend polls evaluation status
```

This means a slow or temporarily unavailable evaluator does not erase the learner's submission.

The MVP uses asynchronous in-process execution. A queue and worker architecture can be introduced later if evaluation volume requires it.

---

## 10. Extensibility

### Additional evaluator implementations

Because evaluation is behind the `Evaluator` abstraction, the system can evolve toward:

```text
             ┌── GeminiEvaluator
Evaluator ───┼── RuleBasedEvaluator
             ├── HumanEvaluator
             └── HybridEvaluator
```

The practice workflow does not need to know which evaluator implementation is being used.

### Additional submission formats

The current MVP focuses on code/design submissions.

A future version can support:

```text
Code
Text Explanation
UML / Class Diagram
Combined Submission
```

The application flow can remain:

```text
Submission → Evaluation → Feedback
```

while the submission representation becomes richer.

### Additional rubrics

New criteria can be added without changing the fundamental attempt flow:

```text
Requirement Understanding
Class Responsibilities
Encapsulation / Interfaces
Abstraction / Patterns
Coupling / Cohesion
Extensibility
Edge Cases
Trade-offs
```

---

## 11. Key Trade-offs

### Simple in-process async execution vs job queue

**Chosen:** in-process asynchronous execution for the MVP.

**Why:** the assignment requires a demonstrable prototype, not production-scale distributed infrastructure.

**Trade-off:** if the process restarts, in-flight work may be interrupted. A persistent queue/worker system would improve reliability at larger scale.

---

### Polling vs WebSockets

**Chosen:** HTTP polling.

**Why:** evaluation status changes are infrequent, implementation is simple, and polling is sufficient for the MVP.

**Trade-off:** polling creates repeated requests. WebSockets or Server-Sent Events could provide more immediate updates later.

---

### LLM evaluation vs deterministic-only evaluation

**Chosen:** LLM-based qualitative evaluation with a structured rubric.

**Why:** design quality involves qualitative concepts such as responsibilities, abstraction, and interfaces that are difficult to judge using only deterministic rules.

**Trade-off:** LLM output is probabilistic and can contain incorrect judgments. Structured output, rubric constraints, evidence requirements, and future deterministic checks can reduce this risk.

---

### Monolith vs microservices

**Chosen:** modular monolith.

**Why:** the product is small and the assignment is time-constrained. Separating services would add operational complexity without improving the core learner experience.

---

### Snapshotting attempt context

The attempt stores problem information needed to preserve historical context.

**Why:** historical attempts should remain understandable even if problem metadata changes.

**Trade-off:** snapshots can duplicate data. A future immutable problem-version model could provide stronger consistency.

---

## 12. Testing / Evaluation Strategy

Important behaviour should be tested at multiple levels.

### Domain tests

Test state transitions such as:

- valid attempt submission,
- invalid attempt transition,
- valid submission transition,
- invalid submission transition,
- evaluation completion/failure.

### Application/API tests

Test:

- validation failures,
- missing resources,
- invalid IDs,
- successful submission,
- evaluation lifecycle,
- error handling.

### Evaluation tests

The evaluator integration should be tested for:

- valid structured output,
- malformed model output,
- missing optional feedback fields,
- score normalization,
- evaluator failure/fallback behaviour.

The goal is not to test every possible LLM response but to ensure that unexpected responses do not break the application contract.

---

## 13. Security and Reliability Considerations

The MVP should:

- validate incoming request bodies,
- validate environment variables,
- avoid exposing API secrets to the frontend,
- restrict CORS to trusted frontend origins,
- avoid persisting unnecessary sensitive learner data,
- handle evaluator failures without losing submissions,
- reject invalid state transitions.

Further production hardening would include stronger authentication, authorization, rate limiting, abuse protection, and audit logging.

---

## 14. Success Criteria for the MVP

The prototype is successful if a learner can complete the entire loop without manual intervention:

```text
Select a real LLD problem
        ↓
Read requirements
        ↓
Submit a design
        ↓
Receive evaluation
        ↓
See actionable feedback
        ↓
Review previous attempt
        ↓
Make another attempt
```

The key product metric is therefore not the number of UI features. It is whether the platform enables a **repeatable, feedback-driven LLD learning loop**.

---

## 15. Current Limitations

The MVP intentionally leaves several production-level concerns for later:

- evaluation is not backed by a distributed queue,
- AI evaluation remains probabilistic,
- the current submission format is primarily code/design text,
- advanced analytics are not implemented,
- human review is not implemented,
- evaluator idempotency and duplicate-processing protections can be strengthened,
- deterministic design-smell analysis can be expanded.

These are conscious MVP trade-offs rather than reasons to introduce unnecessary complexity before validating the core workflow.
