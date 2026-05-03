import { randomUUID } from "crypto";
import { existsSync } from "fs";
import { config as loadEnv } from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Load backend/.env when seed is invoked from repo root or `nexus/` (cwd ≠ backend/)
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env");
if (!existsSync(envPath)) {
  console.error(`Missing ${envPath}. Copy nexus/backend/.env.example to .env and set DATABASE_URL.`);
  process.exit(1);
}
loadEnv({ path: envPath });

const prisma = new PrismaClient();

const pass = "NexusDemo123!";

async function main() {
  const hash = await bcrypt.hash(pass, 12);

  await prisma.refreshToken.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const admins = await Promise.all([
    prisma.user.create({
      data: {
        name: "Avery Quinn",
        email: "admin1@nexus.app",
        password: hash,
        role: "ADMIN",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Avery",
      },
    }),
    prisma.user.create({
      data: {
        name: "Jordan Blake",
        email: "admin2@nexus.app",
        password: hash,
        role: "ADMIN",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan",
      },
    }),
  ]);

  const members = await Promise.all(
    ["Sam", "Riley", "Casey", "Morgan", "Taylor"].map((n, i) =>
      prisma.user.create({
        data: {
          name: `${n} Lee`,
          email: `member${i + 1}@nexus.app`,
          password: hash,
          role: "MEMBER",
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${n}`,
        },
      }),
    ),
  );

  const allUsers = [...admins, ...members];

  const projectsData = [
    { name: "Orion Launch", color: "#3b82f6", icon: "rocket", desc: "Mission control for the flagship release." },
    { name: "Nebula Design", color: "#8b5cf6", icon: "palette", desc: "Glass UI system and motion specs." },
    { name: "Pulse Analytics", color: "#06b6d4", icon: "activity", desc: "Realtime dashboards and alerts." },
    { name: "Vault Security", color: "#10b981", icon: "shield", desc: "Auth hardening and audit trails." },
  ];

  const statuses = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
  const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

  for (let p = 0; p < projectsData.length; p++) {
    const pd = projectsData[p];
    const owner = members[p % members.length];
    const proj = await prisma.project.create({
      data: {
        name: pd.name,
        description: pd.desc,
        color: pd.color,
        icon: pd.icon,
        status: "ACTIVE",
        deadline: new Date(Date.now() + (30 + p * 7) * 86400000),
        createdById: owner.id,
        members: {
          create: [
            { userId: owner.id, role: "OWNER" },
            ...members
              .filter((u) => u.id !== owner.id)
              .slice(0, 3)
              .map((u, idx) => ({
                userId: u.id,
                role: idx === 0 ? "ADMIN" : "MEMBER",
              })),
          ],
        },
      },
    });

    const memberIds = (
      await prisma.projectMember.findMany({ where: { projectId: proj.id }, select: { userId: true } })
    ).map((m) => m.userId);

    const tasks = [];
    for (let t = 0; t < 6 + p * 2; t++) {
      const st = statuses[(t + p) % statuses.length];
      const assignee = memberIds[t % memberIds.length];
      const creator = memberIds[(t + 1) % memberIds.length];
      tasks.push({
        title: `${pd.name} task ${t + 1}`,
        description: `Workstream item ${t + 1} with context for ${pd.name}.`,
        status: st,
        priority: priorities[t % priorities.length],
        projectId: proj.id,
        assigneeId: assignee,
        createdById: creator,
        dueDate: new Date(Date.now() + (t - 3) * 86400000 * 2),
        tags: ["nexus", t % 2 ? "core" : "edge"],
        attachments: [],
        position: t,
      });
    }
    for (const t of tasks) {
      await prisma.task.create({ data: t });
    }

    const firstTasks = await prisma.task.findMany({
      where: { projectId: proj.id },
      take: 3,
    });
    for (const task of firstTasks) {
      await prisma.comment.create({
        data: {
          taskId: task.id,
          authorId: owner.id,
          content: `Kickoff note for **${task.title}** — aligned with ${pd.name} goals.`,
        },
      });
    }
  }

  const logs = [];
  for (let i = 0; i < 40; i++) {
    const u = allUsers[i % allUsers.length];
    logs.push({
      userId: u.id,
      action: ["TASK_UPDATED", "PROJECT_CREATED", "USER_LOGIN", "TASK_COMMENT"][i % 4],
      entityType: ["Task", "Project", "User", "Task"][i % 4],
      entityId: randomUUID(),
      metadata: { index: i },
      createdAt: new Date(Date.now() - i * 3600000),
    });
  }
  for (const l of logs) {
    await prisma.activityLog.create({ data: l });
  }

  for (const u of members) {
    await prisma.notification.create({
      data: {
        userId: u.id,
        type: "TASK_UPDATED",
        message: "Welcome to Nexus — explore the command center dashboard.",
        link: "/app/dashboard",
      },
    });
  }

  console.log("Seed complete. Demo password for all users:", pass);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
