import dotenv from "dotenv";
dotenv.config();

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ?? "";
}

export const env = {
  port: parseInt(process.env.PORT ?? "5000", 10),
  mongoUri: requireEnv("MONGO_URI", "mongodb://localhost:27017/lld-practice"),
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  nodeEnv: process.env.NODE_ENV ?? "development",
  allowedOrigin: process.env.ALLOWED_ORIGIN ?? "http://localhost:5173",
};