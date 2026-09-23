import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getKeyStatus,
  createKey,
  revokeKey,
  previewMessage,
  ingestMessage,
  todaySummary,
} from "../controllers/ingest.controller.js";

const router = express.Router();

// Plain-text bodies are allowed so simple clients (iOS Shortcuts) can post raw SMS
router.use(express.text({ type: "text/plain", limit: "20kb" }));

// Called by the Gmail script / Shortcut; authenticated by the import key, not a login
router.post("/", ingestMessage);

// Read-only "what can I spend today" for Siri / Shortcuts
router.get("/summary", todaySummary);

router.get("/key", protect, getKeyStatus);
router.post("/key", protect, createKey);
router.delete("/key", protect, revokeKey);
router.post("/preview", protect, previewMessage);

export default router;
