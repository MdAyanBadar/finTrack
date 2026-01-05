import prisma from "../prisma.js";

/**
 * GET all transactions for logged-in user
 */
export const getTransactions = async (req, res) => {
  try {
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

    if (!title || !amount || !type || !category) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const transaction = await prisma.transaction.create({
      data: {
        title,
        amount,
        type,
        category,
        date: date ? new Date(date) : new Date(),
        userId: req.userId, // ✅ IMPORTANT FIX
      },
    });

    res.status(201).json(transaction);
  } catch (err) {
    console.error("Create transaction error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * UPDATE transaction
 */
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, category } = req.body;

    const transaction = await prisma.transaction.updateMany({
      where: {
        id,
        userId: req.userId, // 🔒 security
      },
      data: {
        title,
        amount,
        category,
      },
    });

    res.json(transaction);
  } catch (err) {
    console.error("Update transaction error:", err);
    res.status(500).json({ message: "Update failed" });
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
