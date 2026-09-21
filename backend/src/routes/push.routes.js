import express from "express";
import prisma from "../prisma.js";
import { protect } from "../middleware/auth.middleware.js";
import { pushConfigured, vapidPublicKey, sendToUser, runDaily } from "../services/notifications.js";

const router = express.Router();

// Public key the browser needs to subscribe
router.get("/key", (req, res) => {
  if (!pushConfigured) return res.status(503).json({ message: "Notifications aren't set up on the server yet" });
  res.json({ key: vapidPublicKey });
});

router.post("/subscribe", protect, async (req, res) => {
  const { subscription, timeZone } = req.body || {};
  const { endpoint, keys } = subscription || {};
  if (!endpoint?.startsWith("https://") || !keys?.p256dh || !keys?.auth)
    return res.status(400).json({ message: "Invalid subscription" });
  let tz = "Asia/Kolkata";
  try {
    if (timeZone) { new Intl.DateTimeFormat("en", { timeZone }); tz = timeZone; }
  } catch { /* unknown zone: keep default */ }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: req.userId, p256dh: keys.p256dh, auth: keys.auth, timeZone: tz },
    create: { userId: req.userId, endpoint, p256dh: keys.p256dh, auth: keys.auth, timeZone: tz },
  });
  res.status(201).json({ success: true });
});

router.delete("/subscribe", protect, async (req, res) => {
  const endpoint = req.body?.endpoint;
  if (endpoint) await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: req.userId } });
  res.json({ success: true });
});

router.post("/test", protect, async (req, res) => {
  const sent = await sendToUser(req.userId, {
    title: "Notifications are on",
    body: "You'll hear about budget alerts, bills due tomorrow and imported payments.",
  });
  res.json({ sent });
});

// Called once a day by a scheduler with the shared secret
router.post("/daily", async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.get("x-cron-secret") !== secret) return res.status(401).json({ message: "Unauthorized" });
  try {
    res.json(await runDaily());
  } catch (err) {
    console.error("Daily notifications failed:", err);
    res.status(500).json({ message: "Failed" });
  }
});

export default router;
