import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import transactionRoutes from "./routes/transaction.routes.js";
import authRoutes from "./routes/auth.routes.js";
import budgetRoutes from "./routes/budget.routes.js";
import userRoutes from "./routes/user.routes.js";

dotenv.config();

const app = express();

/* ======================
   CORS CONFIG (SAFE)
====================== */
const allowedOrigins = [
  "http://localhost:5174",
  "https://fin-track-steel-chi.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow Postman / server-side requests
      if (!origin) return callback(null, true);

      // allow known frontends
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // silently block others (DO NOT throw error)
      return callback(null, false);
    },
    credentials: true,
  })
);

/* ======================
   MIDDLEWARE
====================== */
app.use(express.json());

/* ======================
   HEALTH CHECK
====================== */
app.get("/", (req, res) => {
  res.json({
    status: "FinTrack backend running 🚀",
    env: process.env.NODE_ENV || "development",
  });
});

/* ======================
   ROUTES
====================== */
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/users", userRoutes);

/* ======================
   404 HANDLER
====================== */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* ======================
   ERROR HANDLER
====================== */
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  res.status(500).json({
    message: err.message || "Internal server error",
  });
});

/* ======================
   SERVER
====================== */
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
