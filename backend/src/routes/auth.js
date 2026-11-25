import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const credentials = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  email: z.string().trim().email().transform(v => v.toLowerCase()),
  password: z.string().min(8).max(72)
});

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}
function issueToken(user) {
  return jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
    subject: user.id,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
}

router.post("/register", async (req, res, next) => {
  try {
    const parsed = credentials.extend({ name: z.string().trim().min(2).max(60) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
    const { name, email, password } = parsed.data;
    if (await prisma.user.findUnique({ where: { email } })) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    const user = await prisma.user.create({
      data: { name, email, passwordHash: await bcrypt.hash(password, 12) }
    });
    res.status(201).json({ token: issueToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
});

router.post("/login", async (req, res, next) => {
  try {
    const parsed = credentials.omit({ name: true }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Enter a valid email and password." });
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }
    res.json({ token: issueToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

export default router;
