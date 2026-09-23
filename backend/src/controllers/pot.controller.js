import prisma from "../prisma.js";

/* =========================
   SAVINGS POTS (BC / chit groups, or any money put aside)
   Payments into a pot still count as money leaving your account; the pot
   shows how much of that was saved rather than spent.
========================= */

const parsePot = (body) => {
  const name = String(body.name ?? "").trim();
  if (!name) return { error: "Give the pot a name" };
  if (name.length > 60) return { error: "That name is too long" };

  let months = null;
  if (body.months !== undefined && body.months !== null && body.months !== "") {
    const value = Number(body.months);
    if (!Number.isInteger(value) || value < 1 || value > 120)
      return { error: "Months must be a whole number from 1 to 120" };
    months = value;
  }

  let monthlyAmount = null;
  if (body.monthlyAmount !== undefined && body.monthlyAmount !== null && body.monthlyAmount !== "") {
    const value = Number(body.monthlyAmount);
    if (!Number.isFinite(value) || value < 0 || value > 1e9)
      return { error: "Monthly amount must be a number" };
    monthlyAmount = value || null;
  }
  return { data: { name, monthlyAmount, months } };
};

// Pots with what's gone in and come out
export const getPots = async (req, res) => {
  try {
    const pots = await prisma.savingsPot.findMany({
      where: { userId: req.userId },
      orderBy: [{ closedAt: "asc" }, { createdAt: "asc" }],
    });
    // Payments in and the payout are counted separately, so receiving the pot
    // doesn't wipe out what you put in
    const [paid, received] = await Promise.all([
      prisma.transaction.groupBy({
        by: ["potId"],
        where: { userId: req.userId, potId: { not: null }, amount: { lt: 0 } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.transaction.groupBy({
        by: ["potId"],
        where: { userId: req.userId, potId: { not: null }, amount: { gt: 0 } },
        _sum: { amount: true },
      }),
    ]);

    const paidBy = Object.fromEntries(paid.map((s) => [s.potId, s]));
    const gotBy = Object.fromEntries(received.map((s) => [s.potId, s._sum.amount ?? 0]));
    res.json(
      pots.map((p) => {
        const paidIn = -(paidBy[p.id]?._sum.amount ?? 0);
        const received = gotBy[p.id] ?? 0;
        return {
          ...p,
          paidIn,
          received,
          balance: paidIn - received, // what's still in the pot
          payments: paidBy[p.id]?._count._all ?? 0,
        };
      })
    );
  } catch (err) {
    console.error("Get pots error:", err);
    res.status(500).json({ message: "Couldn't load your savings pots" });
  }
};

export const createPot = async (req, res) => {
  const { error, data } = parsePot(req.body);
  if (error) return res.status(400).json({ message: error });
  try {
    const pot = await prisma.savingsPot.create({ data: { ...data, userId: req.userId } });
    res.status(201).json({ ...pot, paidIn: 0, payments: 0, net: 0 });
  } catch (err) {
    console.error("Create pot error:", err);
    res.status(500).json({ message: "Couldn't create the pot" });
  }
};

export const updatePot = async (req, res) => {
  const { error, data } = parsePot(req.body);
  if (error) return res.status(400).json({ message: error });
  try {
    const { count } = await prisma.savingsPot.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data,
    });
    if (count === 0) return res.status(404).json({ message: "Pot not found" });
    res.json(await prisma.savingsPot.findUnique({ where: { id: req.params.id } }));
  } catch (err) {
    console.error("Update pot error:", err);
    res.status(500).json({ message: "Couldn't save the pot" });
  }
};

// Deleting a pot keeps its transactions; they simply stop being tagged
export const deletePot = async (req, res) => {
  try {
    const { count } = await prisma.savingsPot.deleteMany({ where: { id: req.params.id, userId: req.userId } });
    if (count === 0) return res.status(404).json({ message: "Pot not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("Delete pot error:", err);
    res.status(500).json({ message: "Couldn't delete the pot" });
  }
};

/* You received the pot: money in, and the pot closes */
export const payoutPot = async (req, res) => {
  try {
    const pot = await prisma.savingsPot.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!pot) return res.status(404).json({ message: "Pot not found" });
    if (pot.closedAt) return res.status(400).json({ message: "This pot is closed" });

    const amount = Number(req.body?.amount);
    if (!Number.isFinite(amount) || amount <= 0)
      return res.status(400).json({ message: "Enter the amount you received" });
    const when = req.body?.date ? new Date(req.body.date) : new Date();
    if (Number.isNaN(when.getTime())) return res.status(400).json({ message: "Invalid date" });

    // Taking money out doesn't end the pot: with a BC you often keep paying
    // the remaining months. Close it yourself when it's finished.
    const payout = await prisma.transaction.create({
      data: {
        userId: req.userId,
        title: `Withdrawn from ${pot.name}`,
        amount: Math.abs(amount),
        type: "income",
        category: "Savings",
        date: when,
        potId: pot.id,
      },
    });

    res.json({ pot, payout });
  } catch (err) {
    console.error("Pot payout error:", err);
    res.status(500).json({ message: "Couldn't record the payout" });
  }
};

// Undo the most recent withdrawal
export const undoPayout = async (req, res) => {
  try {
    const pot = await prisma.savingsPot.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!pot) return res.status(404).json({ message: "Pot not found" });

    const last = await prisma.transaction.findFirst({
      where: { userId: req.userId, potId: pot.id, amount: { gt: 0 } },
      orderBy: { date: "desc" },
    });
    if (last) await prisma.transaction.delete({ where: { id: last.id } });
    res.json({ pot, removed: last });
  } catch (err) {
    console.error("Undo withdrawal error:", err);
    res.status(500).json({ message: "Couldn't undo it" });
  }
};

// Finished with a pot (or not, if you reopen it)
export const setClosed = async (req, res) => {
  try {
    const closedAt = req.method === "POST" ? new Date() : null;
    const { count } = await prisma.savingsPot.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data: { closedAt },
    });
    if (count === 0) return res.status(404).json({ message: "Pot not found" });
    res.json({ pot: await prisma.savingsPot.findUnique({ where: { id: req.params.id } }) });
  } catch (err) {
    console.error("Close pot error:", err);
    res.status(500).json({ message: "Couldn't update the pot" });
  }
};
