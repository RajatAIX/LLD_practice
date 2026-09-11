# Research Note: AI-Powered Low-Level Design Practice

**Author:** Candidate Submission  
**Assignment:** CipherSchools 2-Day Engineering Hiring Challenge  
**Topic:** Automating Low-Level Design (LLD) Evaluation for Software Engineers  

---

## 1. The Learner Problem: Why LLD Practice is Broken

Low-Level Design (LLD) and Object-Oriented Design (OOD) are universally tested in engineering interviews at top tech companies (FAANG, high-growth startups). Candidates are asked to design systems such as **Parking Lot**, **Elevator Management**, **Snake and Ladder**, or **Ride Sharing**.

However, engineers face critical bottlenecks when practicing LLD:

1. **No "Automated Judge" Exists:**  
   Unlike Data Structures and Algorithms (DSA), where platforms like LeetCode run unit tests against stdin/stdout, LLD solutions cannot be validated with a simple `assert(output == expected)`. Design problems are open-ended; there is no single "correct" solution.
2. **Delayed & Expensive Human Feedback:**  
   The only traditional way to get LLD feedback is through senior engineer mock interviews or mentor code reviews, which are expensive ($50–$200/hr) and cannot be scaled or accessed on-demand.
3. **Subjective & Unstandardized Criteria:**  
   Learners frequently confuse class responsibilities, violate SOLID principles, tightly couple components, or over-engineer patterns without knowing *why* their design would fail in a real production codebase.

---

## 2. Technical Approaches Researched

We evaluated three potential technical approaches to automate LLD evaluation:

| Approach | Strengths | Critical Gaps |
|---|---|---|
| **Approach 1: Static Analysis & AST Parsing** (ESLint, Tree-sitter, SonarQube) | Fast (<50ms), deterministic, zero cost, detects syntax errors and complexity metrics. | Incapable of understanding domain intent. Cannot evaluate whether a `ParkingLot` handles spot allocation correctly or whether design patterns (Strategy, Factory) were appropriately applied. |
| **Approach 2: Free-form Conversational LLM Chat** (ChatGPT / Claude web interface) | High contextual comprehension, explains concepts fluently. | Unstructured output, inconsistent grading across attempts, verbose chatter, hallucination of non-existent requirements, and no persistent progress tracking. |
| **Approach 3: Hybrid Structured Rubric Engine with LLM JSON Schema** *(Chosen Architecture)* | Consistent 4-axis scoring rubric, machine-parseable JSON schema, actionable recommendations, deterministic fallback capability, and historical progress retention. | Requires strict schema enforcement, rate-limit handling, and asynchronous job processing to prevent HTTP timeouts. |

---

## 3. Key Gaps Identified in the Market

1. **The LeetCode Gap:** LeetCode tests algorithmic efficiency ($O(N)$ time/space). It does not test class modularity, interface segregation, single responsibility, or extensibility.
2. **The Generic AI Tutor Gap:** Feeding a design to a generic LLM prompt yields generic praise or overly pedantic critiques without actionable milestones. There is no structured rubric (e.g., separating Requirements coverage from Extensibility).
3. **The Developer Feedback Loop Gap:** Without persistent attempt history, learners cannot see how their scores evolve from version 1 (naive classes) to version 2 (design patterns applied).

---

## 4. Product Decisions & Architectural Tradeoffs

### Tradeoff 1: Asynchronous Polling vs. WebSockets for Evaluations
* **Decision:** We implemented an **asynchronous state machine** with client-side polling (`POST /evaluations/start` returns `202 Accepted` with an `evaluationId`, followed by periodic polling on `GET /evaluations/:id`).
* **Rationale:** LLM generation with deep reasoning takes between 2 to 6 seconds. A synchronous blocking HTTP request is prone to network timeouts (especially behind serverless or edge reverse proxies like Cloudflare/Render) and locks client threads. Polling with exponential backoff / interval termination is resilient, stateless, and horizontal-scaling friendly without requiring sticky WebSocket sessions.

### Tradeoff 2: Graceful Mock Fallback vs. Hard Failure
* **Decision:** If the Gemini API key is missing or encounters a quota exhaustion (HTTP 429), the backend automatically falls back to a deterministic heuristic mock evaluator that grades the solution and returns realistic feedback.
* **Rationale:** Reviewers and recruiters evaluating this assignment should be able to run `npm run dev` and test the full end-to-end loop immediately without blocker hurdles or needing external credit cards.

### Tradeoff 3: Snapshotting Problem Metadata vs. Relational Joins
* **Decision:** When an `Attempt` is created, `problemTitle` is snapshotted directly into the `Attempt` document.
* **Rationale:** In MongoDB, reading a learner's history is a single index scan (`db.attempts.find().sort({ startedAt: -1 })`) without requiring an expensive `$lookup` aggregation pipeline. Since historical attempts reflect the problem title as it was when attempted, snapshotting guarantees immutable history and sub-millisecond retrieval.

### Tradeoff 4: Strict 4-Axis Rubric Design
We engineered the evaluation engine around 4 universal pillars of software craftsmanship:
1. **Requirements (25%):** Did the candidate address all functional constraints specified in the prompt?
2. **Design & Modeling (25%):** Are domain entities well-formed? Are single responsibilities respected?
3. **Extensibility (25%):** Is the code open for extension and closed for modification (Open/Closed principle)? Can new vehicle types or dispatch algorithms be added with minimal changes?
4. **Code Quality & Clean Architecture (25%):** Naming conventions, interface clarity, and separation of concerns.

---

## 5. Conclusion & Next Steps

Automating LLD evaluation through structured LLM rubrics bridges the gap between algorithmic coding and real-world software engineering. The platform provides immediate, objective, and actionable architectural critique at zero human marginal cost. Future iterations will incorporate **Mermaid.js class diagram generation** and interactive follow-up interview questions dynamically generated based on candidate design weaknesses.
