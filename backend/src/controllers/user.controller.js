import prisma from "../prisma.js";

export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};
