import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getGroups, createGroup, updateGroup, deleteGroup } from "../controllers/split.controller.js";

const router = express.Router();

router.use(protect);

router.get("/", getGroups);
router.post("/", createGroup);
router.put("/:id", updateGroup);
router.delete("/:id", deleteGroup);

export default router;
