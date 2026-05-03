import prisma from "../services/prisma.js";
import { AppError } from "../utils/AppError.js";
import { logActivity } from "../services/activity.js";
import { notifyUser } from "../services/notifications.js";

const projectInclude = {
  members: {
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
    },
  },
  _count: { select: { tasks: true } },
};

export async function listMyProjects(req, res) {
  if (req.user.role === "ADMIN") {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        ...projectInclude,
        tasks: { select: { id: true, status: true } },
      },
    });
    return res.json({ items: projects.map(enrichProgress) });
  }

  const memberships = await prisma.projectMember.findMany({
    where: { userId: req.user.id },
    include: {
      project: {
        include: {
          ...projectInclude,
          tasks: { select: { id: true, status: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });
  const items = memberships.map((m) => enrichProgress({ ...m.project, myRole: m.role }));
  res.json({ items });
}

function enrichProgress(project) {
  const tasks = project.tasks || [];
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "DONE").length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);
  const { tasks: _t, ...rest } = project;
  return { ...rest, progress, taskCount: total };
}

export async function createProject(req, res) {
  const { name, description, color, icon, deadline, memberIds } = req.body;

  const p = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      color: color || "#3b82f6",
      icon: icon || "folder",
      deadline: deadline ? new Date(deadline) : null,
      createdById: req.user.id,
      members: {
        create: [{ userId: req.user.id, role: "OWNER" }],
      },
    },
    include: projectInclude,
  });

  const ids = Array.isArray(memberIds) ? [...new Set(memberIds)].filter((id) => id !== req.user.id) : [];
  for (const uid of ids) {
    const u = await prisma.user.findUnique({ where: { id: uid } });
    if (u && !u.deactivated) {
      await prisma.projectMember.create({
        data: { projectId: p.id, userId: uid, role: "MEMBER" },
      });
      await notifyUser({
        userId: uid,
        type: "MEMBER_ADDED",
        message: `You were added to project "${p.name}"`,
        link: `/app/projects/${p.id}`,
      });
    }
  }

  const project = await prisma.project.findUnique({
    where: { id: p.id },
    include: {
      ...projectInclude,
      tasks: { select: { id: true, status: true } },
    },
  });

  await logActivity({
    userId: req.user.id,
    action: "PROJECT_CREATED",
    entityType: "Project",
    entityId: project.id,
    metadata: { name: project.name },
  });

  res.status(201).json({ project: enrichProgress(project) });
}

export async function getProject(req, res) {
  const { id } = req.params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      ...projectInclude,
      tasks: {
        orderBy: [{ status: "asc" }, { position: "asc" }],
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          createdBy: { select: { id: true, name: true, avatar: true } },
          _count: { select: { comments: true } },
        },
      },
    },
  });
  if (!project) throw new AppError("Project not found", 404);

  let myRole = null;
  if (req.user.role !== "ADMIN") {
    const m = project.members.find((x) => x.userId === req.user.id);
    if (!m) throw new AppError("Forbidden", 403);
    myRole = m.role;
  } else myRole = "OWNER";

  const { tasks, ...rest } = project;
  const progress =
    tasks.length === 0 ? 0 : Math.round((tasks.filter((t) => t.status === "DONE").length / tasks.length) * 100);

  res.json({
    project: {
      ...rest,
      tasks,
      progress,
      taskCount: tasks.length,
      myRole,
    },
  });
}

export async function updateProject(req, res) {
  const { id } = req.params;
  const { name, description, status, color, icon, deadline } = req.body;
  const data = {};
  if (name !== undefined) data.name = name.trim();
  if (description !== undefined) data.description = description?.trim() || null;
  if (status !== undefined) data.status = status;
  if (color !== undefined) data.color = color;
  if (icon !== undefined) data.icon = icon;
  if (deadline !== undefined) data.deadline = deadline ? new Date(deadline) : null;

  const project = await prisma.project.update({
    where: { id },
    data,
    include: { ...projectInclude, tasks: { select: { id: true, status: true } } },
  });

  await logActivity({
    userId: req.user.id,
    action: "PROJECT_UPDATED",
    entityType: "Project",
    entityId: id,
    metadata: data,
  });

  res.json({ project: enrichProgress(project) });
}

export async function deleteProject(req, res) {
  const { id } = req.params;
  await prisma.project.delete({ where: { id } });
  await logActivity({
    userId: req.user.id,
    action: "PROJECT_DELETED",
    entityType: "Project",
    entityId: id,
    metadata: {},
  });
  res.status(204).send();
}

export async function addMember(req, res) {
  const { id } = req.params;
  const { userId, role = "MEMBER" } = req.body;
  if (!userId) throw new AppError("userId required", 400);

  const exists = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId: id } },
  });
  if (exists) throw new AppError("Already a member", 409);

  const member = await prisma.projectMember.create({
    data: { projectId: id, userId, role },
    include: { user: { select: { id: true, name: true, email: true, avatar: true, role: true } } },
  });

  const project = await prisma.project.findUnique({ where: { id } });
  await notifyUser({
    userId,
    type: "MEMBER_ADDED",
    message: `You were added to project "${project.name}"`,
    link: `/app/projects/${id}`,
  });

  req.app.get("io")?.to(`project:${id}`).emit("member:added", { userId, projectId: id });

  await logActivity({
    userId: req.user.id,
    action: "PROJECT_MEMBER_ADDED",
    entityType: "Project",
    entityId: id,
    metadata: { addedUserId: userId },
  });

  res.status(201).json({ member });
}

export async function removeMember(req, res) {
  const { id, uid } = req.params;
  const target = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: uid, projectId: id } },
  });
  if (!target) throw new AppError("Not a member", 404);
  if (target.role === "OWNER") throw new AppError("Cannot remove owner", 400);

  await prisma.projectMember.delete({ where: { id: target.id } });
  await logActivity({
    userId: req.user.id,
    action: "PROJECT_MEMBER_REMOVED",
    entityType: "Project",
    entityId: id,
    metadata: { removedUserId: uid },
  });
  res.status(204).send();
}

export async function updateMemberRole(req, res) {
  const { id, uid } = req.params;
  const { role } = req.body;
  const target = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: uid, projectId: id } },
  });
  if (!target) throw new AppError("Not a member", 404);
  if (target.role === "OWNER") throw new AppError("Cannot change owner role here", 400);

  const updated = await prisma.projectMember.update({
    where: { id: target.id },
    data: { role },
    include: { user: { select: { id: true, name: true, email: true, avatar: true, role: true } } },
  });
  res.json({ member: updated });
}
