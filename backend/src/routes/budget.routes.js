import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getBudget,
  updateBudget,
  getCategoryBudgets,
  setCategoryBudget,
} from "../controllers/budget.controller.js";

const router = express.Router();

router.get("/", protect, getBudget);
router.put("/", protect, updateBudget);
router.get("/categories", protect, getCategoryBudgets);
router.put("/categories", protect, setCategoryBudget);

export default router;
