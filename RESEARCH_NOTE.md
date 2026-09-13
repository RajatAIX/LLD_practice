# Research Note: AI-Powered Low-Level Design Practice

## 1. Learner Problem

Low-Level Design (LLD) interviews require a learner to convert an open-ended product requirement into a maintainable object-oriented design. The learner is expected to identify requirements, define classes and responsibilities, model relationships, apply principles such as SOLID, choose appropriate abstractions, and explain trade-offs.

The main difficulty is not the absence of LLD material. There are many problem repositories, design-pattern references, courses, and interview-preparation platforms. The larger gap is the **practice feedback loop**:

> **Choose a problem → Understand requirements → Design → Submit → Receive useful feedback → Review → Try again**

Traditional LLD preparation often stops at reading a solution or comparing the learner's design with an example. That makes it difficult for a learner to answer questions such as:

- Did I identify all important requirements?
- Are my classes responsible for the right things?
- Is my design unnecessarily coupled?
- Did I use abstraction where it actually helps?
- Which design decision is weak, and why?
- What should I change in my next attempt?

A useful practice product therefore needs to evaluate not only whether code exists, but also whether the submitted design addresses the stated requirements and demonstrates sound object-oriented design reasoning.

---

## 2. Existing Approaches and What They Offer

### 2.1 HackerRank — Structured Technical Practice and AI Mock Interviews

HackerRank provides structured coding practice and, more recently, AI-powered mock interviews. Its current mock-interview offering includes system-design practice, AI-driven feedback, and follow-up discussion. Its system-design experience also supports a whiteboard-oriented workflow for visualizing architecture and explaining decisions.

**Observation:** HackerRank demonstrates the value of combining a realistic practice environment with feedback. However, its broader interview platform is designed around multiple interview categories rather than a focused, repeatable LLD design-review loop.

Source: HackerRank AI-powered mock interviews and System Design Mock Interview documentation.

### 2.2 Educative — Guided LLD/OOD Learning

Educative's Low-Level Design/OOD material focuses on object-oriented design principles, patterns, and real-world interview problems. The approach is strong for structured learning: concepts are introduced and then applied to interview-style problems.

**Observation:** Guided content is useful for learning concepts, but a practice platform can add value by making the learner's own submission the primary artifact and generating feedback against an explicit rubric.

### 2.3 Open-Source LLD Repositories — Large Problem and Pattern Libraries

Several GitHub repositories provide hands-on LLD resources. For example, the `Devaraj-Umapathi/Low-Level-Design` repository organizes UML/class-diagram material, SOLID principles, design patterns, and complete problems such as Parking Lot, Vending Machine, Rate Limiter, and Meeting Scheduler.

Other repositories similarly focus on design-pattern implementations and collections of LLD interview questions.

**Observation:** These repositories are valuable as reference libraries, but they generally emphasize **learning material and example implementations** rather than an interactive submission → evaluation → history → retry workflow.

### 2.4 LLD Arena — Focused LLD Practice

The open-source `lld-arena` project is particularly relevant because it is explicitly positioned as an LLD practice platform. It combines LLD problems, an in-browser editor, compilation, hidden tests, UML diagrams, progression, and AI-graded design reports.

**Observation:** This validates the direction of combining LLD problems with executable practice and automated design feedback. It also highlights an important product challenge: evaluation needs to consider design quality, not merely whether code executes.

---

## 3. Key Gaps Identified

### Gap 1 — LLD lacks a standardized automated feedback loop

Coding platforms can rely heavily on deterministic test cases. LLD is different: two implementations can both work while having very different levels of cohesion, coupling, extensibility, and abstraction quality.

Therefore, an LLD evaluator needs a combination of:

- deterministic checks where possible,
- explicit rubric criteria,
- evidence from the learner's submission,
- and qualitative evaluation for design reasoning.

### Gap 2 — Generic AI chat is not enough

A learner can ask an LLM:

> "Review my Parking Lot design."

The response may be useful, but a generic chat does not necessarily preserve a consistent rubric, problem context, attempt history, or progression model.

A dedicated practice platform can provide the missing structure:

1. Store the problem and requirements.
2. Store the learner's submission.
3. Evaluate against a fixed rubric.
4. Return criterion-level feedback.
5. Preserve the attempt.
6. Let the learner retry and compare progress.

### Gap 3 — Reference solutions can encourage copying instead of reasoning

Public LLD repositories are excellent for studying patterns and examples, but showing the complete solution too early can reduce the value of deliberate design practice.

The platform should therefore make the learner submit a design first and use references primarily as learning support after the attempt.

### Gap 4 — Feedback must point to evidence

A score such as `7/10 for SOLID` is not sufficiently actionable.

Useful feedback should follow a structure such as:

> **Criterion → Score → Evidence → Concern → Suggestion → Confidence**

This makes the evaluation explainable and gives the learner a concrete next action.

### Gap 5 — Progress is difficult to observe without attempt history

LLD improvement is iterative. A learner may produce a weak first design, understand the feedback, and produce a substantially better second design.

