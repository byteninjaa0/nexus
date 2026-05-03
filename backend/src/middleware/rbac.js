import prisma from "../services/prisma.js";
import { AppError } from "../utils/AppError.js";

export function checkRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError("Unauthorized", 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError("Forbidden", 403));
    }
    next();
  };
}

/** Loads membership for req.params.id (project id) into req.projectMembership */
export function checkProjectRole(...roles) {
  return async (req, res, next) => {
    try {
      if (!req.user) return next(new AppError("Unauthorized", 401));
      const projectId = req.params.id || req.params.projectId;
      if (!projectId) return next(new AppError("Project id required", 400));

      if (req.user.role === "ADMIN") {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) return next(new AppError("Project not found", 404));
        req.projectMembership = { role: "OWNER", project, isGlobalAdmin: true };
        return next();
      }

      const membership = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: req.user.id, projectId } },
        include: { project: true },
      });
      if (!membership) {
        return next(new AppError("Forbidden", 403));
      }
      if (!roles.includes(membership.role)) {
        return next(new AppError("Forbidden", 403));
      }
      req.projectMembership = { ...membership, project: membership.project, isGlobalAdmin: false };
      next();
    } catch (e) {
      next(e);
    }
  };
}

/** Any project member (read access) */
export async function requireProjectMember(req, res, next) {
  try {
    if (!req.user) return next(new AppError("Unauthorized", 401));
    const projectId = req.params.id || req.params.projectId;
    if (!projectId) return next(new AppError("Project id required", 400));

    if (req.user.role === "ADMIN") {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) return next(new AppError("Project not found", 404));
      req.projectMembership = { role: "OWNER", project, isGlobalAdmin: true };
      return next();
    }

    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: req.user.id, projectId } },
      include: { project: true },
    });
    if (!membership) return next(new AppError("Forbidden", 403));
    req.projectMembership = { ...membership, project: membership.project, isGlobalAdmin: false };
    next();
  } catch (e) {
    next(e);
  }
}
