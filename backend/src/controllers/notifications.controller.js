import prisma from "../services/prisma.js";

export async function listNotifications(req, res) {
  const items = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json({ items });
}

export async function markAllRead(req, res) {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, read: false },
    data: { read: true },
  });
  res.json({ ok: true });
}

export async function markRead(req, res) {
  const { id } = req.params;
  const n = await prisma.notification.findFirst({
    where: { id, userId: req.user.id },
  });
  if (!n) return res.status(404).json({ error: "Not found" });
  await prisma.notification.update({ where: { id }, data: { read: true } });
  res.json({ ok: true });
}

export async function dismiss(req, res) {
  const { id } = req.params;
  await prisma.notification.deleteMany({ where: { id, userId: req.user.id } });
  res.status(204).send();
}
