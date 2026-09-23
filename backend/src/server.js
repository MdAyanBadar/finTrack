import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import "./config.js";
import cors from "cors";

import transactionRoutes from "./routes/transaction.routes.js";
import authRoutes from "./routes/auth.routes.js";
import budgetRoutes from "./routes/budget.routes.js";
import userRoutes from "./routes/user.routes.js";
import recurringRoutes from "./routes/recurring.routes.js";
import ingestRoutes from "./routes/ingest.routes.js";
import pushRoutes from "./routes/push.routes.js";
import potRoutes from "./routes/pot.routes.js";
import splitRoutes from "./routes/split.routes.js";

const app = express();

// Behind Render's proxy: use the client's IP for rate limiting
app.set("trust proxy", 1);

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

app.use(express.json({ limit: "100kb" }));

// Slow down password guessing: 10 login/register attempts per 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true, // only failed attempts count
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many attempts. Try again in 15 minutes." },
});

/* ======================
   ROUTES
====================== */
app.get("/", (req, res) => {
  res.json({ status: "FinTrack backend running 🚀" });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/users", userRoutes);
app.use("/api/recurring", recurringRoutes);
app.use("/api/ingest", ingestRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/pots", potRoutes);
app.use("/api/split-groups", splitRoutes);

/* ======================
   SERVER
====================== */
const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`✅ Backend running on port ${PORT}`)
);
