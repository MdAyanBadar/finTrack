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
   MIDDLEWARE
====================== */
app.use(cors({
  origin: [
    "https://fin-track-steel-chi.vercel.app", // Your Vercel frontend URL
    "http://localhost:5173",                 // Your local dev URL
    "http://localhost:5174"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
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

/* ======================
   SERVER
====================== */
const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`✅ Backend running on port ${PORT}`)
);
