import prisma from "../services/prisma.js";
import { AppError } from "../utils/AppError.js";
import { logActivity } from "../services/activity.js";
import { notifyUser } from "../services/notifications.js";

async function getMembership(user, projectId) {
  if (user.role === "ADMIN") {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return null;
    return { role: "OWNER", project, isGlobalAdmin: true };
  }
  const row = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } },
    include: { project: true },
  });
  if (!row) return null;
  return { role: row.role, project: row.project, isGlobalAdmin: false };
}

function canManageTasks(m) {
  if (!m) return false;
  if (m.isGlobalAdmin) return true;
  return m.role === "OWNER" || m.role === "ADMIN";
}

function canEditTask(m, task, userId) {
  if (canManageTasks(m)) return true;
  if (m.role === "MEMBER" && task.assigneeId === userId) return true;
  return false;
}

const taskInclude = {
  assignee: { select: { id: true, name: true, avatar: true, email: true } },
  createdBy: { select: { id: true, name: true, avatar: true } },
  _count: { select: { comments: true } },
};

function emitTask(req, projectId, event, payload) {
  req.app.get("io")?.to(`project:${projectId}`).emit(event, payload);
}

export async function listProjectTasks(req, res) {
  const { id: projectId } = req.params;
  const m = await getMembership(req.user, projectId);
  if (!m) throw new AppError("Forbidden", 403);

  const tasks = await prisma.task.findMany({
    where: { projectId },
    orderBy: [{ status: "asc" }, { position: "asc" }],
    include: taskInclude,
  });
  res.json({ items: tasks });
}

export async function createTask(req, res) {
  const { id: projectId } = req.params;
  const m = await getMembership(req.user, projectId);
  if (!m || !canManageTasks(m)) throw new AppError("Forbidden", 403);

  const {
    title,
    description,
    status,
    priority,
    assigneeId,
    dueDate,
    tags,
    attachments,
  } = req.body;

  const maxPos = await prisma.task.aggregate({
    where: { projectId, status: status || "TODO" },
    _max: { position: true },
  });
  const position = (maxPos._max.position ?? -1) + 1;

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      status: status || "TODO",
      priority: priority || "MEDIUM",
      projectId,
      assigneeId: assigneeId || null,
      createdById: req.user.id,
      dueDate: dueDate ? new Date(dueDate) : null,
      tags: Array.isArray(tags) ? tags : [],
      attachments: attachments ?? [],
    },
    include: taskInclude,
  });

  if (assigneeId && assigneeId !== req.user.id) {
    await notifyUser({
      userId: assigneeId,
      type: "TASK_ASSIGNED",
      message: `You were assigned: ${task.title}`,
      link: `/app/projects/${projectId}?task=${task.id}`,
    });
  }

  await logActivity({
    userId: req.user.id,
    action: "TASK_CREATED",
    entityType: "Task",
    entityId: task.id,
    metadata: { projectId },
  });

  emitTask(req, projectId, "task:created", { task });

  res.status(201).json({ task });
}

