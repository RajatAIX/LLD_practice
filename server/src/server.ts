import { env } from "./config/env.js";
import { connectDatabase } from "./infrastructure/database/database.js";
import type { Server } from "http";
import { ProblemModel } from "./infrastructure/database/models/ProblemModel.js";
import { randomUUID } from "node:crypto";
import appInstance from "./app.js";

const app = appInstance;
let server: Server;

async function seedDatabase() {
  const problemsToSeed = [
    {
      title: "Design a Parking Lot",
      description: "Design a multi-level parking lot system. It should support multiple vehicle types and different pricing models.",
      requirements: ["Support Cars, Motorcycles, and Trucks.", "Calculate fee based on time spent.", "Handle entry and exit gates."],
      difficulty: "MEDIUM",
    },
    {
      title: "Design an Elevator System",
      description: "Design an elevator system for a multi-story building that optimizes wait times.",
      requirements: ["Handle internal and external requests.", "Support emergency stops.", "Optimize dispatch algorithm."],
      difficulty: "HARD",
    },
    {
      title: "Design a Vending Machine",
      description: "Design a state machine for a vending machine.",
      requirements: ["Accept different denominations.", "Dispense product and change.", "Handle out of stock."],
      difficulty: "EASY",
    },
    {
      title: "Design a Library Management System",
      description: "Design a system to manage books, members, and lending operations in a library.",
      requirements: ["Track book inventory and availability.", "Manage member registrations.", "Handle borrow and return flows with due dates."],
      difficulty: "EASY",
    },
    {
      title: "Design an ATM System",
      description: "Design the software for an ATM machine that handles deposits, withdrawals, and transfers.",
      requirements: ["Authenticate users with card and PIN.", "Support cash withdrawal with denomination selection.", "Handle insufficient funds and daily limits."],
      difficulty: "MEDIUM",
    },
    {
      title: "Design an Online Food Ordering System",
      description: "Design a food delivery platform like Zomato/Swiggy at the LLD level.",
      requirements: ["Support restaurants, menus, and order placement.", "Track order lifecycle from placement to delivery.", "Handle multiple delivery agents and assignment logic."],
      difficulty: "HARD",
    }
  ];

  for (const p of problemsToSeed) {
    const exists = await ProblemModel.findOne({ title: p.title });
    if (!exists) {
      await ProblemModel.create({
        _id: randomUUID(),
        ...p,
        createdAt: new Date(),
      });
      console.log(`Seeded problem: ${p.title}`);
    }
  }
}

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    await seedDatabase();
    console.log("Server initialization completed");

    server = app.listen(env.port, () => {
      console.log(`[${env.nodeEnv.toUpperCase()}] Server running on port ${env.port}`);
      console.log(`CORS allowed for: ${env.allowedOrigin}`);
    });

    // Handle SIGTERM for graceful shutdown (Docker/cloud environments)
    process.on("SIGTERM", () => {
      console.log("SIGTERM received. Shutting down gracefully...");
      server.close(() => {
        console.log("Server closed.");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      console.log("SIGINT received. Shutting down gracefully...");
      server.close(() => {
        console.log("Server closed.");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("Server initialization failed", error);
    process.exit(1);
  }
};

startServer();

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});