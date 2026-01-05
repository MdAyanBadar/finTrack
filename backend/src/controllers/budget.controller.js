import prisma from "../prisma.js";

// GET budget
export const getBudget = async (req, res) => {
  try {
    const budget = await prisma.budget.findUnique({
      where: { userId: req.userId },
    });

    res.json(
      budget || { monthlyBudget: 0, savingsGoal: 0 }
    );
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch budget" });
  }
};

// CREATE or UPDATE budget
export const updateBudget = async (req, res) => {
  const { monthlyBudget, savingsGoal } = req.body;

  try {
    const budget = await prisma.budget.upsert({
      where: { userId: req.userId },
      update: { monthlyBudget, savingsGoal },
      create: {
        userId: req.userId,
        monthlyBudget,
        savingsGoal,
      },
    });

    res.json(budget);
  } catch (err) {
    res.status(500).json({ message: "Failed to update budget" });
  }
};
