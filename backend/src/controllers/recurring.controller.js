import prisma from "../prisma.js";

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

// Occurrence on `day` of a month, clamped to the month's last day.
// Stored at 12:00 UTC so it stays on the same calendar day in most timezones.
const occurrenceDate = (year, month, day) => {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, lastDay), 12));
};

const monthKey = (d) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

/**
 * Create the transactions for every recurring item that has come due since it
 * was last posted. Runs whenever transactions are fetched, so no cron is needed.
 */
export const postDueRecurring = async (userId) => {
  const items = await prisma.recurringTransaction.findMany({ where: { userId } });
  const now = new Date();

  for (const r of items) {
    const from = r.lastPosted ?? r.startDate;
    let year = from.getUTCFullYear();
    let month = from.getUTCMonth() + (r.lastPosted ? 1 : 0);
    const startOfStartDay = new Date(Date.UTC(
      r.startDate.getUTCFullYear(), r.startDate.getUTCMonth(), r.startDate.getUTCDate()
    ));

    const due = [];
    // Cap guards against runaway loops on bad data (3 years of backlog max)
    for (let i = 0; i < 36; i++, month++) {
      const occ = occurrenceDate(year, month, r.dayOfMonth);
      if (occ > now) break;
      if (r.endMonth && monthKey(occ) > r.endMonth) break;
      if (occ >= startOfStartDay) due.push(occ);
    }

    if (due.length === 0) continue;

    await prisma.$transaction([
      // Unique (recurringId, date) + skipDuplicates makes concurrent requests safe
      prisma.transaction.createMany({
        data: due.map((date) => ({
          userId,
          recurringId: r.id,
          title: r.title,
          amount: r.amount,
          type: r.type,
          category: r.category,
          date,
          potId: r.potId,
        })),
        skipDuplicates: true,
      }),
      prisma.recurringTransaction.update({
        where: { id: r.id },
        data: { lastPosted: due[due.length - 1] },
      }),
    ]);
  }
};

export const getRecurring = async (req, res) => {
  try {
    const items = await prisma.recurringTransaction.findMany({
      where: { userId: req.userId },
      orderBy: { dayOfMonth: "asc" },
    });
    res.json(items);
  } catch (err) {
    console.error("Get recurring error:", err);
    res.status(500).json({ message: "Failed to fetch recurring transactions" });
  }
};

// Validates the body shared by create and update; returns { error } or { data }
const parseRecurring = (body) => {
  const { title, amount, type, category, dayOfMonth, endMonth, potId } = body;
  const value = Number(amount);

  if (!title?.trim() || !category?.trim())
    return { error: "Title and category are required" };
  if (!Number.isFinite(value) || value <= 0)
    return { error: "Amount must be a positive number" };
  if (type !== "income" && type !== "expense")
    return { error: "Type must be income or expense" };
  if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31)
    return { error: "Day must be a whole number from 1 to 31" };
  if (endMonth != null && !MONTH_RE.test(endMonth))
    return { error: "End month must look like 2027-03" };

  return {
    data: {
      title: title.trim(),
      amount: type === "expense" ? -value : value,
      type,
      category: category.trim(),
      dayOfMonth,
      endMonth: endMonth ?? null,
      potId: potId || null, // a BC/chit payment feeds this savings pot
    },
  };
};

// Optional "count payments from this date" (YYYY-MM-DD, e.g. the pay cycle start)
// so bills that already fell due this cycle are included. Up to ~2 months back.
const parseStartFrom = (value) => {
  if (value == null) return { startFrom: null };
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const d = m && new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (!d || Number.isNaN(d.getTime()) || d > new Date() || d < new Date(Date.now() - 62 * 24 * 3600e3))
    return { error: "Start date must be within the last 2 months" };
  return { startFrom: d };
};

export const createRecurring = async (req, res) => {
  const { error, data } = parseRecurring(req.body);
  if (error) return res.status(400).json({ message: error });
  const { error: startError, startFrom } = parseStartFrom(req.body.startFrom);
  if (startError) return res.status(400).json({ message: startError });

  try {
    const item = await prisma.recurringTransaction.create({
      data: { ...data, userId: req.userId, startDate: startFrom ?? new Date() },
    });

    await postDueRecurring(req.userId);
    res.status(201).json(item);
  } catch (err) {
    console.error("Create recurring error:", err);
    res.status(500).json({ message: "Failed to create recurring transaction" });
  }
};

// Changes apply to future postings; transactions already added stay as they were
export const updateRecurring = async (req, res) => {
  const { error, data } = parseRecurring(req.body);
  if (error) return res.status(400).json({ message: error });
  const { error: startError, startFrom } = parseStartFrom(req.body.startFrom);
  if (startError) return res.status(400).json({ message: startError });

  try {
    const { count } = await prisma.recurringTransaction.updateMany({
      where: {
        id: req.params.id,
        userId: req.userId,
        // Moving the start only ever goes earlier (to catch missed payments)
        ...(startFrom && { startDate: { gt: startFrom } }),
      },
      // Re-check from the new start; entries already added are skipped by the
      // unique (recurringId, date) index
      data: startFrom ? { ...data, startDate: startFrom, lastPosted: null } : data,
    });
    if (count === 0 && startFrom) {
      // Already counted from that date: just apply the other changes
      await prisma.recurringTransaction.updateMany({
        where: { id: req.params.id, userId: req.userId },
        data,
      });
    }
    const exists = await prisma.recurringTransaction.count({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!exists) return res.status(404).json({ message: "Not found" });

    // A new day earlier in the month may already be due
    await postDueRecurring(req.userId);
    const item = await prisma.recurringTransaction.findUnique({ where: { id: req.params.id } });
    res.json(item);
  } catch (err) {
    console.error("Update recurring error:", err);
    res.status(500).json({ message: "Failed to update recurring transaction" });
  }
};

// Deleting stops future postings; transactions already posted are kept
export const deleteRecurring = async (req, res) => {
  try {
    const { count } = await prisma.recurringTransaction.deleteMany({
      where: { id: req.params.id, userId: req.userId },
    });
    if (count === 0) return res.status(404).json({ message: "Not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("Delete recurring error:", err);
    res.status(500).json({ message: "Failed to delete recurring transaction" });
  }
};
