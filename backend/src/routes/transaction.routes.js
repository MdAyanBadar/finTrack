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
import { splitTransaction, unsplitTransaction, settleShare, unsettleShare } from "../controllers/split.controller.js";

const router = express.Router();

// 🔐 PROTECT ALL TRANSACTION ROUTES
router.use(protect);

router.get("/", getTransactions);
router.post("/", createTransaction);
router.put("/:id", updateTransaction);
router.post("/:id/split", splitTransaction);
router.post("/:id/shares/:shareId/settle", settleShare);
router.delete("/:id/shares/:shareId/settle", unsettleShare);
router.delete("/:id/split", unsplitTransaction);
router.post("/:id/settle", settleTransaction);
router.delete("/:id/settle", unsettleTransaction);
router.delete("/:id", deleteTransaction);

export default router;
