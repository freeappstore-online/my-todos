import { useState, useEffect, useCallback, useMemo } from "react";
import { Shell } from "./components/Shell";

type Priority = "low" | "medium" | "high";
type Filter = "all" | "active" | "completed";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  createdAt: number;
}

const STORAGE_KEY = "todo_app_data";

const priorityConfig: Record<Priority, { label: string; color: string; dot: string }> = {
  low:    { label: "Low",    color: "var(--success)", dot: "#16a34a" },
  medium: { label: "Medium", color: "var(--warning)", dot: "#d97706" },
  high:   { label: "High",   color: "var(--error)",   dot: "#dc2626" },
};

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [filter, setFilter] = useState<Filter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const addTodo = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setTodos(prev => [
      {
        id: generateId(),
        text,
        completed: false,
        priority,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setInput("");
  }, [input, priority]);

  const toggleTodo = useCallback((id: string) => {
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  }, []);

  const startEdit = useCallback((todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  }, []);

  const saveEdit = useCallback(() => {
    const text = editText.trim();
    if (!text) return;
    setTodos(prev =>
      prev.map(t => (t.id === editingId ? { ...t, text } : t))
    );
    setEditingId(null);
    setEditText("");
  }, [editingId, editText]);

  const clearCompleted = useCallback(() => {
    setTodos(prev => prev.filter(t => !t.completed));
  }, []);

  const filteredTodos = useMemo(() => {
    return todos.filter(t => {
      if (filter === "active") return !t.completed;
      if (filter === "completed") return t.completed;
      return true;
    });
  }, [todos, filter]);

  const activeCount = useMemo(() => todos.filter(t => !t.completed).length, [todos]);
  const completedCount = useMemo(() => todos.filter(t => t.completed).length, [todos]);

  const filterTabs: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "completed", label: "Done" },
  ];

  return (
    <Shell>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-4xl font-bold mb-1"
            style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}
          >
            My Todos
          </h1>
          <p style={{ color: "var(--muted)" }}>
            {activeCount} task{activeCount !== 1 ? "s" : ""} remaining
          </p>
        </div>

        {/* Add Todo */}
        <div
          className="flex flex-col gap-3 p-4 rounded-[1.25rem] mb-6"
          style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addTodo()}
            placeholder="What needs to be done?"
            className="w-full bg-transparent outline-none text-base placeholder:opacity-50"
            style={{ color: "var(--ink)" }}
          />
          <div className="flex items-center gap-3">
            {/* Priority selector */}
            <div className="flex gap-2">
              {(["low", "medium", "high"] as Priority[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[0.75rem] text-sm font-medium transition-all"
                  style={{
                    background: priority === p ? priorityConfig[p].color : "transparent",
                    color: priority === p ? "#fff" : "var(--muted)",
                    border: `1.5px solid ${priority === p ? priorityConfig[p].color : "var(--line)"}`,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: priorityConfig[p].dot, opacity: priority === p ? 1 : 0.5 }}
                  />
                  {priorityConfig[p].label}
                </button>
              ))}
            </div>
            <button
              onClick={addTodo}
              disabled={!input.trim()}
              className="ml-auto px-5 py-1.5 rounded-[0.75rem] text-sm font-semibold transition-all disabled:opacity-40"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div
          className="flex gap-1 p-1 rounded-[0.75rem] mb-4 w-fit"
          style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
        >
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className="px-4 py-1.5 rounded-[0.5rem] text-sm font-medium transition-all"
              style={{
                background: filter === tab.key ? "var(--accent)" : "transparent",
                color: filter === tab.key ? "#fff" : "var(--muted)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Todo list */}
        <div className="flex flex-col gap-2">
          {filteredTodos.length === 0 && (
            <div
              className="text-center py-16 rounded-[1.25rem]"
              style={{ color: "var(--muted)", border: "1.5px dashed var(--line)" }}
            >
              <div className="text-4xl mb-3">
                {filter === "completed" ? "🎉" : filter === "active" ? "✅" : "📝"}
              </div>
              <p className="font-medium">
                {filter === "completed"
                  ? "No completed tasks yet"
                  : filter === "active"
                  ? "No active tasks — you're all caught up!"
                  : "No tasks yet. Add one above!"}
              </p>
            </div>
          )}

          {filteredTodos.map(todo => (
            <div
              key={todo.id}
              className="flex items-center gap-3 px-4 py-3 rounded-[1.25rem] group transition-all"
              style={{
                background: "var(--panel)",
                border: "1px solid var(--line)",
                opacity: todo.completed ? 0.65 : 1,
              }}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleTodo(todo.id)}
                className="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                style={{
                  borderColor: todo.completed ? "var(--accent)" : "var(--line-strong)",
                  background: todo.completed ? "var(--accent)" : "transparent",
                }}
                aria-label={todo.completed ? "Mark incomplete" : "Mark complete"}
              >
                {todo.completed && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              {/* Priority dot */}
              <span
                className="shrink-0 w-2 h-2 rounded-full"
                style={{ background: priorityConfig[todo.priority].color }}
                title={`${priorityConfig[todo.priority].label} priority`}
              />

              {/* Text / Edit */}
              {editingId === todo.id ? (
                <input
                  autoFocus
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  onBlur={saveEdit}
                  className="flex-1 bg-transparent outline-none text-sm font-medium border-b"
                  style={{ color: "var(--ink)", borderColor: "var(--accent)" }}
                />
              ) : (
                <span
                  className="flex-1 text-sm font-medium cursor-pointer"
                  style={{
                    color: "var(--ink)",
                    textDecoration: todo.completed ? "line-through" : "none",
                  }}
                  onDoubleClick={() => !todo.completed && startEdit(todo)}
                  title="Double-click to edit"
                >
                  {todo.text}
                </span>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!todo.completed && editingId !== todo.id && (
                  <button
                    onClick={() => startEdit(todo)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: "var(--muted)" }}
                    title="Edit"
                    aria-label="Edit"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: "var(--muted)" }}
                  title="Delete"
                  aria-label="Delete"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {completedCount > 0 && (
          <div className="flex justify-end mt-4">
            <button
              onClick={clearCompleted}
              className="text-sm px-4 py-1.5 rounded-[0.75rem] transition-colors"
              style={{ color: "var(--muted)", border: "1px solid var(--line)" }}
            >
              Clear {completedCount} completed
            </button>
          </div>
        )}
      </div>
    </Shell>
  );
}
