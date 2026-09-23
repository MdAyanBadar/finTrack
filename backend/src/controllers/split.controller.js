import crypto from "crypto";
import prisma from "../prisma.js";

/* =========================
   SPLIT BILLS
   Groups are just lists of names. Splitting an expense keeps your share on the
   original transaction and turns everyone else's share into money they owe you,
   so the existing "Owed to you" flow handles getting paid back.
========================= */

const parseGroup = (body) => {
  const name = String(body.name ?? "").trim();
  if (!name) return { error: "Give the group a name" };
  if (name.length > 60) return { error: "That name is too long" };

  const members = [...new Set(
    (Array.isArray(body.members) ? body.members : [])
      .map((m) => String(m).trim())
      .filter(Boolean)
      .map((m) => m.slice(0, 60))
  )];
  if (members.length === 0) return { error: "Add at least one person" };
  if (members.length > 30) return { error: "That's a lot of people — 30 at most" };

  return { data: { name, members } };
};

export const getGroups = async (req, res) => {
  const groups = await prisma.splitGroup.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "asc" },
  });
  res.json(groups);
};

export const createGroup = async (req, res) => {
  const { error, data } = parseGroup(req.body);
  if (error) return res.status(400).json({ message: error });
  res.status(201).json(await prisma.splitGroup.create({ data: { ...data, userId: req.userId } }));
};

export const updateGroup = async (req, res) => {
  const { error, data } = parseGroup(req.body);
  if (error) return res.status(400).json({ message: error });
  const { count } = await prisma.splitGroup.updateMany({
    where: { id: req.params.id, userId: req.userId },
    data,
  });
  if (count === 0) return res.status(404).json({ message: "Group not found" });
  res.json(await prisma.splitGroup.findUnique({ where: { id: req.params.id } }));
};

export const deleteGroup = async (req, res) => {
  const { count } = await prisma.splitGroup.deleteMany({ where: { id: req.params.id, userId: req.userId } });
  if (count === 0) return res.status(404).json({ message: "Group not found" });
  res.json({ success: true });
};

/* =========================
   SPLIT ONE EXPENSE EQUALLY
   The bill stays one transaction holding your own share; everyone else's
   share is recorded against it and shows up as money owed to you.
   body: { people: ["Rahul", "Priya"], includeMe: true }
========================= */
export const splitTransaction = async (req, res) => {
  try {
    const tx = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { shares: true },
    });
    if (!tx) return res.status(404).json({ message: "Transaction not found" });
    if (tx.amount > 0) return res.status(400).json({ message: "Only an expense can be split" });
    if (tx.shares.length) return res.status(400).json({ message: "This one is already split" });
    if (tx.owedBy) return res.status(400).json({ message: "This is already owed by someone" });

    const people = [...new Set(
      (Array.isArray(req.body?.people) ? req.body.people : [])
        .map((p) => String(p).trim())
        .filter(Boolean)
        .map((p) => p.slice(0, 60))
    )];
    if (people.length === 0) return res.status(400).json({ message: "Choose who to split with" });
    if (people.length > 30) return res.status(400).json({ message: "That's a lot of people — 30 at most" });

    const includeMe = req.body?.includeMe !== false;
    const total = Math.abs(tx.amount);
    const parts = people.length + (includeMe ? 1 : 0);
    // Everyone pays the same; any leftover paise stay with you (you paid)
    const share = Math.floor((total / parts) * 100) / 100;
    const myShare = includeMe ? Number((total - share * people.length).toFixed(2)) : 0;
    if (share <= 0) return res.status(400).json({ message: "That's too small to split" });

    await prisma.$transaction([
      prisma.transactionShare.createMany({
        data: people.map((person) => ({ transactionId: tx.id, person, amount: share })),
      }),
      // Your own share is what still counts as your spending
      prisma.transaction.update({ where: { id: tx.id }, data: { amount: -myShare } }),
    ]);

    res.json(await prisma.transaction.findUnique({ where: { id: tx.id }, include: { shares: true } }));
  } catch (err) {
    console.error("Split error:", err);
    res.status(500).json({ message: "Couldn't split it" });
  }
};

/* Undo a split: the whole amount goes back on the transaction */
export const unsplitTransaction = async (req, res) => {
  try {
    const tx = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { shares: true },
    });
    if (!tx?.shares.length) return res.status(404).json({ message: "This isn't split" });

    const total = Math.abs(tx.amount) + tx.shares.reduce((a, s) => a + s.amount, 0);
    const repayments = tx.shares.map((s) => s.repaymentId).filter(Boolean);

    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { userId: req.userId, id: { in: repayments } } }),
      prisma.transactionShare.deleteMany({ where: { transactionId: tx.id } }),
      prisma.transaction.update({ where: { id: tx.id }, data: { amount: -total } }),
    ]);

    res.json(await prisma.transaction.findUnique({ where: { id: tx.id }, include: { shares: true } }));
  } catch (err) {
    console.error("Unsplit error:", err);
    res.status(500).json({ message: "Couldn't undo the split" });
  }
};

/* One person paid you their share */
export const settleShare = async (req, res) => {
  try {
    const share = await prisma.transactionShare.findFirst({
      where: { id: req.params.shareId, transaction: { id: req.params.id, userId: req.userId } },
      include: { transaction: true },
    });
    if (!share) return res.status(404).json({ message: "Share not found" });
    if (share.settledAt) return res.status(400).json({ message: "Already marked as paid" });

    const when = req.body?.date ? new Date(req.body.date) : new Date();
    if (Number.isNaN(when.getTime())) return res.status(400).json({ message: "Invalid date" });

    const repayment = await prisma.transaction.create({
      data: {
        userId: req.userId,
        title: `Repaid by ${share.person}`,
        amount: share.amount,
        type: "income",
        category: "Reimbursement",
        date: when,
        repaymentFor: share.transactionId,
      },
    });
    await prisma.transactionShare.update({
      where: { id: share.id },
      data: { settledAt: when, repaymentId: repayment.id },
    });

    res.json({
      transaction: await prisma.transaction.findUnique({ where: { id: share.transactionId }, include: { shares: true } }),
      repayment,
    });
  } catch (err) {
    console.error("Settle share error:", err);
    res.status(500).json({ message: "Couldn't mark it as paid" });
  }
};

/* Undo that */
export const unsettleShare = async (req, res) => {
  try {
    const share = await prisma.transactionShare.findFirst({
      where: { id: req.params.shareId, transaction: { id: req.params.id, userId: req.userId } },
    });
    if (!share) return res.status(404).json({ message: "Share not found" });

    if (share.repaymentId) {
      await prisma.transaction.deleteMany({ where: { userId: req.userId, id: share.repaymentId } });
    }
    await prisma.transactionShare.update({ where: { id: share.id }, data: { settledAt: null, repaymentId: null } });

    res.json({
      transaction: await prisma.transaction.findUnique({ where: { id: share.transactionId }, include: { shares: true } }),
    });
  } catch (err) {
    console.error("Unsettle share error:", err);
    res.status(500).json({ message: "Couldn't undo it" });
  }
};
