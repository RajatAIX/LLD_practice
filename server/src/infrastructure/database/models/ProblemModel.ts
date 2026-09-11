import mongoose, { Schema, type Document } from "mongoose";
export interface IProblemDocument extends Document<string> {
  title: string;
  description: string;
  requirements: string[];
  difficulty: string;
  createdAt: Date;
}
const problemSchema = new Schema<IProblemDocument>({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  requirements: { type: [String], required: true },
  difficulty: { type: String, required: true, enum: ["EASY", "MEDIUM", "HARD"] },
  createdAt: { type: Date, required: true, default: Date.now }
});
export const ProblemModel = mongoose.model<IProblemDocument>("Problem", problemSchema);