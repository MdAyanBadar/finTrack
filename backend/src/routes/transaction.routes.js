import express from "express";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  settleTransaction,
  unsettleTransaction,
} from "../controllers/transaction.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// 🔐 PROTECT ALL TRANSACTION ROUTES
router.use(protect);

router.get("/", getTransactions);
router.post("/", createTransaction);
router.put("/:id", updateTransaction);
router.post("/:id/settle", settleTransaction);
router.delete("/:id/settle", unsettleTransaction);
router.delete("/:id", deleteTransaction);

export default router;
