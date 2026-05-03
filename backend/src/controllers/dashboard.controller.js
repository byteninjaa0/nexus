import prisma from "../services/prisma.js";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function stats(req, res) {
  const userId = req.user.id;
  const isAdmin = req.user.role === "ADMIN";

  const projectFilter = isAdmin
    ? {}
    : { members: { some: { userId } } };

  const taskFilter = isAdmin
    ? {}
    : {
        OR: [
          { assigneeId: userId },
          { project: { members: { some: { userId } } } },
        ],
      };

  const [totalProjects, tasksToday, overdue, completed] = await Promise.all([
    prisma.project.count({ where: projectFilter }),
    prisma.task.count({
      where: {
        ...taskFilter,
        updatedAt: { gte: startOfToday() },
      },
    }),
    prisma.task.count({
      where: {
        ...taskFilter,
        status: { not: "DONE" },
        dueDate: { lt: new Date() },
      },
    }),
    prisma.task.count({
      where: {
        ...taskFilter,
        status: "DONE",
      },
    }),
  ]);

  const statusBreakdown = await prisma.task.groupBy({
    by: ["status"],
    where: taskFilter,
    _count: true,
  });

  const last14 = new Date();
  last14.setDate(last14.getDate() - 14);

  const activityRaw = await prisma.activityLog.findMany({
    where: {
      createdAt: { gte: last14 },
      ...(isAdmin ? {} : { userId }),
    },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  const byDay = {};
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    d.setHours(0, 0, 0, 0);
    byDay[d.toISOString().slice(0, 10)] = 0;
  }
  for (const row of activityRaw) {
    const key = row.createdAt.toISOString().slice(0, 10);
    if (key in byDay) byDay[key]++;
  }
  const activitySeries = Object.entries(byDay).map(([date, count]) => ({ date, count }));

  res.json({
    totalProjects,
    tasksToday,
    overdue,
    completed,
    statusBreakdown: statusBreakdown.map((s) => ({ status: s.status, count: s._count })),
    activitySeries,
  });
}

export async function activityFeed(req, res) {
  const userId = req.user.id;
  const isAdmin = req.user.role === "ADMIN";

  const items = await prisma.activityLog.findMany({
    where: isAdmin ? {} : { userId },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
  });
  res.json({ items });
}

export async function overdueList(req, res) {
  const userId = req.user.id;
  const isAdmin = req.user.role === "ADMIN";

  const items = await prisma.task.findMany({
    where: {
      status: { not: "DONE" },
      dueDate: { lt: new Date() },
      ...(isAdmin
        ? {}
        : {
            OR: [
              { assigneeId: userId },
              { project: { members: { some: { userId } } } },
            ],
          }),
    },
    orderBy: { dueDate: "asc" },
    take: 20,
    include: {
      project: { select: { id: true, name: true, color: true } },
      assignee: { select: { id: true, name: true, avatar: true } },
    },
  });
  res.json({ items });
}
