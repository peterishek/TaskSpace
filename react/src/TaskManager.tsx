import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { getTasks, createTask, updateTask, deleteTask, logout } from "./api";

interface Task {
  id?: string | number;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "to-do" | "in-progress" | "done";
}

interface TaskManagerProps {
  onLogout: () => void;
}

const PRIORITY_CHOICES: Task["priority"][] = ["low", "medium", "high"];
const STATUS_CHOICES: Task["status"][] = ["to-do", "in-progress", "done"];
const emptyForm: Task = { title: "", description: "", priority: "medium", status: "to-do" };

export default function TaskManager({ onLogout }: TaskManagerProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState<Task>(emptyForm);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      setLoading(true);
      const data = await getTasks();
      setTasks(data.results ?? data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value } as Task));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.title.trim()) return;

    try {
      if (editingId) {
        const updated = await updateTask(editingId, form);
        setTasks(tasks.map((t) => (t.id === editingId ? updated : t)));
      } else {
        const created = await createTask(form);
        setTasks([created, ...tasks]);
      }
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save task.");
    }
  }

  function startEdit(task: Task) {
    if (task.id !== undefined) {
      setEditingId(task.id);
      setForm({ ...task });
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id?: string | number) {
    if (!id || !window.confirm("Delete this task?")) return;
    try {
      await deleteTask(id);
      setTasks(tasks.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task.");
    }
  }

  function handleLogout() {
    logout();
    onLogout();
  }

  const getPriorityStyle = (p: string) => {
    switch (p) {
      case "high":
        return { backgroundColor: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca" };
      case "medium":
        return { backgroundColor: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" };
      default:
        return { backgroundColor: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" };
    }
  };

  const getStatusStyle = (s: string) => {
    switch (s) {
      case "done":
        return { backgroundColor: "#dbeafe", color: "#1e40af", border: "1px solid #bfdbfe" };
      case "in-progress":
        return { backgroundColor: "#f3e8ff", color: "#6b21a8", border: "1px solid #e9d5ff" };
      default:
        return { backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" };
    }
  };

  return (
    <div style={tmStyles.wrapper}>
      <div style={tmStyles.container}>
        <header style={tmStyles.header}>
          <div style={tmStyles.logoHeader}>
            <span style={{ fontSize: "2rem" }}>✅</span>
            <h1 style={tmStyles.mainTitle}>TaskSpace</h1>
          </div>
          <button onClick={handleLogout} style={tmStyles.logoutBtn}>
            Sign Out
          </button>
        </header>

        {error && <div style={tmStyles.errorBanner}>{error}</div>}

        <div style={tmStyles.formCard}>
          <h3 style={tmStyles.formTitle}>{editingId ? "✍️ Edit Task" : "➕ Add New Task"}</h3>
          <form onSubmit={handleSubmit} style={tmStyles.form}>
            <input
              name="title"
              placeholder="What needs to get done?"
              value={form.title}
              onChange={handleChange}
              required
              style={tmStyles.input}
            />
            <textarea
              name="description"
              placeholder="Additional notes, context, or details..."
              value={form.description}
              onChange={handleChange}
              style={tmStyles.textarea}
            />

            <div style={tmStyles.selectGroup}>
              <div style={tmStyles.flexControl}>
                <label style={tmStyles.selectLabel}>Priority</label>
                <select name="priority" value={form.priority} onChange={handleChange} style={tmStyles.select}>
                  {PRIORITY_CHOICES.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={tmStyles.flexControl}>
                <label style={tmStyles.selectLabel}>Status</label>
                <select name="status" value={form.status} onChange={handleChange} style={tmStyles.select}>
                  {STATUS_CHOICES.map((s) => (
                    <option key={s} value={s}>
                      {s === "in-progress" ? "In Progress" : s === "to-do" ? "To-Do" : "Done"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={tmStyles.btnRow}>
              <button type="submit" style={tmStyles.submitBtn}>
                {editingId ? "💾 Update Task" : "🚀 Add Task"}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} style={tmStyles.cancelBtn}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <main>
          <div style={tmStyles.tasksHeader}>
            <h2 style={tmStyles.tasksTitle}>
              Your Tasks <span style={tmStyles.taskCount}>({tasks.length})</span>
            </h2>
          </div>

          {loading ? (
            <div style={tmStyles.loadingState}>Loading your tasks...</div>
          ) : tasks.length === 0 ? (
            <div style={tmStyles.emptyState}>
              <div style={{ fontSize: "4rem", marginBottom: "1rem", opacity: 0.6 }}>📭</div>
              <p>No tasks yet. Add one above to get started!</p>
            </div>
          ) : (
            <ul style={tmStyles.taskList}>
              {tasks.map((task) => (
                <li key={task.id} style={tmStyles.taskCard}>
                  <div style={tmStyles.taskHeader}>
                    <div style={tmStyles.taskTitleWrapper}>
                      <strong style={tmStyles.taskTitle}>{task.title}</strong>
                    </div>
                    <div style={tmStyles.pillContainer}>
                      <span style={{ ...tmStyles.pill, ...getPriorityStyle(task.priority) }}>{task.priority}</span>
                      <span style={{ ...tmStyles.pill, ...getStatusStyle(task.status) }}>
                        {task.status.replace("-", " ")}
                      </span>
                    </div>
                  </div>

                  {task.description && <p style={tmStyles.taskDesc}>{task.description}</p>}

                  <div style={tmStyles.taskActions}>
                    <button onClick={() => startEdit(task)} style={tmStyles.actionEdit}>
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleDelete(task.id)} style={tmStyles.actionDel}>
                      🗑️ Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </div>
  );
}

const tmStyles = {
  wrapper: {
    background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
    minHeight: "100vh",
    fontFamily: "var(--body)",
    padding: "2.5rem 1.5rem",
    color: "#334155",
    boxSizing: "border-box" as const,
  },
  container: {
    width: "100%",
    maxWidth: "820px",
    margin: "0 auto",
    boxSizing: "border-box" as const,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  logoHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  mainTitle: {
    margin: 0,
    fontFamily: "var(--heading)",
    fontSize: "2rem",
    fontWeight: 800,
    background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.02em",
  },
  logoutBtn: {
    backgroundColor: "#ffffff",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "0.65rem 1.25rem",
    fontFamily: "var(--body)",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 1px 2px rgb(0 0 0 / 0.05)",
  },

  errorBanner: {
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    padding: "1rem 1.25rem",
    borderRadius: "12px",
    fontSize: "0.95rem",
    marginBottom: "1.5rem",
    border: "1px solid #fee2e2",
  },

  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "2rem",
    marginBottom: "2.5rem",
    boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.08)",
    border: "1px solid #f1f5f9",
  },
  formTitle: {
    margin: "0 0 1.5rem 0",
    fontFamily: "var(--heading)",
    fontSize: "1.35rem",
    fontWeight: 700,
    color: "#1e293b",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
  },
  input: {
    padding: "0.9rem 1.1rem",
    borderRadius: "12px",
    border: "2px solid #e2e8f0",
    fontSize: "1rem",
    fontFamily: "var(--body)",
    color: "#0f172a",
    outline: "none",
    backgroundColor: "#f8fafc",
    width: "100%",
    boxSizing: "border-box" as const,
  },
  textarea: {
    padding: "0.9rem 1.1rem",
    borderRadius: "12px",
    border: "2px solid #e2e8f0",
    fontSize: "1rem",
    fontFamily: "var(--body)",
    color: "#0f172a",
    outline: "none",
    backgroundColor: "#f8fafc",
    width: "100%",
    minHeight: "80px",
    resize: "vertical" as const,
    boxSizing: "border-box" as const,
  },
  selectGroup: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap" as const,
  },
  flexControl: {
    flex: "1 1 160px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.4rem",
  },
  selectLabel: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#64748b",
  },
  select: {
    padding: "0.75rem 1rem",
    borderRadius: "10px",
    border: "2px solid #e2e8f0",
    fontSize: "0.95rem",
    fontFamily: "var(--body)",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    cursor: "pointer",
  },
  btnRow: {
    display: "flex",
    gap: "0.75rem",
    marginTop: "0.5rem",
  },
  submitBtn: {
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    padding: "0.85rem 1.5rem",
    borderRadius: "12px",
    border: "none",
    fontSize: "1rem",
    fontFamily: "var(--body)",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 15px -3px rgb(79 70 229 / 0.3)",
  },
  cancelBtn: {
    backgroundColor: "#f1f5f9",
    color: "#475569",
    padding: "0.85rem 1.5rem",
    borderRadius: "12px",
    border: "none",
    fontSize: "1rem",
    fontFamily: "var(--body)",
    fontWeight: 600,
    cursor: "pointer",
  },

  tasksHeader: {
    marginBottom: "1.25rem",
  },
  tasksTitle: {
    margin: 0,
    fontFamily: "var(--heading)",
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#1e293b",
  },
  taskCount: {
    color: "#94a3b8",
    fontWeight: 500,
    fontSize: "1.1rem",
  },

  loadingState: {
    textAlign: "center" as const,
    color: "#64748b",
    padding: "3rem 0",
    fontSize: "1rem",
  },
  emptyState: {
    textAlign: "center" as const,
    color: "#64748b",
    padding: "3rem 1rem",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    border: "1px dashed #e2e8f0",
  },

  taskList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
  },
  taskCard: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "1.25rem 1.5rem",
    boxShadow: "0 1px 3px rgb(0 0 0 / 0.06)",
    border: "1px solid #f1f5f9",
  },
  taskHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "1rem",
    flexWrap: "wrap" as const,
  },
  taskTitleWrapper: {
    flex: "1 1 auto",
  },
  taskTitle: {
    fontFamily: "var(--heading)",
    fontSize: "1.15rem",
    fontWeight: 700,
    color: "#111827",
  },
  pillContainer: {
    display: "flex",
    gap: "0.5rem",
    flexShrink: 0,
  },
  pill: {
    padding: "0.3rem 0.75rem",
    borderRadius: "999px",
    fontSize: "0.8rem",
    fontWeight: 600,
    textTransform: "capitalize" as const,
    whiteSpace: "nowrap" as const,
  },
  taskDesc: {
    margin: "0.75rem 0 0 0",
    color: "#64748b",
    fontSize: "0.95rem",
    lineHeight: 1.5,
  },
  taskActions: {
    display: "flex",
    gap: "0.75rem",
    marginTop: "1rem",
  },
  actionEdit: {
    backgroundColor: "#eef2ff",
    color: "#4338ca",
    border: "none",
    borderRadius: "10px",
    padding: "0.5rem 1rem",
    fontSize: "0.9rem",
    fontFamily: "var(--body)",
    fontWeight: 600,
    cursor: "pointer",
  },
  actionDel: {
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    border: "none",
    borderRadius: "10px",
    padding: "0.5rem 1rem",
    fontSize: "0.9rem",
    fontFamily: "var(--body)",
    fontWeight: 600,
    cursor: "pointer",
  },
};