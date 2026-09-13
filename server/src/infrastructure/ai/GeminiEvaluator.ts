import { GoogleGenAI, Type } from "@google/genai";
import { env } from "../../config/env.js";

import type {
  Evaluator,
  EvaluationResult,
} from "../../domain/evaluation/Evaluator.js";

import type { Submission } from "../../domain/submission/Submission.js";
import type { Problem } from "../../domain/problem/Problem.js";
import type { Rubric } from "../../domain/evaluation/Rubric.js";

import { Feedback } from "../../domain/evaluation/Feedback.js";

export class GeminiEvaluator implements Evaluator {
  public async evaluate(
    submission: Submission,
    problem: Problem,
    rubric: Rubric
  ): Promise<EvaluationResult> {
    const apiKey = process.env.GEMINI_API_KEY || env.geminiApiKey;

    /*
     * Fallback evaluation is used when Gemini is not configured.
     * The deterministic fallback will be improved in a later step.
     */
    if (!apiKey) {
      console.log(
        "[Evaluator] No Gemini API Key found. Returning default evaluation..."
      );

      return this.getDefaultEvaluation();
    }

    const prompt = `
You are an expert software engineer reviewing a Low-Level Design (LLD) code submission.

Your job is to evaluate the candidate's solution against the ACTUAL problem requirements and the provided evaluation rubric.

Do not assume that there is only one correct LLD solution.

Different designs can be valid if they:
- satisfy the stated requirements,
- have reasonable responsibilities,
- maintain good separation of concerns,
- use appropriate abstractions,
- and can evolve when requirements change.

========================================
PROBLEM
========================================

Title:
${problem.getTitle()}

Description:
${problem.getDescription()}

Requirements:
${problem
  .getRequirements()
  .map((requirement, index) => `${index + 1}. ${requirement}`)
  .join("\n")}

========================================
RUBRIC
========================================

${JSON.stringify(rubric.getCriteria(), null, 2)}

========================================
CANDIDATE SOLUTION
========================================

${submission.getSolution()}

========================================
EVALUATION RULES
========================================

1. Evaluate the candidate against the ACTUAL problem requirements above.

2. Do not judge the candidate by comparing it to one specific reference implementation.

3. Different valid LLD approaches should receive credit when they satisfy the requirements.

4. Do not invent requirements that are not present in the problem.

5. If a requirement is not addressed, explicitly mention it as a concern.

6. Requirements score:
   Evaluate how well the candidate addresses the actual functional requirements.

7. Design score:
   Evaluate class responsibilities, object modeling, relationships, interfaces,
   encapsulation, separation of concerns, cohesion, coupling, and appropriate abstractions.

8. Extensibility score:
   Evaluate how easily the design can accommodate reasonable future requirement
   changes without unnecessary modification of existing code.

9. Code quality score:
   Evaluate readability, naming, maintainability, structure, validation,
   error handling, and clarity.

10. Give scores from 1 to 10.

11. Feedback must be based on evidence from the candidate solution.

12. For every rubric criterion, provide:
    - criterion
    - score
    - evidence
    - concern
    - suggestion
    - confidence

13. Evidence must refer to specific classes, interfaces, methods, relationships,
    or behaviors visible in the candidate solution whenever possible.

14. If there is no evidence for a criterion, say so instead of inventing evidence.

15. Confidence must be a number between 0 and 1 representing how confident
    you are in the evaluation of that criterion.

16. Strengths should contain 2 to 4 specific positive observations.

17. Improvements should contain 2 to 4 specific weaknesses.

18. Recommendations should contain 2 to 4 actionable suggestions for the learner's next attempt.

19. Use simple, clear language. Avoid unnecessary academic jargon.

========================================
OUTPUT REQUIREMENTS
========================================

Return only the structured JSON response matching the provided schema.
`;

    try {
      console.log(
        "[Evaluator] Calling Gemini AI (model: gemini-3.6-flash)..."
      );

      const ai = new GoogleGenAI({
        apiKey,
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",

        contents: prompt,

        config: {
          responseMimeType: "application/json",

          responseSchema: {
            type: Type.OBJECT,

            properties: {
              score: {
                type: Type.OBJECT,

                properties: {
                  overall: {
                    type: Type.INTEGER,
                  },

                  requirements: {
                    type: Type.INTEGER,
                  },

                  design: {
                    type: Type.INTEGER,
                  },

                  extensibility: {
                    type: Type.INTEGER,
                  },

                  codeQuality: {
                    type: Type.INTEGER,
                  },
                },

                required: [
                  "overall",
                  "requirements",
                  "design",
                  "extensibility",
                  "codeQuality",
                ],
              },

              feedback: {
                type: Type.OBJECT,

                properties: {
                  summary: {
                    type: Type.STRING,
                  },

                  strengths: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.STRING,
                    },
                  },

                  improvements: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.STRING,
                    },
                  },

                  recommendations: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.STRING,
                    },
                  },

                  criteria: {
                    type: Type.ARRAY,

                    items: {
                      type: Type.OBJECT,

                      properties: {
                        criterion: {
                          type: Type.STRING,
                        },

                        score: {
                          type: Type.INTEGER,
                        },

                        evidence: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.STRING,
                          },
                        },

                        concern: {
                          type: Type.STRING,
                        },

                        suggestion: {
                          type: Type.STRING,
                        },

                        confidence: {
                          type: Type.NUMBER,
                        },
                      },

                      required: [
                        "criterion",
                        "score",
                        "evidence",
                        "concern",
                        "suggestion",
                        "confidence",
                      ],
                    },
                  },
                },

