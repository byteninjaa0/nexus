import bcrypt from "bcryptjs";
import prisma from "../services/prisma.js";
import { AppError } from "../utils/AppError.js";
import { pagination } from "../utils/validators.js";
import { logActivity } from "../services/activity.js";

const userPublic = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
  deactivated: true,
  lastActiveAt: true,
  createdAt: true,
};

export async function listUsers(req, res) {
  const { skip, limit, page } = pagination(req);
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: userPublic,
    }),
    prisma.user.count(),
  ]);
  res.json({ items, page, limit, total });
}

export async function getUser(req, res) {
  const { id } = req.params;
  if (req.user.role !== "ADMIN" && req.user.id !== id) {
    throw new AppError("Forbidden", 403);
  }
  const user = await prisma.user.findUnique({
    where: { id },
    select: userPublic,
  });
  if (!user) throw new AppError("User not found", 404);
  res.json({ user });
}

export async function updateUser(req, res) {
  const { id } = req.params;
  if (req.user.role !== "ADMIN" && req.user.id !== id) {
    throw new AppError("Forbidden", 403);
  }
  const { name, email, password, avatar, role, deactivated } = req.body;
  const data = {};
  if (name !== undefined) data.name = name.trim();
  if (email !== undefined) {
    const nextEmail = email.toLowerCase();
    if (req.user.role !== "ADMIN" && nextEmail !== req.user.email) {
      throw new AppError("Cannot change email", 403);
    }
    const taken = await prisma.user.findFirst({
      where: { email: nextEmail, NOT: { id } },
    });
    if (taken) throw new AppError("Email in use", 409);
    data.email = nextEmail;
  }
  if (avatar !== undefined) data.avatar = avatar;
  if (password) data.password = await bcrypt.hash(password, 12);
  if (role !== undefined && req.user.role === "ADMIN") data.role = role;
  if (deactivated !== undefined && req.user.role === "ADMIN") data.deactivated = deactivated;

  const user = await prisma.user.update({
    where: { id },
    data,
    select: userPublic,
  });

  await logActivity({
    userId: req.user.id,
    action: "USER_UPDATED",
    entityType: "User",
    entityId: id,
    metadata: { fields: Object.keys(data) },
  });

  res.json({ user });
}

export async function deleteUser(req, res) {
  const { id } = req.params;
  if (req.user.id === id) throw new AppError("Cannot delete yourself", 400);
  await prisma.user.delete({ where: { id } });
  await logActivity({
    userId: req.user.id,
    action: "USER_DELETED",
    entityType: "User",
    entityId: id,
    metadata: {},
  });
  res.status(204).send();
}

export async function userActivity(req, res) {
  const { id } = req.params;
  if (req.user.role !== "ADMIN" && req.user.id !== id) {
    throw new AppError("Forbidden", 403);
  }
  const { skip, limit } = pagination(req);
  const items = await prisma.activityLog.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
  });
  res.json({ items });
}
