import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/me", protect, getProfile);

export default router;
