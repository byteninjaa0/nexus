import "dotenv/config";
import path from "path";
import fs from "fs";
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Server } from "socket.io";

import { errorHandler } from "./middleware/errorHandler.js";
import { verifyAccessToken } from "./utils/jwt.js";
import prisma from "./services/prisma.js";
import { setIo } from "./realtime.js";

import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import projectsRoutes from "./routes/projects.routes.js";
import tasksRoutes from "./routes/tasks.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (process.env.FRONTEND_URL || "http://localhost:5173").split(",").map((s) => s.trim()),
    credentials: true,
  },
});
setIo(io);

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized"));
    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, role: true, deactivated: true },
    });
    if (!user || user.deactivated) return next(new Error("Unauthorized"));
    socket.userId = user.id;
    socket.globalRole = user.role;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  socket.join(`user:${socket.userId}`);

  socket.on("join:project", async (projectId, cb) => {
    try {
      if (!projectId || typeof projectId !== "string") return cb?.({ ok: false });
      if (socket.globalRole === "ADMIN") {
        const p = await prisma.project.findUnique({ where: { id: projectId } });
        if (!p) return cb?.({ ok: false });
        socket.join(`project:${projectId}`);
        return cb?.({ ok: true });
      }
      const m = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: socket.userId, projectId } },
      });
      if (!m) return cb?.({ ok: false });
      socket.join(`project:${projectId}`);
      cb?.({ ok: true });
    } catch {
      cb?.({ ok: false });
    }
  });

  socket.on("leave:project", (projectId) => {
    if (projectId) socket.leave(`project:${projectId}`);
  });
});

app.set("io", io);

const origins = (process.env.FRONTEND_URL || "http://localhost:5173").split(",").map((s) => s.trim());

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin: origins,
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
});
app.use("/api/auth/login", strictAuthLimiter);
app.use("/api/auth/signup", strictAuthLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/admin", adminRoutes);

const publicDir = path.join(process.cwd(), "public");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

app.use(errorHandler);

const port = Number(process.env.PORT || 3001);
server.listen(port, () => {
  console.log(`Nexus API listening on ${port}`);
});
