import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);
const taskInput = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().max(1000).optional().default(""),
  projectId: z.string().min(1),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  assigneeId: z.string().nullable().optional()
});

router.get("/", async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { project: { ownerId: req.user.id }, ...(req.query.projectId ? { projectId: String(req.query.projectId) } : {}) },
      include: { project: { select: { id: true, name: true } }, assignee: { select: { id: true, name: true } } },
      orderBy: [{ updatedAt: "desc" }]
    });
    res.json({ tasks });
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = taskInput.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
    const data = parsed.data;
    const project = await prisma.project.findFirst({ where: { id: data.projectId, ownerId: req.user.id } });
    if (!project) return res.status(404).json({ message: "Project not found." });
    if (data.assigneeId) {
      const member = await prisma.user.findUnique({ where: { id: data.assigneeId } });
      if (!member) return res.status(400).json({ message: "Assignee not found." });
    }
    const task = await prisma.task.create({
      data: { ...data, dueDate: data.dueDate ? new Date(data.dueDate) : null },
      include: { project: { select: { id: true, name: true } }, assignee: { select: { id: true, name: true } } }
    });
    res.status(201).json({ task });
  } catch (error) { next(error); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const parsed = taskInput.omit({ projectId: true }).partial().safeParse(req.body);
    if (!parsed.success || Object.keys(parsed.data || {}).length === 0) {
      return res.status(400).json({ message: "Provide valid task fields to update." });
    }
    const found = await prisma.task.findFirst({ where: { id: req.params.id, project: { ownerId: req.user.id } } });
    if (!found) return res.status(404).json({ message: "Task not found." });
    const data = { ...parsed.data };
    if (data.dueDate !== undefined) data.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    const task = await prisma.task.update({
      where: { id: found.id }, data,
      include: { project: { select: { id: true, name: true } }, assignee: { select: { id: true, name: true } } }
    });
    res.json({ task });
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const found = await prisma.task.findFirst({ where: { id: req.params.id, project: { ownerId: req.user.id } } });
    if (!found) return res.status(404).json({ message: "Task not found." });
    await prisma.task.delete({ where: { id: found.id } });
    res.json({ message: "Task deleted." });
  } catch (error) { next(error); }
});

export default router;