Therefore, attempts should be persistent and associated with:

- the problem,
- submission,
- evaluation,
- score,
- criterion-level feedback,
- and attempt status.

This creates a measurable learning loop instead of a one-time AI response.

---

## 4. Product Direction

The proposed product is a focused **LLD Practice Platform** built around the following loop:

```text
Choose Problem
      ↓
Read Requirements
      ↓
Think / Design
      ↓
Submit
      ↓
Evaluate
      ↓
Criterion-level Feedback
      ↓
Review Attempt History
      ↓
Try Again
```

### MVP capabilities

The MVP focuses on the smallest complete learning loop:

- Browse a catalog of LLD problems.
- Read the problem statement and requirements.
- Write a design/code submission.
- Submit an attempt.
- Evaluate the submission asynchronously.
- Display an overall score and structured feedback.
- Show criterion-level evidence, concerns, suggestions, and confidence.
- Preserve attempt history.
- Allow the learner to review previous attempts.

The current prototype uses an LLM evaluator with a structured rubric while retaining a fallback evaluator so the product can still demonstrate the end-to-end flow when an external model is unavailable.

---

## 5. Evaluation Direction

The evaluation should not behave like an unconstrained "AI score."

A rubric-based approach makes the evaluator more predictable and easier to evolve. The initial rubric focuses on four areas:

1. **Requirement Understanding**
2. **Class Responsibilities**
3. **Encapsulation / Interfaces**
4. **Abstraction / Design Patterns**

The evaluator receives the actual problem context, including the problem description and requirements, together with the learner's submission and rubric.

For each criterion, the desired feedback structure is:

- **Criterion**
- **Score**
- **Evidence**
- **Concern**
- **Suggestion**
- **Confidence**

This allows the learner to understand *why* a score was given rather than receiving only a numerical result.

---

## 6. Important Product and Architecture Trade-offs

### Asynchronous evaluation vs synchronous evaluation

**Chosen:** asynchronous evaluation with polling.

LLM evaluation can take longer than a normal API request and can fail independently. Returning an evaluation ID allows the submission to be stored first and the evaluation state to move through:

```text
PENDING → IN_PROGRESS → COMPLETED
                       ↘ FAILED
```

For the MVP, in-process asynchronous execution is sufficient. A queue/worker system would be an appropriate later evolution if evaluation volume increases.

### Problem snapshot vs repeated problem lookup

The attempt stores a snapshot of the problem title. This keeps historical attempts understandable even if problem metadata changes later.

A richer future version could snapshot the full problem version or use immutable problem versions.

### Structured LLM output vs free-form text

**Chosen:** structured JSON-like evaluator output.

Structured output makes it possible for the frontend to render criterion-level feedback consistently and makes future analytics easier.

The trade-off is that parsing and validation become necessary, and the system still needs to handle malformed or incomplete model responses.

### LLM evaluator vs deterministic-only evaluator

LLMs are useful for evaluating qualitative design decisions such as cohesion, abstraction, and trade-offs. Deterministic checks are better for objective rules.

The intended long-term direction is therefore hybrid:

```text
Deterministic Checks
        +
Rubric-Based LLM Evaluation
        +
Optional Human Review
```

---

## 7. Limitations and Future Improvements

The current MVP intentionally avoids overengineering.

Potential future improvements include:

- stronger deterministic heuristics for common design smells,
- support for text and UML/class-diagram submissions in addition to code,
- immutable problem versions,
- evaluation idempotency and duplicate-submission protection,
- richer progress analytics across attempts,
- comparison between two attempts,
- human evaluator support,
- pluggable evaluation strategies,
- queue-backed workers for higher evaluation volume,
- additional LLD rubrics covering extensibility, coupling/cohesion, edge cases, and trade-off reasoning.

The product should continue to prioritize **useful feedback and learning progression** over adding infrastructure that does not improve the learner experience.

---

## 8. Conclusion

Research suggests that the ecosystem already provides strong LLD learning content, design-pattern references, coding practice, and increasingly AI-powered interview feedback. The opportunity for this product is to combine these ideas into a focused learning loop specifically for Low-Level Design.

The core differentiation is not simply "AI evaluates code." It is:

> **Practice an LLD problem → submit your design → receive evidence-based rubric feedback → review the attempt → improve → try again.**

That loop makes the platform useful as a practice tool rather than just an LLM wrapper.

---

## Research Sources

1. HackerRank — AI-powered Mock Interviews and System Design practice  
   https://www.hackerrank.com/mock-interviews

2. HackerRank — System Design Mock Interview  
   https://help.hackerrank.com/articles/8813699799

3. Educative — Grokking the Low Level Design Interview Using OOD Principles  
   https://www.educative.io/blog/educative-highlights-december-2022

4. GitHub — Devaraj-Umapathi/Low-Level-Design  
   https://github.com/Devaraj-Umapathi/Low-Level-Design

5. GitHub — mightbeanshuu/lld-arena  
   https://github.com/mightbeanshuu/lld-arena
