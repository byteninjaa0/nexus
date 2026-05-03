import { api } from "./client.js";

export const authApi = {
  signup: (body) => api.post("/api/auth/signup", body),
  login: (body) => api.post("/api/auth/login", body),
  logout: (body) => api.post("/api/auth/logout", body),
  me: () => api.get("/api/auth/me"),
  checkEmail: (email) => api.get("/api/auth/check-email", { params: { email } }),
};

export const dashboardApi = {
  stats: () => api.get("/api/dashboard/stats"),
  activity: () => api.get("/api/dashboard/activity"),
  overdue: () => api.get("/api/dashboard/overdue"),
};

export const projectsApi = {
  list: () => api.get("/api/projects"),
  get: (id) => api.get(`/api/projects/${id}`),
  create: (body) => api.post("/api/projects", body),
  update: (id, body) => api.patch(`/api/projects/${id}`, body),
  remove: (id) => api.delete(`/api/projects/${id}`),
  addMember: (id, body) => api.post(`/api/projects/${id}/members`, body),
  removeMember: (id, uid) => api.delete(`/api/projects/${id}/members/${uid}`),
  updateMemberRole: (id, uid, body) => api.patch(`/api/projects/${id}/members/${uid}`, body),
  tasks: (id) => api.get(`/api/projects/${id}/tasks`),
  createTask: (id, body) => api.post(`/api/projects/${id}/tasks`, body),
};

export const tasksApi = {
  get: (id) => api.get(`/api/tasks/${id}`),
  update: (id, body) => api.patch(`/api/tasks/${id}`, body),
  remove: (id) => api.delete(`/api/tasks/${id}`),
  status: (id, status) => api.patch(`/api/tasks/${id}/status`, { status }),
  assign: (id, assigneeId) => api.patch(`/api/tasks/${id}/assign`, { assigneeId }),
  comments: (id) => api.get(`/api/tasks/${id}/comments`),
  addComment: (id, content) => api.post(`/api/tasks/${id}/comments`, { content }),
};

export const notificationsApi = {
  list: () => api.get("/api/notifications"),
  readAll: () => api.post("/api/notifications/read-all"),
  read: (id) => api.patch(`/api/notifications/${id}/read`),
  dismiss: (id) => api.delete(`/api/notifications/${id}`),
};

export const usersApi = {
  list: () => api.get("/api/users"),
  update: (id, body) => api.patch(`/api/users/${id}`, body),
};

export const adminApi = {
  stats: () => api.get("/api/admin/stats"),
  activity: (params) => api.get("/api/admin/activity", { params }),
};
