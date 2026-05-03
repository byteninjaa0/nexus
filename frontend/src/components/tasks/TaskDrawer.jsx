import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { tasksApi } from "../../api/endpoints.js";

const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const statuses = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

export function TaskDrawer({ taskId, members, onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [priority, setPriority] = useState("MEDIUM");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const descRef = useRef(null);

  useEffect(() => {
    if (!taskId) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const { data } = await tasksApi.get(taskId);
        if (!alive) return;
        const t = data.task;
        setTitle(t.title);
        setDescription(t.description || "");
        setStatus(t.status);
        setPriority(t.priority);
        setAssigneeId(t.assigneeId || "");
        setDueDate(t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 16) : "");
        setTags(t.tags || []);
        setComments(t.comments || []);
        queueMicrotask(() => {
          if (descRef.current) descRef.current.innerHTML = t.description || "";
        });
      } catch {
        toast.error("Could not load task");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [taskId]);

  async function persist(partial = {}) {
    try {
      const desc = partial.description ?? descRef.current?.innerHTML ?? description;
      await tasksApi.update(taskId, {
        title,
        status,
        priority,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
        tags,
        ...partial,
        description: desc,
      });
      onSaved?.();
    } catch (e) {
      toast.error(e.response?.data?.error || "Save failed");
    }
  }

  async function sendComment() {
    if (!commentText.trim()) return;
    try {
      const { data } = await tasksApi.addComment(taskId, commentText.trim());
      setComments((c) => [...c, data.comment]);
      setCommentText("");
      onSaved?.();
    } catch (e) {
      toast.error(e.response?.data?.error || "Comment failed");
    }
  }

  return (
    <AnimatePresence>
      {taskId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          style={{ position: "fixed", inset: 0, background: "rgba(5,8,16,0.55)", zIndex: 70 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="glass-card"
            style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "min(520px, 100%)", padding: 22, overflow: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {loading ? (
              <div className="skeleton" style={{ height: 200 }} />
            ) : (
              <>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => persist()}
                  className="display"
                  style={{
                    width: "100%",
                    fontSize: 26,
                    fontWeight: 800,
                    border: "none",
                    background: "transparent",
                    color: "var(--text-primary)",
                    marginBottom: 12,
                  }}
                />
                <div
                  ref={descRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="glass-card"
                  style={{
                    width: "100%",
                    minHeight: 140,
                    padding: 12,
                    marginBottom: 14,
                    outline: "none",
                    color: "var(--text-muted)",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(0,0,0,0.25)",
                  }}
                  onInput={(e) => setDescription(e.currentTarget.innerHTML)}
                  onBlur={() => persist()}
                />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <label className="mono" style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    Status
                    <select
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value);
                        persist({ status: e.target.value });
                      }}
                      style={sel}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="mono" style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    Priority
                    <select
                      value={priority}
                      onChange={(e) => {
                        setPriority(e.target.value);
                        persist({ priority: e.target.value });
                      }}
                      style={sel}
                    >
                      {priorities.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="mono" style={{ color: "var(--text-muted)", fontSize: 12, display: "block", marginBottom: 10 }}>
                  Assignee
                  <select
                    value={assigneeId}
                    onChange={(e) => {
                      setAssigneeId(e.target.value);
                      persist({ assigneeId: e.target.value || null });
                    }}
                    style={sel}
                  >
                    <option value="">Unassigned</option>
                    {(members || []).map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user?.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="mono" style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  Due
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    onBlur={() => persist()}
                    style={sel}
                  />
                </label>

                <div style={{ marginTop: 14 }}>
                  <div className="mono" style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 6 }}>
                    Tags
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {tags.map((t) => (
                      <span key={t} className="glass-card mono" style={{ padding: "4px 8px", borderRadius: 999 }}>
                        {t}{" "}
                        <button
                          type="button"
                          style={{ border: "none", background: "none", color: "var(--accent-red)", cursor: "pointer" }}
                          onClick={async () => {
                            const next = tags.filter((x) => x !== t);
                            setTags(next);
                            await persist({ tags: next });
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add tag"
                      style={sel}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (!tagInput.trim()) return;
                          const next = [...tags, tagInput.trim()];
                          setTags(next);
                          setTagInput("");
                          await persist({ tags: next });
                        }
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 22 }}>
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>Comments</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
                    {comments.map((c) => (
                      <div key={c.id} className="glass-card" style={{ padding: 10 }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                          <img
                            src={c.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.author.id}`}
                            width={28}
                            height={28}
                            style={{ borderRadius: "50%" }}
                            alt=""
                          />
                          <div>
                            <div style={{ fontWeight: 600 }}>{c.author.name}</div>
                            <div className="mono" style={{ color: "var(--text-muted)", fontSize: 11 }}>
                              {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                        <div>{c.content}</div>
                      </div>
                    ))}
                  </div>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={3}
                    style={{ ...sel, width: "100%" }}
                    placeholder="Write a comment…"
                  />
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    className="glass-card"
                    style={{ marginTop: 8, padding: "8px 12px", borderRadius: 10 }}
                    onClick={sendComment}
                  >
                    Post
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const sel = {
  width: "100%",
  marginTop: 6,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.25)",
  color: "var(--text-primary)",
};
