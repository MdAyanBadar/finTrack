import crypto from "crypto";
import prisma from "../prisma.js";
import { parseBankSms } from "../utils/smsParser.js";
import { normalizePayee } from "../utils/payee.js";
import { notifyImported } from "../services/notifications.js";
import { financeToday } from "../services/finance.js";

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const MAX_TEXT = 5000;
const SOURCES = ["email", "sms"];

// Accepts JSON { text, date?, source? } or a plain-text body
const readBody = (req) =>
  typeof req.body === "string" ? { text: req.body } : req.body || {};

// Transaction time: the email/SMS time if it's sensible, otherwise now
const pickDate = (value) => {
  const d = value ? new Date(value) : null;
  const now = Date.now();
  if (!d || Number.isNaN(d.getTime())) return new Date();
  if (d.getTime() > now + 24 * 3600e3 || d.getTime() < now - 90 * 24 * 3600e3) return new Date();
  return d;
};

/* =========================
   IMPORT KEY (logged-in user)
========================= */
export const getKeyStatus = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { ingestKeyHash: true },
  });
  res.json({ hasKey: Boolean(user?.ingestKeyHash) });
};

// Creates a new key (replacing any old one). The plain key is shown only once.
export const createKey = async (req, res) => {
  try {
    const key = `ft_${crypto.randomBytes(24).toString("base64url")}`;
    await prisma.user.update({
      where: { id: req.userId },
      data: { ingestKeyHash: sha256(key) },
    });
    res.status(201).json({ key });
  } catch (err) {
    console.error("Create ingest key error:", err);
    res.status(500).json({ message: "Failed to create key" });
  }
};

export const revokeKey = async (req, res) => {
  await prisma.user.update({ where: { id: req.userId }, data: { ingestKeyHash: null } });
  res.json({ success: true });
};

// Try a message without saving it
export const previewMessage = (req, res) => {
  const { text } = readBody(req);
  if (typeof text !== "string" || !text.trim())
    return res.status(400).json({ message: "Paste an SMS or email" });
  const parsed = parseBankSms(text.slice(0, MAX_TEXT));
  res.json(parsed ? { status: "ok", parsed } : { status: "ignored", reason: "Not a completed transaction" });
};

/* =========================
   IMPORT (called by Gmail script / iOS Shortcut with the key)
========================= */
// The user behind an import key, or null
const userForKey = async (req) => {
  const key =
    // Header only: a key in the URL would end up in server logs
    req.get("x-ingest-key") ||
    req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!key?.startsWith?.("ft_")) return null;
  return prisma.user.findUnique({ where: { ingestKeyHash: sha256(key) }, select: { id: true } });
};

export const ingestMessage = async (req, res) => {
  const user = await userForKey(req);
  if (!user) return res.status(401).json({ message: "Missing or invalid import key" });

  const { text, date, source } = readBody(req);
  if (typeof text !== "string" || !text.trim())
    return res.status(400).json({ message: "Missing text" });

  const body = text.slice(0, MAX_TEXT);
  const parsed = parseBankSms(body);
  if (!parsed) return res.json({ status: "ignored", reason: "Not a completed transaction" });

  // Same bank reference (or identical text) is only imported once
  const externalRef = parsed.ref
    ? `ref:${parsed.ref}`
    : `txt:${sha256(body.replace(/\s+/g, " ").trim())}`;

  // The user's own rule for this payee beats the parser's guess
  const rule = await prisma.payeeRule.findUnique({
    where: { userId_payee: { userId: user.id, payee: normalizePayee(parsed.title) } },
  });

  try {
    const tx = await prisma.transaction.create({
      data: {
        userId: user.id,
        title: parsed.title,
        amount: parsed.amount,
        type: parsed.type,
        category: rule?.category ?? parsed.category,
        date: pickDate(date),
        source: SOURCES.includes(source) ? source : "sms",
        externalRef,
      },
    });
    res.status(201).json({ status: "added", transaction: tx });
    notifyImported(user.id, tx).catch((err) => console.error("Notify error:", err));
  } catch (err) {
    if (err.code === "P2002") return res.json({ status: "duplicate" });
    console.error("Ingest error:", err);
    res.status(500).json({ message: "Import failed" });
  }
};

/* =========================
   TODAY IN ONE LINE (for Siri / Shortcuts)
   Read-only, authenticated with the same import key.
========================= */
export const todaySummary = async (req, res) => {
  const user = await userForKey(req);
  if (!user) return res.status(401).json({ message: "Missing or invalid import key" });

  let timeZone = "Asia/Kolkata";
  const asked = req.query.tz;
  try {
    if (asked) {
      new Intl.DateTimeFormat("en", { timeZone: asked });
      timeZone = asked;
    } else {
      const sub = await prisma.pushSubscription.findFirst({ where: { userId: user.id }, select: { timeZone: true } });
      if (sub?.timeZone) timeZone = sub.timeZone;
    }
  } catch { /* unknown zone: keep the default */ }

  try {
    const f = await financeToday(user.id, timeZone);
    const rupees = (n) => `₹${Math.abs(n).toLocaleString("en-IN")}`;
    const days = Math.max(0, f.cycle.remainingDays);
    // Same rounding in the sentence as in the numbers
    const safeToSpend = Math.floor(Math.max(0, f.leftToday));
    const overToday = f.leftToday < 0 ? Math.ceil(-f.leftToday) : 0;
    const left = Math.round(f.balance);
    const text =
      overToday === 0
        ? `You can spend ${rupees(safeToSpend)} today. ${rupees(left)} left, ${days} ${days === 1 ? "day" : "days"} to salary.`
        : `You're ${rupees(overToday)} over today's budget. ${rupees(left)} left, ${days} ${days === 1 ? "day" : "days"} to salary.`;

    res.json({
      safeToSpend,
      overToday,
      spentToday: Math.round(f.todaySpent),
      dailyBudget: Math.floor(f.dailyBudget),
      left,
      spentThisCycle: Math.round(f.spent),
      daysToSalary: days,
      text,
    });
  } catch (err) {
    console.error("Summary error:", err);
    res.status(500).json({ message: "Couldn't build the summary" });
  }
};
