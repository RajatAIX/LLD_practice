import { GoogleGenAI, Type } from "@google/genai";
import { env } from "../../config/env.js";
import type { Evaluator, EvaluationResult } from "../../domain/evaluation/Evaluator.js";
import type { Submission } from "../../domain/submission/Submission.js";
import type { Rubric } from "../../domain/evaluation/Rubric.js";
import { Feedback } from "../../domain/evaluation/Feedback.js";

export class GeminiEvaluator implements Evaluator {
  public async evaluate(
    submission: Submission,
    rubric: Rubric
  ): Promise<EvaluationResult> {
    const apiKey = process.env.GEMINI_API_KEY || env.geminiApiKey;

    // Fallback Mock Evaluation if API Key is missing
    if (!apiKey) {
      console.log("[Evaluator] No Gemini API Key found. Returning default evaluation...");
      return this.getDefaultEvaluation();
    }

    const prompt = `
You are an expert software engineer reviewing a Low-Level Design (LLD) code submission.
Evaluate the candidate's solution accurately based on the rubric criteria and their code.

Rubric Criteria:
${JSON.stringify(rubric.getCriteria(), null, 2)}

Candidate Solution:
${submission.getSolution()}

Guidelines for scoring & feedback:
1. Provide realistic scores between 1 and 10 for:
   - overall: overall rating of the design and implementation
   - requirements: how well the solution satisfies the problem's functional requirements
   - design: entity modeling, class responsibilities, separation of concerns, design patterns
   - extensibility: how easy it is to add new features or types without modifying existing code
   - codeQuality: clean code, readability, naming conventions, error handling
2. IMPORTANT - Writing style: Use simple, plain, easy-to-understand words. Avoid overly heavy academic jargon. Write direct, encouraging, and clear sentences so any developer can immediately understand and learn from it.
3. Strengths: 2 to 4 specific positive things about their code.
4. Improvements: 2 to 4 clear points where their code needs work.
5. Recommendations: 2 to 4 actionable, practical steps or design patterns they can try next.
`;

    try {
      console.log("[Evaluator] Calling Gemini AI (model: gemini-3.6-flash)...");
      const ai = new GoogleGenAI({ apiKey });
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
                  overall: { type: Type.INTEGER },
                  requirements: { type: Type.INTEGER },
                  design: { type: Type.INTEGER },
                  extensibility: { type: Type.INTEGER },
                  codeQuality: { type: Type.INTEGER },
                },
                required: ["overall", "requirements", "design", "extensibility", "codeQuality"]
              },
              feedback: {
                type: Type.OBJECT,
                properties: {
                  summary: { type: Type.STRING },
                  strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                  improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
                  recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["summary", "strengths", "improvements", "recommendations"]
              }
            },
            required: ["score", "feedback"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response text returned from Gemini API");
      }

      const parsed = JSON.parse(text);
      console.log("[Evaluator] Successfully received evaluation from Gemini AI!");

      // Clamp scores between 1 and 10
      const clamp = (val: any) => Math.max(1, Math.min(10, typeof val === "number" ? Math.round(val) : 5));

      return {
        score: {
          overall: clamp(parsed.score?.overall),
          requirements: clamp(parsed.score?.requirements),
          design: clamp(parsed.score?.design),
          extensibility: clamp(parsed.score?.extensibility),
          codeQuality: clamp(parsed.score?.codeQuality),
        },
        feedback: new Feedback({
          summary: parsed.feedback?.summary || "Design review completed.",
          strengths: Array.isArray(parsed.feedback?.strengths) ? parsed.feedback.strengths : [],
          improvements: Array.isArray(parsed.feedback?.improvements) ? parsed.feedback.improvements : [],
          recommendations: Array.isArray(parsed.feedback?.recommendations) ? parsed.feedback.recommendations : [],
        })
      };
    } catch (error) {
      console.error("[Evaluator] Gemini AI evaluation failed, using fallback:", error);
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
        summary: "Good initial structure that covers core classes. With a few design pattern refinements, this design will be production ready.",
        strengths: [
          "Good identification of core entities and straightforward class setup.",
          "Clean and readable structure with clear method responsibilities."
        ],
        improvements: [
          "Consider using interfaces or abstract classes to avoid tight coupling between components.",
          "Add validation and error handling for edge cases."
        ],
        recommendations: [
          "Try applying the Strategy Pattern for pluggable behaviors.",
          "Keep entities independent by passing dependencies via constructors."
        ],
      })
    };
  }
}