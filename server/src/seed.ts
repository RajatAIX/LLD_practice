import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { connectDatabase } from "./infrastructure/database/database.js";
import { ProblemModel } from "./infrastructure/database/models/ProblemModel.js";

const seedData = [
  {
    title: "Design a Parking Lot",
    description: "Design a multi-level parking lot system supporting multiple vehicle types.",
    requirements: ["Support Cars, Motorcycles, and Trucks.", "Calculate fee based on time spent."],
    difficulty: "MEDIUM" as const,
  },
  {
    title: "Design a Vending Machine",
    description: "Design a state machine for a vending machine.",
    requirements: ["Accept different denominations.", "Dispense product and change."],
    difficulty: "EASY" as const,
  }
];

async function runSeed() {
  await connectDatabase();

  for (const item of seedData) {
    const exists = await ProblemModel.findOne({ title: item.title });
    if (!exists) {
      await ProblemModel.create({
        _id: randomUUID(),
        ...item,
        createdAt: new Date(),
      });
      console.log(`Seeded: ${item.title}`);
    } else {
      console.log(`Already exists: ${item.title}`);
    }
  }

  console.log("Database seeded successfully!");
  await mongoose.disconnect();
  process.exit(0);
}

runSeed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
