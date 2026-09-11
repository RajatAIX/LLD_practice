import mongoose, { Schema, type Document } from "mongoose";
export interface IEvaluationDocument extends Document<string> {
  submissionId: string;
  status: string;
  score: any;
  feedback: any;
  evaluatedAt: Date;
}
const evaluationSchema = new Schema<IEvaluationDocument>({
  _id: { type: String, required: true },
  submissionId: { type: String, required: true, ref: "Submission" },
  status: { type: String, required: true, enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"] },
  score: { type: Schema.Types.Mixed, default: null },
  feedback: { type: Schema.Types.Mixed, default: null },
  evaluatedAt: { type: Date, default: null }
});
export const EvaluationModel = mongoose.model<IEvaluationDocument>("Evaluation", evaluationSchema);