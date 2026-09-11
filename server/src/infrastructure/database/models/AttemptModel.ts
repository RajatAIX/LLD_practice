import mongoose, { Schema, type Document } from "mongoose";
export interface IAttemptDocument extends Document<string> {
  problemId: string;
  problemTitle: string;
  startedAt: Date;
  status: string;
}
const attemptSchema = new Schema<IAttemptDocument>({
  _id: { type: String, required: true },
  problemId: { type: String, required: true, ref: "Problem" },
  problemTitle: { type: String, required: true },
  startedAt: { type: Date, required: true, default: Date.now },
  status: { type: String, required: true, enum: ["IN_PROGRESS", "SUBMITTED", "EVALUATED"] }
});
export const AttemptModel = mongoose.model<IAttemptDocument>("Attempt", attemptSchema);