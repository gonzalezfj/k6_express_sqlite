// app.js
import express from "express";
import morgan from "morgan";
const app = express();
import itemsRouter from "./routes/items.js";
import sqlite from "./database.js";
const retries = process.argv.includes("--retries");

const db = sqlite.createDatabase();

// HTTP request logger
app.use(morgan("dev"));

// Middleware to parse JSON bodies
app.use(express.json());

// Define routes
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Mount items routes
app.use("/items", itemsRouter(db, { retryOnBusy: retries }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

export default app;
