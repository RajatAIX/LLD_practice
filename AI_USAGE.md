# AI Usage: LLD Practice Platform

## 1. Purpose of AI Usage

AI was used as a development assistant during the implementation of the LLD Practice Platform.

The purpose was not to replace engineering decisions. AI was used to accelerate research, implementation, debugging, code review, documentation, and evaluation-design work while the final architecture and changes were reviewed and integrated into the project.

---

## 2. AI Tools Used

### ChatGPT

Used as a software-engineering assistant for:

- understanding the assignment requirements,
- reviewing the existing architecture,
- identifying gaps against the rubric,
- proposing domain abstractions,
- reviewing TypeScript/Express code,
- debugging implementation issues,
- improving evaluation feedback structure,
- drafting research/design documentation,
- checking edge cases and test coverage.

### Gemini

Used as the LLM evaluation engine inside the application.

Gemini receives:

- the selected LLD problem,
- problem description and requirements,
- learner submission,
- evaluation rubric.

It returns structured evaluation information that is converted into learner-facing feedback.

---

## 3. Meaningful AI-Assisted Engineering Decisions

### Decision 1 — Pass problem context to the evaluator

An important issue identified during review was that an evaluator receiving only the learner submission and rubric cannot reliably determine whether the learner satisfied the requirements of the selected problem.

The evaluator interface was therefore changed conceptually from:

```text
Submission + Rubric
```

to:

```text
Submission + Problem + Rubric
```

This allows the evaluator to reason about the actual requirements instead of judging the submission in isolation.

**Engineering decision:** Problem context is an explicit evaluator dependency.

---

### Decision 2 — Use structured criterion-level feedback

A simple AI response containing only:

```text
summary
strengths
improvements
recommendations
```

is not enough for an LLD learning product.

The feedback model was extended with criterion-level analysis:

```text
criterion
score
evidence[]
concern
suggestion
confidence
```

This makes the feedback explainable and gives the learner a concrete reason and next action for each rubric criterion.

**Engineering decision:** AI output is treated as a structured application contract rather than arbitrary prose.

---

### Decision 3 — Evaluate against requirements instead of a single reference solution

The evaluator prompt explicitly instructs the model not to assume that one reference implementation is the only valid solution.

This matters because LLD problems can have multiple valid designs.

The evaluator should instead ask:

```text
Does the submission satisfy the stated requirements?
Are responsibilities reasonable?
Are abstractions justified?
Are interfaces and encapsulation appropriate?
```

**Engineering decision:** Evaluate design quality relative to requirements and rubric, not code similarity.

---

### Decision 4 — Keep evaluation asynchronous

AI evaluation can take longer and can fail independently of the submission request.

The implementation therefore separates submission persistence from evaluation processing:

```text
Submit
  ↓
Persist Submission
  ↓
Create Evaluation
  ↓
Return Evaluation ID
  ↓
Run Evaluation Asynchronously
  ↓
Poll Evaluation Status
```

The MVP uses asynchronous in-process execution rather than introducing a distributed queue.

**Engineering decision:** Preserve a responsive submission flow without overengineering the prototype.

---

### Decision 5 — Keep evaluator behind an abstraction

The application uses an `Evaluator` interface instead of coupling the practice workflow directly to Gemini.

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

This allows the implementation to evolve toward:

```text
GeminiEvaluator
RuleBasedEvaluator
HumanEvaluator
HybridEvaluator
```

without rewriting the core practice workflow.

**Engineering decision:** AI provider selection is an infrastructure concern, not a domain concern.

---

## 4. AI-Assisted Debugging and Review

AI was also used as a reviewer to identify implementation inconsistencies and edge cases.

Examples of issues identified during review included:

### Route and API behaviour

Review was used to check route ordering and API behaviour so that generic/wildcard routes would not unintentionally interfere with more specific routes.

### Submission validation

The review identified that frontend validation alone was insufficient. Backend validation should also reject invalid/empty submissions because the backend is the authoritative API boundary.

### State transitions

The domain state machines were reviewed to ensure invalid transitions are rejected instead of silently changing state.

Examples:

```text
Attempt:
IN_PROGRESS → SUBMITTED → EVALUATED

Submission:
DRAFT → SUBMITTED

Evaluation:
PENDING → IN_PROGRESS → COMPLETED / FAILED
```

### Historical context

Review identified the importance of preserving problem context for an attempt so that historical results remain understandable if problem metadata changes.

### Failure handling

The evaluation flow was reviewed so that an evaluator failure does not erase the learner's submitted work.

---

## 5. AI Usage in Documentation and Research

AI was used to structure and refine:

- `RESEARCH_NOTE.md`
- `DESIGN_NOTE.md`
- `AI_USAGE.md`
- project documentation

The research note was organized around:

```text
Learner Problem
→ Existing Approaches
→ Key Gaps
→ Product Direction
→ Trade-offs
→ Future Improvements
```

AI was used to help organize these findings, but the final product direction was based on the assignment requirements and the project's actual implementation.

---

## 6. What AI Did Not Decide

The following were treated as engineering/product decisions rather than blindly accepting AI output:

- choosing a modular monolith instead of microservices,
- choosing polling instead of WebSockets,
- choosing asynchronous in-process evaluation for the MVP,
- defining the core domain entities,
- deciding the initial rubric,
- deciding that submission persistence should happen before evaluation,
- deciding the MVP scope,
- deciding which production-level features to postpone.

AI suggestions were reviewed against the assignment constraints, implementation complexity, and the actual learner workflow.

---

## 7. AI Failure / Hallucination Handling

AI-generated suggestions were not assumed to be correct.

During development/review, proposed changes were checked against the actual codebase and build/test results.

Examples of corrections made during review included:

- avoiding assumptions that a generic evaluator automatically knows problem requirements,
- distinguishing asynchronous in-process execution from a true background worker/queue,
- checking documentation claims against the actual implementation,
- avoiding unnecessary architecture such as microservices for the MVP,
- recognizing that an AI-generated score without evidence is weak feedback.

This review process was important because an AI assistant can produce technically plausible but contextually incorrect recommendations.

---

## 8. Limitations of AI Evaluation

The Gemini evaluator is probabilistic. It can:

- misunderstand a learner's design,
- miss an important requirement,
- overestimate or underestimate a design decision,
- produce inconsistent scores,
- generate incorrect recommendations.

Therefore, the evaluation should be treated as **AI-assisted feedback**, not an authoritative truth.

The structured rubric and evidence requirements reduce ambiguity but do not eliminate model error.

---

## 9. Planned Improvements to AI Evaluation

A future version can combine deterministic and AI evaluation:

```text
                Submission
                    │
          ┌─────────┴─────────┐
          ↓                   ↓
 Deterministic Checks     LLM Evaluation
          │                   │
          └─────────┬─────────┘
                    ↓
              Final Feedback
```

Deterministic checks can handle objective behaviour such as:

- required fields,
- compilation,
- tests,
- obvious business-rule violations,
- state-transition validity.

The LLM can focus on qualitative dimensions such as:

- responsibility allocation,
- coupling/cohesion,
- abstraction quality,
- SOLID reasoning,
- design trade-offs,
- extensibility.

A future human-review path could also be added for high-value or disputed evaluations.

---

## 10. AI Usage Principle

The guiding principle was:

> **Use AI to accelerate engineering work, but keep architecture, validation, and final decisions under explicit engineering control.**

For this project, the most meaningful use of AI is not merely generating code. It is using AI to improve the evaluation loop itself while keeping the evaluator bounded by real problem context, a defined rubric, structured output, and persistent attempt history.