export async function getTask(req, res) {
  const { id } = req.params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      ...taskInclude,
      project: { select: { id: true, name: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, avatar: true } } },
      },
    },
  });
  if (!task) throw new AppError("Task not found", 404);

  const m = await getMembership(req.user, task.projectId);
  if (!m) throw new AppError("Forbidden", 403);

  const logs = await prisma.activityLog.findMany({
    where: { entityType: "Task", entityId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  res.json({ task, activity: logs });
}

export async function updateTask(req, res) {
  const { id } = req.params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new AppError("Task not found", 404);

  const m = await getMembership(req.user, task.projectId);
  if (!m || !canEditTask(m, task, req.user.id)) throw new AppError("Forbidden", 403);

  const {
    title,
    description,
    status,
    priority,
    assigneeId,
    dueDate,
    tags,
    attachments,
    position,
  } = req.body;

  const data = {};
  if (title !== undefined) data.title = title.trim();
  if (description !== undefined) data.description = description?.trim() || null;
  if (status !== undefined) data.status = status;
  if (priority !== undefined) data.priority = priority;
  if (assigneeId !== undefined) data.assigneeId = assigneeId || null;
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
  if (tags !== undefined) data.tags = tags;
  if (attachments !== undefined) data.attachments = attachments;
  if (position !== undefined) data.position = position;

  const updated = await prisma.task.update({
    where: { id },
    data,
    include: taskInclude,
  });

  if (assigneeId && assigneeId !== task.assigneeId && assigneeId !== req.user.id) {
    await notifyUser({
      userId: assigneeId,
      type: "TASK_ASSIGNED",
      message: `You were assigned: ${updated.title}`,
      link: `/app/projects/${task.projectId}?task=${id}`,
    });
  }

  await logActivity({
    userId: req.user.id,
    action: "TASK_UPDATED",
    entityType: "Task",
    entityId: id,
    metadata: data,
  });

  emitTask(req, task.projectId, "task:updated", { task: updated });

  res.json({ task: updated });
}

export async function deleteTask(req, res) {
  const { id } = req.params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new AppError("Task not found", 404);

  const m = await getMembership(req.user, task.projectId);
  if (!m || !canManageTasks(m)) throw new AppError("Forbidden", 403);

  await prisma.task.delete({ where: { id } });
  await logActivity({
    userId: req.user.id,
    action: "TASK_DELETED",
    entityType: "Task",
    entityId: id,
    metadata: { projectId: task.projectId },
  });

  emitTask(req, task.projectId, "task:deleted", { taskId: id });

  res.status(204).send();
}

export async function patchStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new AppError("Task not found", 404);

  const m = await getMembership(req.user, task.projectId);
  if (!m || !canEditTask(m, task, req.user.id)) throw new AppError("Forbidden", 403);

  const updated = await prisma.task.update({
    where: { id },
    data: { status },
    include: taskInclude,
  });

  await logActivity({
    userId: req.user.id,
    action: "TASK_STATUS",
    entityType: "Task",
    entityId: id,
    metadata: { status },
  });

  emitTask(req, task.projectId, "task:updated", { task: updated });

  res.json({ task: updated });
}

export async function patchAssign(req, res) {
  const { id } = req.params;
  const { assigneeId } = req.body;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new AppError("Task not found", 404);

  const m = await getMembership(req.user, task.projectId);
  if (!m || !canManageTasks(m)) throw new AppError("Forbidden", 403);

  const updated = await prisma.task.update({
    where: { id },
    data: { assigneeId: assigneeId || null },
    include: taskInclude,
  });

  if (assigneeId) {
    await notifyUser({
      userId: assigneeId,
      type: "TASK_ASSIGNED",
      message: `You were assigned: ${updated.title}`,
      link: `/app/projects/${task.projectId}?task=${id}`,
    });
  }

  emitTask(req, task.projectId, "task:updated", { task: updated });

  res.json({ task: updated });
}

export async function addComment(req, res) {
  const { id } = req.params;
  const { content } = req.body;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new AppError("Task not found", 404);

  const m = await getMembership(req.user, task.projectId);
  if (!m) throw new AppError("Forbidden", 403);

  const comment = await prisma.comment.create({
    data: { taskId: id, authorId: req.user.id, content: content.trim() },
    include: { author: { select: { id: true, name: true, avatar: true } } },
  });

  const watchers = await prisma.task.findUnique({
    where: { id },
    select: {
      assigneeId: true,
      createdById: true,
      project: { select: { members: { select: { userId: true } } } },
    },
  });
  const notifyIds = new Set(
    [watchers.assigneeId, watchers.createdById, ...watchers.project.members.map((x) => x.userId)].filter(
      Boolean,
    ),
  );
  notifyIds.delete(req.user.id);
  for (const uid of notifyIds) {
    await notifyUser({
      userId: uid,
      type: "TASK_COMMENTED",
      message: `New comment on: ${task.title}`,
      link: `/app/projects/${task.projectId}?task=${id}`,
    });
  }

  await logActivity({
    userId: req.user.id,
    action: "TASK_COMMENT",
    entityType: "Task",
    entityId: id,
    metadata: { commentId: comment.id },
  });

  req.app.get("io")?.to(`project:${task.projectId}`).emit("task:updated", {
    task: await prisma.task.findUnique({
      where: { id },
      include: taskInclude,
    }),
  });

  res.status(201).json({ comment });
}

export async function listComments(req, res) {
  const { id } = req.params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) throw new AppError("Task not found", 404);
  const m = await getMembership(req.user, task.projectId);
  if (!m) throw new AppError("Forbidden", 403);

  const items = await prisma.comment.findMany({
    where: { taskId: id },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, name: true, avatar: true } } },
  });
  res.json({ items });
}
