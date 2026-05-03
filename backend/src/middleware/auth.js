import { verifyAccessToken } from "../utils/jwt.js";
import prisma from "../services/prisma.js";
import { AppError } from "../utils/AppError.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new AppError("Unauthorized", 401);
    }
    const token = header.slice(7);
    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        deactivated: true,
      },
    });
    if (!user || user.deactivated) {
      throw new AppError("Unauthorized", 401);
    }
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}
