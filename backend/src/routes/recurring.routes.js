import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring,
} from "../controllers/recurring.controller.js";

const router = express.Router();

router.use(protect);

router.get("/", getRecurring);
router.post("/", createRecurring);
router.put("/:id", updateRecurring);
router.delete("/:id", deleteRecurring);

export default router;
