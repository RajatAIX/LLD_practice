import mongoose, { Schema, type Document } from "mongoose";
export interface ISubmissionDocument extends Document<string> {
  attemptId: string;
  solution: string;
  status: string;
  submittedAt: Date;
}
const submissionSchema = new Schema<ISubmissionDocument>({
  _id: { type: String, required: true },
  attemptId: { type: String, required: true, ref: "Attempt" },
  solution: { type: String, default: "" },
  status: { type: String, required: true, enum: ["DRAFT", "SUBMITTED"], default: "DRAFT" },
  submittedAt: { type: Date, required: true, default: Date.now }
});
export const SubmissionModel = mongoose.model<ISubmissionDocument>("Submission", submissionSchema);