                required: [
                  "summary",
                  "strengths",
                  "improvements",
                  "recommendations",
                  "criteria",
                ],
              },
            },

            required: [
              "score",
              "feedback",
            ],
          },
        },
      });

      const text = response.text;

      if (!text) {
        throw new Error(
          "No response text returned from Gemini API"
        );
      }

      const parsed = JSON.parse(text);

      console.log(
        "[Evaluator] Successfully received evaluation from Gemini AI!"
      );

      const clampScore = (value: unknown): number => {
        if (
          typeof value !== "number" ||
          !Number.isFinite(value)
        ) {
          return 5;
        }

        return Math.max(
          1,
          Math.min(10, Math.round(value))
        );
      };

      const clampConfidence = (
        value: unknown
      ): number => {
        if (
          typeof value !== "number" ||
          !Number.isFinite(value)
        ) {
          return 0.5;
        }

        return Math.max(
          0,
          Math.min(1, value)
        );
      };

      const toStringArray = (
        value: unknown
      ): string[] => {
        if (!Array.isArray(value)) {
          return [];
        }

        return value.filter(
          (item): item is string =>
            typeof item === "string"
        );
      };

      const criteria = Array.isArray(
        parsed.feedback?.criteria
      )
        ? parsed.feedback.criteria.map(
            (criterion: unknown) => {
              const item =
                criterion as Record<string, unknown>;

              return {
                criterion:
                  typeof item.criterion === "string"
                    ? item.criterion
                    : "General Design",

                score: clampScore(item.score),

                evidence: toStringArray(
                  item.evidence
                ),

                concern:
                  typeof item.concern === "string"
                    ? item.concern
                    : "No specific concern identified.",

                suggestion:
                  typeof item.suggestion === "string"
                    ? item.suggestion
                    : "Continue improving the design.",

                confidence:
                  clampConfidence(
                    item.confidence
                  ),
              };
            }
          )
        : [];

      return {
        score: {
          overall: clampScore(
            parsed.score?.overall
          ),

          requirements: clampScore(
            parsed.score?.requirements
          ),

          design: clampScore(
            parsed.score?.design
          ),

          extensibility: clampScore(
            parsed.score?.extensibility
          ),

          codeQuality: clampScore(
            parsed.score?.codeQuality
          ),
        },

        feedback: new Feedback({
          summary:
            typeof parsed.feedback?.summary ===
            "string"
              ? parsed.feedback.summary
              : "Design review completed.",

          strengths: toStringArray(
            parsed.feedback?.strengths
          ),

          improvements: toStringArray(
            parsed.feedback?.improvements
          ),

          recommendations: toStringArray(
            parsed.feedback?.recommendations
          ),

          criteria,
        }),
      };
    } catch (error) {
      console.error(
        "[Evaluator] Gemini AI evaluation failed, using fallback:",
        error
      );

      return this.getDefaultEvaluation();
    }
  }

  private getDefaultEvaluation(): EvaluationResult {
    return {
      score: {
        overall: 7,
        requirements: 7,
        design: 7,
        extensibility: 6,
        codeQuality: 8,
      },

      feedback: new Feedback({
        summary:
          "Good initial structure that covers core classes. With a few design pattern refinements, this design will be easier to maintain and extend.",

        strengths: [
          "Good identification of core entities and straightforward class setup.",
          "Clean and readable structure with clear method responsibilities.",
        ],

        improvements: [
          "Consider using interfaces or abstract classes to avoid tight coupling between components.",
          "Add validation and error handling for important edge cases.",
        ],

        recommendations: [
          "Try applying the Strategy Pattern for behavior that may vary.",
          "Keep entities independent by passing dependencies through clear interfaces.",
        ],

        criteria: [
          {
            criterion: "Requirements",
            score: 7,
            evidence: [
              "The submitted solution contains domain classes related to the requested problem.",
            ],
            concern:
              "The fallback evaluator cannot reliably determine complete requirement coverage.",
            suggestion:
              "Review every stated problem requirement and explicitly map it to a class or behavior.",
            confidence: 0.5,
          },

          {
            criterion: "Design",
            score: 7,
            evidence: [
              "The solution contains identifiable classes and responsibilities.",
            ],
            concern:
              "A deeper design review requires analysis of relationships and responsibilities.",
            suggestion:
              "Review coupling, cohesion, interfaces, and class responsibilities.",
            confidence: 0.5,
          },

          {
            criterion: "Extensibility",
            score: 6,
            evidence: [
              "The solution provides a starting structure for future behavior.",
            ],
            concern:
              "Future requirement changes may require modifying existing classes.",
            suggestion:
              "Identify behaviors that are likely to change and isolate them behind abstractions.",
            confidence: 0.5,
          },

          {
            criterion: "Code Quality",
            score: 8,
            evidence: [
              "The submitted solution can be reviewed as a structured code-based design.",
            ],
            concern:
              "The fallback evaluator cannot deeply analyze code quality.",
            suggestion:
              "Improve naming, validation, error handling, and separation of responsibilities.",
            confidence: 0.5,
          },
        ],
      }),
    };
  }
}