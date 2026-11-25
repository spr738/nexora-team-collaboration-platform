import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projects.js";
import taskRoutes from "./routes/tasks.js";
import dashboardRoutes from "./routes/dashboard.js";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is required. Copy .env.example to .env and set it.");

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "Nexora API" }));
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((req, res) => res.status(404).json({ message: "Route not found." }));
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Something went wrong. Check the API logs." });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`Nexora API listening on http://localhost:${port}`));
