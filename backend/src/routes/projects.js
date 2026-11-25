import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);
const projectInput = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().max(500).optional().default(""),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default("#8b7cff")
});

router.get("/", async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { ownerId: req.user.id },
      include: { _count: { select: { tasks: true } }, tasks: { select: { status: true } } },
      orderBy: { updatedAt: "desc" }
    });
    res.json({ projects });
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = projectInput.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
    const project = await prisma.project.create({ data: { ...parsed.data, ownerId: req.user.id } });
    res.status(201).json({ project });
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, ownerId: req.user.id },
      include: { tasks: { include: { assignee: { select: { id: true, name: true, email: true } } }, orderBy: { updatedAt: "desc" } }
    });
    if (!project) return res.status(404).json({ message: "Project not found." });
    res.json({ project });
  } catch (error) { next(error); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const parsed = projectInput.partial().safeParse(req.body);
    if (!parsed.success || Object.keys(parsed.data || {}).length === 0) {
      return res.status(400).json({ message: "Provide valid project fields to update." });
    }
    const found = await prisma.project.findFirst({ where: { id: req.params.id, ownerId: req.user.id } });
    if (!found) return res.status(404).json({ message: "Project not found." });
    const project = await prisma.project.update({ where: { id: found.id }, data: parsed.data });
    res.json({ project });
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const found = await prisma.project.findFirst({ where: { id: req.params.id, ownerId: req.user.id } });
    if (!found) return res.status(404).json({ message: "Project not found." });
    await prisma.project.delete({ where: { id: found.id } });
    res.json({ message: "Project deleted." });
  } catch (error) { next(error); }
});

export default router;
