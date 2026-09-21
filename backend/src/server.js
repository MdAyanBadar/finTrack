import "dotenv/config";
import express from "express";
import cors from "cors";

import transactionRoutes from "./routes/transaction.routes.js";
import authRoutes from "./routes/auth.routes.js";
import budgetRoutes from "./routes/budget.routes.js";
import userRoutes from "./routes/user.routes.js";
import recurringRoutes from "./routes/recurring.routes.js";
import ingestRoutes from "./routes/ingest.routes.js";

const app = express();

/* ======================
   MIDDLEWARE
====================== */
app.use(cors({
  origin: [
    "https://fin-track-steel-chi.vercel.app", // Your Vercel frontend URL
    "http://localhost:5173",                 // Your local dev URL
    "http://localhost:5174",
    ...(process.env.CORS_ORIGINS?.split(",").map((o) => o.trim()) ?? []),
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Ingest-Key"]
}));

app.use(express.json());

/* ======================
   ROUTES
====================== */
app.get("/", (req, res) => {
  res.json({ status: "FinTrack backend running 🚀" });
});

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/users", userRoutes);
app.use("/api/recurring", recurringRoutes);
app.use("/api/ingest", ingestRoutes);

/* ======================
   SERVER
====================== */
const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`✅ Backend running on port ${PORT}`)
);
