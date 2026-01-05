import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getBudget, updateBudget } from "../controllers/budget.controller.js";

const router = express.Router();

router.get("/", protect, getBudget);
router.put("/", protect, updateBudget);

export default router;
