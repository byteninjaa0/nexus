import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { motion } from "framer-motion";

const timelineParent = {
  initial: {},
  animate: { transition: { staggerChildren: 0.05 } },
};
const timelineItem = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 26 } },
};
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Plus, Settings, Trash2 } from "lucide-react";
import { projectsApi, tasksApi } from "../api/endpoints.js";
import { useSocket } from "../hooks/useSocket.js";
import { useAuthStore } from "../store/authStore.js";
import { TaskDrawer } from "../components/tasks/TaskDrawer.jsx";
import { GlassCard } from "../components/ui/GlassCard.jsx";

const COLUMNS = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

export function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const socket = useSocket();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [tab, setTab] = useState("kanban");
  const [newTitles, setNewTitles] = useState({});

  const taskId = searchParams.get("task");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await projectsApi.get(id);
      setProject(data.project);
    } catch {
      toast.error("Project not found");
      navigate("/app/projects");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit("join:project", id, () => {});
    const onUpdated = ({ task }) => {
      setProject((p) => {
        if (!p) return p;
        const tasks = p.tasks.map((t) => (t.id === task.id ? { ...t, ...task } : t));
        return { ...p, tasks };
      });
    };
    const onCreated = ({ task }) => {
      setProject((p) => (p ? { ...p, tasks: [...p.tasks, task] } : p));
    };
    const onDeleted = ({ taskId: tid }) => {
      setProject((p) => (p ? { ...p, tasks: p.tasks.filter((t) => t.id !== tid) } : p));
    };
    socket.on("task:updated", onUpdated);
    socket.on("task:created", onCreated);
    socket.on("task:deleted", onDeleted);
    return () => {
      socket.emit("leave:project", id);
      socket.off("task:updated", onUpdated);
      socket.off("task:created", onCreated);
      socket.off("task:deleted", onDeleted);
    };
  }, [id, socket]);

  const grouped = useMemo(() => {
    const map = Object.fromEntries(COLUMNS.map((c) => [c, []]));
    if (!project?.tasks) return map;
    for (const t of project.tasks) {
      if (map[t.status]) map[t.status].push(t);
    }
    for (const c of COLUMNS) {
      map[c].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    }
    return map;
  }, [project]);

  const myRole = project?.myRole;
  const canManage = user?.role === "ADMIN" || myRole === "OWNER" || myRole === "ADMIN";

  async function onDragEnd(result) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const task = project.tasks.find((t) => t.id === draggableId);
    if (!task) return;

    const nextStatus = destination.droppableId;
    const prevTasks = project.tasks;
    const optimistic = project.tasks.map((t) => (t.id === draggableId ? { ...t, status: nextStatus } : t));
    setProject({ ...project, tasks: optimistic });

    try {
      await tasksApi.status(draggableId, nextStatus);
    } catch (e) {
      setProject({ ...project, tasks: prevTasks });
      toast.error(e.response?.data?.error || "Move failed");
    }
  }

  async function addTask(status) {
    const title = (newTitles[status] || "").trim();
    if (title.length < 3) {
      toast.error("Title at least 3 characters");
      return;
    }
    try {
      await projectsApi.createTask(id, { title, status });
      setNewTitles((m) => ({ ...m, [status]: "" }));
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed");
    }
  }

  async function removeProject() {
    if (!confirm("Delete this project?")) return;
    try {
      await projectsApi.remove(id);
      toast.success("Deleted");
      navigate("/app/projects");
    } catch (e) {
      toast.error(e.response?.data?.error || "Failed");
    }
  }

  if (loading || !project) {
    return <div className="skeleton glass-card" style={{ height: 320 }} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 className="display" style={{ margin: 0, fontSize: 34 }}>
            {project.name}
          </h1>
          <p style={{ color: "var(--text-muted)", maxWidth: 720 }}>{project.description}</p>
          <div className="mono" style={{ color: "var(--text-muted)", marginTop: 6 }}>
            Deadline: {project.deadline ? format(new Date(project.deadline), "PPP") : "None"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex" }}>
            {(project.members || []).map((m, idx) => (
              <img
                key={m.userId}
                src={m.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user.email}`}
                width={36}
                height={36}
                alt=""
                style={{ borderRadius: "50%", marginLeft: idx === 0 ? 0 : -10, border: "2px solid #0d1117" }}
              />
            ))}
          </div>
          {canManage && (
            <motion.button type="button" className="glass-card" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }} style={{ padding: "10px 14px", borderRadius: 12 }} onClick={() => setTab("settings")}>
              <Settings size={18} />
            </motion.button>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ display: "flex", gap: 6, padding: 6, borderRadius: 14, width: "fit-content" }}>
        {["kanban", "list", "timeline", ...(canManage ? ["settings"] : [])].map((t) => (
          <motion.button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background: tab === t ? "rgba(59,130,246,0.2)" : "transparent",
              color: tab === t ? "var(--text-primary)" : "var(--text-muted)",
              textTransform: "capitalize",
            }}
          >
            {t}
          </motion.button>
        ))}
      </div>

      {tab === "kanban" && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="scrollbar-thin" style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
            {COLUMNS.map((col) => (
              <Droppable droppableId={col} key={col}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="glass-card"
                    style={{
                      minWidth: 280,
                      padding: 12,
                      borderStyle: snapshot.isDraggingOver ? "dashed" : "solid",
                      borderColor: snapshot.isDraggingOver ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.08)",
                      background: snapshot.isDraggingOver ? "rgba(59,130,246,0.06)" : "var(--glass)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <strong>{col.replaceAll("_", " ")}</strong>
                      <span className="mono" style={{ color: "var(--text-muted)" }}>
                        {grouped[col].length}
                      </span>
                    </div>
                    {grouped[col].map((task, index) => (
                      <Draggable draggableId={task.id} index={index} key={task.id}>
                        {(p, snap) => (
                          <motion.div
                            ref={p.innerRef}
                            {...p.draggableProps}
                            {...p.dragHandleProps}
                            onClick={() => {
                              const n = new URLSearchParams(searchParams);
                              n.set("task", task.id);
                              setSearchParams(n);
                            }}
                            className="glass-card"
                            layout={false}
                            whileHover={
                              snap.isDragging
                                ? undefined
                                : { boxShadow: "0 14px 36px rgba(59,130,246,0.18)", borderColor: "rgba(59,130,246,0.25)" }
                            }
                            whileTap={snap.isDragging ? undefined : { scale: 0.99 }}
                            style={{
                              padding: 10,
                              marginBottom: 8,
                              transform: snap.isDragging ? "rotate(2deg) scale(1.04)" : undefined,
                              boxShadow: snap.isDragging ? "0 18px 50px rgba(59,130,246,0.35)" : undefined,
                            }}
                          >
                            <div style={{ fontWeight: 700 }}>{task.title}</div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
                              <span style={{ color: priorityColor(task.priority) }}>{task.priority}</span>
                              <span>{task._count?.comments ?? 0} 💬</span>
                            </div>
                          </motion.div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    <div style={{ marginTop: 8 }}>
                      <input
                        value={newTitles[col] || ""}
                        onChange={(e) => setNewTitles((m) => ({ ...m, [col]: e.target.value }))}
                        placeholder="New task title"
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "1px solid rgba(255,255,255,0.1)",
                          background: "rgba(0,0,0,0.25)",
                          color: "var(--text-primary)",
                          marginBottom: 6,
                        }}
                      />
                      <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="glass-card" style={{ width: "100%", padding: 8, borderRadius: 10 }} onClick={() => addTask(col)}>
                        <Plus size={16} style={{ display: "inline", verticalAlign: "middle" }} /> Add
                      </motion.button>
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}

      {tab === "list" && (
        <GlassCard hover={false} style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead style={{ background: "rgba(255,255,255,0.03)" }}>
              <tr>
                {["Title", "Assignee", "Priority", "Status", "Due", "Actions"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: 12, color: "var(--text-muted)", fontWeight: 600 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {project.tasks.map((t) => (
                <tr key={t.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <td style={{ padding: 12, fontWeight: 600 }}>{t.title}</td>
                  <td style={{ padding: 12 }}>{t.assignee?.name || "—"}</td>
                  <td style={{ padding: 12, color: priorityColor(t.priority) }}>{t.priority}</td>
                  <td style={{ padding: 12 }}>
                    <select
                      value={t.status}
                      onChange={async (e) => {
                        const next = e.target.value;
                        const prev = project.tasks;
                        setProject({ ...project, tasks: project.tasks.map((x) => (x.id === t.id ? { ...x, status: next } : x)) });
                        try {
                          await tasksApi.status(t.id, next);
                        } catch (err) {
                          setProject({ ...project, tasks: prev });
                          toast.error("Update failed");
                        }
                      }}
                      style={{ background: "transparent", color: "var(--text-primary)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: 6 }}
                    >
                      {COLUMNS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: 12 }} className="mono">
                    {t.dueDate ? format(new Date(t.dueDate), "MMM d") : "—"}
                  </td>
                  <td style={{ padding: 12 }}>
                    {canManage && (
                      <motion.button type="button" whileTap={{ scale: 0.94 }} style={{ border: "none", background: "rgba(239,68,68,0.15)", color: "#fecaca", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }} onClick={() => tasksApi.remove(t.id).then(load)}>
                        <Trash2 size={16} />
                      </motion.button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      {tab === "timeline" && (
        <GlassCard style={{ padding: 18 }}>
          <motion.div variants={timelineParent} initial="initial" animate="animate" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {project.tasks.map((t) => (
              <motion.div key={t.id} variants={timelineItem} style={{ display: "flex", gap: 12 }} whileHover={{ x: 4 }}>
                <div style={{ width: 4, borderRadius: 4, background: "linear-gradient(180deg,#3b82f6,#8b5cf6)" }} />
                <div>
                  <div style={{ fontWeight: 700 }}>{t.title}</div>
                  <div className="mono" style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    {t.status} · {t.dueDate ? format(new Date(t.dueDate), "PP") : "No due"}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </GlassCard>
      )}

      {tab === "settings" && canManage && (
        <GlassCard style={{ padding: 18 }}>
          <h3>Danger zone</h3>
          <p style={{ color: "var(--text-muted)" }}>Permanently remove this project and its tasks.</p>
          <motion.button type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="glass-card" style={{ padding: "10px 16px", borderRadius: 12, border: "1px solid rgba(239,68,68,0.35)", color: "#fecaca" }} onClick={removeProject}>
            Delete project
          </motion.button>
        </GlassCard>
      )}

      <TaskDrawer
        taskId={taskId}
        members={project.members}
        onClose={() => {
          const next = new URLSearchParams(searchParams);
          next.delete("task");
          setSearchParams(next);
        }}
        onSaved={load}
      />
    </div>
  );
}

function priorityColor(p) {
  if (p === "URGENT") return "var(--accent-red)";
  if (p === "HIGH") return "var(--accent-amber)";
  if (p === "MEDIUM") return "var(--accent-cyan)";
  return "var(--text-muted)";
}
