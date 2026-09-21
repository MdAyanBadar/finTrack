import prisma from "../prisma.js";

// GET budget
export const getBudget = async (req, res) => {
  try {
    const budget = await prisma.budget.findUnique({
      where: { userId: req.userId },
    });

    res.json(
      budget || { monthlyBudget: 0, savingsGoal: 0, salaryDay: 1 }
    );
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch budget" });
  }
};

// CREATE or UPDATE budget
export const updateBudget = async (req, res) => {
  const { salaryDay } = req.body;
  const monthlyBudget = Number(req.body.monthlyBudget);
  const savingsGoal = Number(req.body.savingsGoal);

  if (![monthlyBudget, savingsGoal].every((n) => Number.isFinite(n) && n >= 0 && n <= 1e10)) {
    return res.status(400).json({ message: "Budget and savings goal must be 0 or more" });
  }

  // salaryDay is optional; when omitted the saved value is kept
  if (
    salaryDay !== undefined &&
    (!Number.isInteger(salaryDay) || salaryDay < 1 || salaryDay > 31)
  ) {
    return res
      .status(400)
      .json({ message: "Salary day must be a whole number from 1 to 31" });
  }

  try {
    const budget = await prisma.budget.upsert({
      where: { userId: req.userId },
      update: {
        monthlyBudget,
        savingsGoal,
        ...(salaryDay !== undefined && { salaryDay }),
      },
      create: {
        userId: req.userId,
        monthlyBudget,
        savingsGoal,
        ...(salaryDay !== undefined && { salaryDay }),
      },
    });

    res.json(budget);
  } catch (err) {
    res.status(500).json({ message: "Failed to update budget" });
  }
};

// GET per-category limits
export const getCategoryBudgets = async (req, res) => {
  try {
    const items = await prisma.categoryBudget.findMany({
      where: { userId: req.userId },
      orderBy: { category: "asc" },
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch category budgets" });
  }
};

// SET a category limit; a limit of 0 removes it
export const setCategoryBudget = async (req, res) => {
  const category = req.body.category?.trim();
  const limit = Number(req.body.limit);

  if (!category)
    return res.status(400).json({ message: "Category is required" });
  if (!Number.isFinite(limit) || limit < 0)
    return res.status(400).json({ message: "Limit must be 0 or more" });

  try {
    if (limit === 0) {
      await prisma.categoryBudget.deleteMany({
        where: { userId: req.userId, category },
      });
      return res.json({ category, limit: 0 });
    }

    const item = await prisma.categoryBudget.upsert({
      where: { userId_category: { userId: req.userId, category } },
      update: { limit },
      create: { userId: req.userId, category, limit },
    });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to update category budget" });
  }
};
