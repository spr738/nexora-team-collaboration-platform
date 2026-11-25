import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);
router.get("/summary", async (req, res, next) => {
  try {
    const owner = { project: { ownerId: req.user.id } };
    const [projects, tasks, completed, inProgress, overdue] = await Promise.all([
      prisma.project.count({ where: { ownerId: req.user.id } }),
      prisma.task.count({ where: owner }),
      prisma.task.count({ where: { ...owner, status: "DONE" } }),
      prisma.task.count({ where: { ...owner, status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { ...owner, dueDate: { lt: new Date() }, status: { not: "DONE" } } })
    ]);
    res.json({ summary: { projects, tasks, completed, inProgress, overdue } });
  } catch (error) { next(error); }
});
export default router;
