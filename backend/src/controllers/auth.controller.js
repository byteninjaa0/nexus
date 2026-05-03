import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import prisma from "../services/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getRefreshExpiryDate,
} from "../utils/jwt.js";
import { logActivity } from "../services/activity.js";

const userSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
  createdAt: true,
};

export async function signup(req, res) {
  const { name, email, password } = req.body;
  const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (exists) throw new AppError("Email already registered", 409);

  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase(),
      password: hash,
    },
    select: userSelect,
  });

  const refresh = uuidv4() + uuidv4();
  await prisma.refreshToken.create({
    data: {
      token: refresh,
      userId: user.id,
      expiresAt: getRefreshExpiryDate(),
    },
  });

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, jti: refresh });

  await logActivity({
    userId: user.id,
    action: "USER_SIGNUP",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email },
  });

  res.status(201).json({ accessToken, refreshToken, user });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || user.deactivated) throw new AppError("Invalid credentials", 401);
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new AppError("Invalid credentials", 401);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastActiveAt: new Date() },
  });

  const refresh = uuidv4() + uuidv4();
  await prisma.refreshToken.create({
    data: {
      token: refresh,
      userId: user.id,
      expiresAt: getRefreshExpiryDate(),
    },
  });

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, jti: refresh });

  const safe = await prisma.user.findUnique({
    where: { id: user.id },
    select: userSelect,
  });

  await logActivity({
    userId: user.id,
    action: "USER_LOGIN",
    entityType: "User",
    entityId: user.id,
    metadata: {},
  });

  res.json({ accessToken, refreshToken, user: safe });
}

export async function refresh(req, res) {
  const { refreshToken: bodyToken } = req.body;
  if (!bodyToken) throw new AppError("Refresh token required", 400);

  let payload;
  try {
    payload = verifyRefreshToken(bodyToken);
  } catch {
    throw new AppError("Invalid refresh token", 401);
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { token: payload.jti },
    include: { user: true },
  });
  if (!stored || stored.expiresAt < new Date() || stored.user.deactivated) {
    throw new AppError("Invalid refresh token", 401);
  }

  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const newJti = uuidv4() + uuidv4();
  await prisma.refreshToken.create({
    data: {
      token: newJti,
      userId: stored.userId,
      expiresAt: getRefreshExpiryDate(),
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: stored.userId },
    select: userSelect,
  });

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, jti: newJti });

  res.json({ accessToken, refreshToken, user });
}

export async function logout(req, res) {
  const { refreshToken: bodyToken } = req.body;
  if (bodyToken) {
    try {
      const payload = verifyRefreshToken(bodyToken);
      await prisma.refreshToken.deleteMany({ where: { token: payload.jti } });
    } catch {
      /* ignore */
    }
  }
  res.json({ ok: true });
}

export async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: userSelect,
  });
  res.json({ user });
}

export async function checkEmail(req, res) {
  const email = String(req.query.email || "")
    .toLowerCase()
    .trim();
  if (!email) return res.json({ available: false });
  const u = await prisma.user.findUnique({ where: { email } });
  res.json({ available: !u });
}
