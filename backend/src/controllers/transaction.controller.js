import prisma from "../prisma.js";
import { postDueRecurring } from "./recurring.controller.js";
import { notifyAfterTransaction } from "../services/notifications.js";
import { normalizePayee } from "../utils/payee.js";

/**
 * GET all transactions for logged-in user
 */
export const getTransactions = async (req, res) => {
  try {
    // Post any recurring items that came due; never block the list on it
    await postDueRecurring(req.userId).catch((err) =>
      console.error("Recurring posting error:", err)
    );

    const transactions = await prisma.transaction.findMany({
      where: { userId: req.userId },
      orderBy: { date: "desc" },
    });

    res.json(transactions);
  } catch (err) {
    console.error("Get transactions error:", err);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};

/**
 * CREATE transaction
 */
export const createTransaction = async (req, res) => {
  try {
    const { title, amount, type, category, date } = req.body;
    const value = Number(amount);
    const owedBy = req.body.owedBy ? String(req.body.owedBy).trim().slice(0, 60) : null;

    if (!String(title ?? "").trim() || !String(category ?? "").trim())
      return res.status(400).json({ message: "Title and category are required" });
    if (String(title).length > 100 || String(category).length > 50)
      return res.status(400).json({ message: "Title or category is too long" });
    if (!Number.isFinite(value) || value === 0 || Math.abs(value) > 1e9)
      return res.status(400).json({ message: "Amount must be a non-zero number" });
    if (type !== "income" && type !== "expense")
      return res.status(400).json({ message: "Type must be income or expense" });
    const when = date ? new Date(date) : new Date();
    if (Number.isNaN(when.getTime()))
      return res.status(400).json({ message: "Invalid date" });

    const transaction = await prisma.transaction.create({
      data: {
        title: String(title).trim(),
        // Expenses are stored negative, income positive
        amount: type === "expense" ? -Math.abs(value) : Math.abs(value),
        type,
        category: String(category).trim(),
        date: when,
        userId: req.userId,
        // Only an expense can be owed back to you
        owedBy: type === "expense" ? owedBy || null : null,
      },
    });

    res.status(201).json(transaction);
    notifyAfterTransaction(req.userId, transaction).catch((err) => console.error("Notify error:", err));
  } catch (err) {
    console.error("Create transaction error:", err);
    res.status(500).json({ message: "Couldn't add the transaction" });
  }
};

/**
 * UPDATE transaction
 */
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, category, type, date } = req.body;

    const data = {};
    if (title !== undefined) {
      if (!String(title).trim()) return res.status(400).json({ message: "Title can't be empty" });
      data.title = String(title).trim();
    }
    if (amount !== undefined) {
      const value = Number(amount);
      if (!Number.isFinite(value) || value === 0)
        return res.status(400).json({ message: "Amount must be a non-zero number" });
      data.amount = value;
    }
    if (category !== undefined) {
      if (!String(category).trim()) return res.status(400).json({ message: "Category can't be empty" });
      data.category = String(category).trim();
    }
    if (type !== undefined) {
      if (type !== "income" && type !== "expense")
        return res.status(400).json({ message: "Type must be income or expense" });
      data.type = type;
      // Keep the sign consistent with the type (expenses are negative)
      if (data.amount !== undefined) data.amount = type === "expense" ? -Math.abs(data.amount) : Math.abs(data.amount);
    }
    if (req.body.owedBy !== undefined) {
      const owedBy = req.body.owedBy ? String(req.body.owedBy).trim().slice(0, 60) : null;
      if (owedBy && (data.type ?? "expense") === "income")
        return res.status(400).json({ message: "Only an expense can be owed back" });
      data.owedBy = owedBy;
      if (!owedBy) data.settledAt = null;
    }
    if (date !== undefined) {
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) return res.status(400).json({ message: "Invalid date" });
      data.date = d;
    }

    const { count } = await prisma.transaction.updateMany({
      where: {
        id,
        userId: req.userId, // 🔒 security
      },
      data,
    });
    if (count === 0) return res.status(404).json({ message: "Transaction not found" });

    const transaction = await prisma.transaction.findUnique({ where: { id } });

    // "Always use this category for this payee": save a rule for future imports
    // and fix earlier imports from the same payee
    let rememberedCount = 0;
    if (req.body.rememberPayee && data.category) {
      const payee = normalizePayee(transaction.title);
      await prisma.payeeRule.upsert({
        where: { userId_payee: { userId: req.userId, payee } },
        update: { category: data.category },
        create: { userId: req.userId, payee, category: data.category },
      });
      const { count } = await prisma.transaction.updateMany({
        where: {
          userId: req.userId,
          source: { not: null },
          title: { equals: transaction.title, mode: "insensitive" },
          id: { not: id },
          category: { not: data.category },
        },
        data: { category: data.category },
      });
      rememberedCount = count;
    }

    res.json({ ...transaction, rememberedCount });
  } catch (err) {
    console.error("Update transaction error:", err);
    res.status(500).json({ message: "Update failed" });
  }
};

/**
 * MARK AS REPAID
 * Adds the money back as an income entry and marks the original settled.
 * Both are left out of budget totals: they cancel each other out.
 */
export const settleTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const original = await prisma.transaction.findFirst({ where: { id, userId: req.userId } });

    if (!original) return res.status(404).json({ message: "Transaction not found" });
    if (!original.owedBy) return res.status(400).json({ message: "Nobody owes you for this one" });
    if (original.settledAt) return res.status(400).json({ message: "Already marked as repaid" });

    const when = req.body?.date ? new Date(req.body.date) : new Date();
    if (Number.isNaN(when.getTime())) return res.status(400).json({ message: "Invalid date" });

    const [repayment, transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId: req.userId,
          title: `Repaid by ${original.owedBy}`,
          amount: Math.abs(original.amount),
          type: "income",
          category: "Reimbursement",
          date: when,
          repaymentFor: original.id,
        },
      }),
      prisma.transaction.update({ where: { id }, data: { settledAt: when } }),
    ]);

    res.json({ transaction, repayment });
  } catch (err) {
    console.error("Settle transaction error:", err);
    res.status(500).json({ message: "Couldn't mark it as repaid" });
  }
};

/**
 * UNDO "mark as repaid": removes the income entry again
 */
export const unsettleTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const original = await prisma.transaction.findFirst({ where: { id, userId: req.userId } });
    if (!original) return res.status(404).json({ message: "Transaction not found" });

    await prisma.transaction.deleteMany({ where: { userId: req.userId, repaymentFor: id } });
    const transaction = await prisma.transaction.update({ where: { id }, data: { settledAt: null } });
    res.json({ transaction });
  } catch (err) {
    console.error("Unsettle transaction error:", err);
    res.status(500).json({ message: "Couldn't undo it" });
  }
};

/**
 * DELETE transaction
 */
export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.transaction.deleteMany({
      where: {
        id,
        userId: req.userId, // 🔒 security
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Delete transaction error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};
