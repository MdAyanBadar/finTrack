import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import transactionRoutes from "./routes/transaction.routes.js";
import authRoutes from "./routes/auth.routes.js";
import budgetRoutes from "./routes/budget.routes.js"; // ✅ ADD THIS
import userRoutes from "./routes/user.routes.js";



dotenv.config();

const app = express();

/* ======================
   MIDDLEWARE
====================== */
app.use(
  cors({
    origin: "http://localhost:5174",
    credentials: true,
  })
);

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

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
