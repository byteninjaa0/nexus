import prisma from "./prisma.js";

export async function logActivity({ userId, action, entityType, entityId, metadata }) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        metadata: metadata ?? undefined,
      },
    });
  } catch (e) {
    console.warn("activity log failed", e.message);
  }
}
