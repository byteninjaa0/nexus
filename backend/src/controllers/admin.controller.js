import prisma from "../services/prisma.js";
import { pagination } from "../utils/validators.js";

export async function platformStats(req, res) {
  const [users, projects, tasks, activeUsers] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.task.count(),
    prisma.user.count({ where: { lastActiveAt: { gte: new Date(Date.now() - 7 * 864e5) } } }),
  ]);
  res.json({ users, projects, tasks, activeUsersLast7d: activeUsers });
}

export async function platformActivity(req, res) {
  const { skip, limit } = pagination(req);
  const where = {};
  const { entityType, action } = req.query;
  if (entityType) where.entityType = String(entityType);
  if (action) where.action = String(action);

  const items = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
    },
  });
  res.json({ items });
}
