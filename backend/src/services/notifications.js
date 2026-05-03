import prisma from "./prisma.js";
import { getIo } from "../realtime.js";

export async function notifyUser({ userId, type, message, link }) {
  const n = await prisma.notification.create({
    data: { userId, type, message, link: link ?? null },
  });
  getIo()?.to(`user:${userId}`).emit("notification:new", n);
  return n;
}
