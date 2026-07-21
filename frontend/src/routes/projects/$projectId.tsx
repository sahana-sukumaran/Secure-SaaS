import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  Plus,
  Trash2,
  AlertTriangle,
  Flag,
  User as UserIcon,
} from "lucide-react";

import { api, apiErrorMessage } from "@/lib/api";

export const Route = createFileRoute("/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project — SecureFlow" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProjectDetailPage,
});

interface PopUser {
  _id: string;
  name: string;
  email: string;
}
interface Project {
  _id: string;
  name: string;
  description?: string;
  status?: string;
  owner: PopUser;
  members: { user: PopUser; role: string }[];
}
interface Task {
  _id: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "done" | string;
  priority?: "low" | "medium" | "high" | string;
  dueDate?: string;
  createdBy?: PopUser;
  assignedTo?: PopUser;
}

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const qc = useQueryClient();

  const projectQ = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data } = await api.get<{ project: Project }>(`/api/projects/${projectId}`);
      return data.project;
    },
  });

  const tasksQ = useQuery({
    queryKey: ["project-tasks", projectId],
    queryFn: async () => {
      const { data } = await api.get<{ tasks?: Task[]; count?: number } | Task[]>(
        `/api/projects/${projectId}/tasks`,
      );
      // API may return { tasks } or an array
      if (Array.isArray(data)) return data as Task[];
      return (data as { tasks?: Task[] }).tasks ?? [];
    },
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [formErr, setFormErr] = useState<string | null>(null);

  const createTask = useMutation({
    mutationFn: async (payload: { title: string; description?: string; dueDate?: string }) => {
      const { data } = await api.post(`/api/projects/${projectId}/tasks`, payload);
      return data;
    },
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setDueDate("");
      setFormErr(null);
      void qc.invalidateQueries({ queryKey: ["project-tasks", projectId] });
    },
    onError: (e) => setFormErr(apiErrorMessage(e, "Unable to create task")),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.put(`/api/projects/${projectId}/tasks/${id}`, { status });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project-tasks", projectId] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/projects/${projectId}/tasks/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project-tasks", projectId] }),
  });

  function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setFormErr("Task title is required");
      return;
    }
    createTask.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
    });
  }

  return (
    <>
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All projects
      </Link>

      {projectQ.isLoading ? (
        <div className="mt-6 grid place-items-center rounded-xl border border-border bg-card p-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : projectQ.isError ? (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          <p>{apiErrorMessage(projectQ.error)}</p>
        </div>
      ) : projectQ.data ? (
        <>
          <header className="mt-4">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {projectQ.data.name}
            </h1>
            {projectQ.data.description ? (
              <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
                {projectQ.data.description}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {projectQ.data.status ? (
                <span className="rounded-full border border-border bg-card px-2.5 py-1">
                  Status · <span className="text-foreground">{projectQ.data.status}</span>
                </span>
              ) : null}
              <span className="rounded-full border border-border bg-card px-2.5 py-1">
                Owner ·{" "}
                <span className="text-foreground">{projectQ.data.owner?.name ?? "—"}</span>
              </span>
              <span className="rounded-full border border-border bg-card px-2.5 py-1">
                Members ·{" "}
                <span className="text-foreground">{projectQ.data.members?.length ?? 0}</span>
              </span>
            </div>
          </header>

          <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Tasks
              </h2>

              {tasksQ.isLoading ? (
                <div className="mt-3 grid place-items-center rounded-xl border border-border bg-card p-10 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : tasksQ.isError ? (
                <div className="mt-3 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4" />
                  <p>{apiErrorMessage(tasksQ.error)}</p>
                </div>
              ) : !tasksQ.data || tasksQ.data.length === 0 ? (
                <div className="mt-3 grid place-items-center rounded-xl border border-dashed border-border bg-card p-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    No tasks yet. Add one to get started.
                  </p>
                </div>
              ) : (
                <ul className="mt-3 grid gap-2">
                  {tasksQ.data.map((t) => (
                    <TaskRow
                      key={t._id}
                      task={t}
                      onToggle={(status) => updateTask.mutate({ id: t._id, status })}
                      onDelete={() => deleteTask.mutate(t._id)}
                    />
                  ))}
                </ul>
              )}
            </div>

            <aside className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground">New task</h2>
              <form onSubmit={onCreate} className="mt-4 space-y-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title"
                  maxLength={140}
                  required
                  className="block h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details (optional)"
                  rows={3}
                  maxLength={1000}
                  className="block w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
                />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="block h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
                />
                {formErr ? (
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {formErr}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={createTask.isPending}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-brand text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {createTask.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add task
                </button>
              </form>
            </aside>
          </section>
        </>
      ) : null}
    </>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (status: string) => void;
  onDelete: () => void;
}) {
  const done = task.status === "done";
  const priorityColor =
    task.priority === "high"
      ? "text-destructive"
      : task.priority === "medium"
        ? "text-amber-500"
        : "text-muted-foreground";

  return (
    <li className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
      <button
        onClick={() => onToggle(done ? "todo" : "done")}
        className="mt-0.5 text-muted-foreground transition-colors hover:text-brand"
        aria-label={done ? "Mark as todo" : "Mark as done"}
      >
        {done ? (
          <CheckCircle2 className="h-5 w-5 text-brand" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={
            "text-sm font-medium " +
            (done ? "text-muted-foreground line-through" : "text-foreground")
          }
        >
          {task.title}
        </p>
        {task.description ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {task.description}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {task.priority ? (
            <span className={"inline-flex items-center gap-1 " + priorityColor}>
              <Flag className="h-3 w-3" /> {task.priority}
            </span>
          ) : null}
          {task.assignedTo ? (
            <span className="inline-flex items-center gap-1">
              <UserIcon className="h-3 w-3" /> {task.assignedTo.name}
            </span>
          ) : null}
          {task.dueDate ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          ) : null}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="text-muted-foreground transition-colors hover:text-destructive"
        aria-label="Delete task"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}
