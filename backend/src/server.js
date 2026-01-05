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
   CORS CONFIG (IMPORTANT)
====================== */
const allowedOrigins = [
  "http://localhost:5174",              // local frontend
  "https://fin-track-steel-chi.vercel.app", // production frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow Postman / server-to-server requests
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(
          new Error(`CORS blocked for origin: ${origin}`)
        );
      }
    },
    credentials: true,
  })
);

/* ======================
   MIDDLEWARE
====================== */
app.use(express.json());

/* ======================
   ROUTES
====================== */
app.get("/", (req, res) => {
  res.json({
    status: "FinTrack backend running 🚀",
    environment: process.env.NODE_ENV || "development",
  });
});

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
  console.error("❌ Error:", err.message);
  res.status(500).json({ message: err.message || "Server error" });
});

/* ======================
   SERVER
====================== */
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
