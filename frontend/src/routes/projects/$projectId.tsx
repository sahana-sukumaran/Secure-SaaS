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
  Pencil,
  Save,
  X,
} from "lucide-react";
import { api, apiErrorMessage } from "@/lib/api";

export const Route = createFileRoute("/projects/$projectId")({
  head: () => ({
    meta: [{ title: "Project — SecureFlow" }, { name: "robots", content: "noindex" }],
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
  status: "todo" | "in-progress" | "completed" | string;
  priority?: "low" | "medium" | "high" | string;
  aiEstimatedTime?: string;
  aiReason?: string;
  dueDate?: string;
  createdBy?: PopUser;
  assignedTo?: PopUser;
  comments?: Comment[];
}
interface Comment {
  _id: string;
  text: string;
  author: PopUser;
  createdAt: string;
}

function ProjectDetailPage() {
  const { projectId } = Route.useParams();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [commentText, setCommentText] = useState("");
const [showComments, setShowComments] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [editError, setEditError] = useState<string | null>(null);
  const projectQ = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data } = await api.get<{ project: Project }>(`/api/projects/${projectId}`);
      return data.project;
    },
  });
  const updateProject = useMutation({
    mutationFn: async (payload: { name: string; description?: string; status?: string }) => {
      const { data } = await api.put(`/api/projects/${projectId}`, payload);

      return data.project;
    },

    onSuccess: (project) => {
      setEditing(false);
      setEditError(null);

      void qc.setQueryData(["project", projectId], project);
      void qc.invalidateQueries({ queryKey: ["projects"] });
    },

    onError: (error) => {
      setEditError(apiErrorMessage(error, "Unable to update project"));
    },
  });
  function startEditing() {
    if (!projectQ.data) return;

    setEditName(projectQ.data.name);
    setEditDescription(projectQ.data.description ?? "");
    setEditStatus(projectQ.data.status ?? "active");
    setEditError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setEditError(null);
  }

  function saveProject() {
    if (!editName.trim()) {
      setEditError("Project name is required");
      return;
    }

    updateProject.mutate({
      name: editName.trim(),
      description: editDescription.trim(),
      status: editStatus,
    });
  }
  function handleDeleteProject() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project? This action cannot be undone.",
    );

    if (!confirmed) return;

    deleteProject.mutate();
  }
  const deleteProject = useMutation({
    mutationFn: async () => {
      await api.delete(`/api/projects/${projectId}`);
    },

    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["projects"] });
      void qc.removeQueries({ queryKey: ["project", projectId] });
    },

    onError: (error) => {
      setEditError(apiErrorMessage(error, "Unable to delete project"));
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
  const membersQ = useQuery({
    queryKey: ["tenant-members"],
    queryFn: async () => {
      const { data } = await api.get<{
        members: PopUser[];
      }>("/api/projects/members");

      return data.members;
    },
  });
  const addMember = useMutation({
    mutationFn: async (payload: { userId: string; role: string }) => {
      const { data } = await api.post(`/api/projects/${projectId}/members`, payload);

      return data.project;
    },

    onSuccess: (project) => {
      setSelectedMember("");
      setMemberRole("member");
      setMemberError(null);

      qc.setQueryData(["project", projectId], project);
      void qc.invalidateQueries({ queryKey: ["projects"] });
    },

    onError: (error) => {
      setMemberError(apiErrorMessage(error, "Unable to add member"));
    },
  });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [formErr, setFormErr] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState("");
  const [memberRole, setMemberRole] = useState("member");
  const [memberError, setMemberError] = useState<string | null>(null);
  const createTask = useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string;
      dueDate?: string;
      assignedTo?: string;
    }) => {
    
      const { data } = await api.post(`/api/projects/${projectId}/tasks`, payload);
      return data;
    },
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setDueDate("");
      setAssignedTo("");
      setFormErr(null);
      void qc.invalidateQueries({ queryKey: ["project-tasks", projectId] });
    },
    onError: (e) => setFormErr(apiErrorMessage(e, "Unable to create task")),
  });
  const updateTask = useMutation({
  mutationFn: async ({
    id,
    title,
    description,
    status,
    dueDate,
    priority,
    assignedTo,
    }: {
      id: string;
      title?: string;
      description?: string;
      status?: string;
      dueDate?: string;
      priority?: string;
      assignedTo?: string;
    }) => {
      await api.put(`/api/projects/${projectId}/tasks/${id}`, {
        title,
        description,
        status,
        dueDate,
        priority,
        assignedTo,
      });
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
      assignedTo: assignedTo || undefined,
    });
  }
  function handleAddMember() {
    if (!selectedMember) {
      setMemberError("Please select a member");
      return;
    }

    addMember.mutate({
      userId: selectedMember,
      role: memberRole,
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
            {editing ? (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Project name
                    </label>

                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={120}
                      className="mt-1.5 block h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Description</label>

                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      maxLength={500}
                      className="mt-1.5 block w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Status</label>

                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="mt-1.5 block h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
                    >
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  {editError ? (
                    <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      {editError}
                    </p>
                  ) : null}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={saveProject}
                      disabled={updateProject.isPending}
                      className="inline-flex h-9 items-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      {updateProject.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save changes
                    </button>

                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={updateProject.isPending}
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-accent"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                      {projectQ.data.name}
                    </h1>

                    {projectQ.data.description ? (
                      <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
                        {projectQ.data.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={startEditing}
                      className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteProject}
                      disabled={deleteProject.isPending}
                      className="inline-flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 disabled:opacity-60"
                    >
                      {deleteProject.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>

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
              </>
            )}
          </header>
          <section className="mt-6 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Project members</h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Add members from your workspace to this project.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
              <select
                value={selectedMember}
                onChange={(e) => {
                  setSelectedMember(e.target.value);
                  setMemberError(null);
                }}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
              >
                <option value="">Select a member</option>

                {membersQ.data
                  ?.filter(
                    (member) =>
                      !projectQ.data?.members?.some(
                        (projectMember) => projectMember.user?._id === member._id,
                      ),
                  )
                  .map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} — {member.email}
                    </option>
                  ))}
              </select>

              <select
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
              >
                <option value="member">Member</option>
                <option value="manager">Manager</option>
              </select>

              <button
                type="button"
                onClick={handleAddMember}
                disabled={addMember.isPending || membersQ.isLoading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {addMember.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add member
              </button>
            </div>

            {memberError ? (
              <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {memberError}
              </p>
            ) : null}

            <div className="mt-5 grid gap-2">
              {projectQ.data?.members?.map((member) => (
                <div
                  key={member.user._id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{member.user.name}</p>
                    <p className="text-xs text-muted-foreground">{member.user.email}</p>
                  </div>

                  <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </section>

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
                      task={t}
                      key={t._id}
                      projectId={projectId}
                      projectMembers={projectQ.data.members}
                      onToggle={(status) => updateTask.mutate({ id: t._id, status })}
                      onDelete={() => deleteTask.mutate(t._id)}
                      onEdit={(updates) =>
                        updateTask.mutate({
                          id: t._id,
                          ...updates,
                        })
                      }
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
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="block h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
                >
                  <option value="">Unassigned</option>

                  {projectQ.data?.members?.map((member) => (
                    <option key={member.user._id} value={member.user._id}>
                      {member.user.name} ({member.user.email})
                    </option>
                  ))}
                </select>
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
  projectId,
  projectMembers,
  onToggle,
  onDelete,
  onEdit,

}: {
  task: Task;
  projectId: string;
  projectMembers: { user: PopUser; role: string }[];
  onToggle: (status: string) => void;
  onDelete: () => void;
  onEdit: (updates: {
    title: string;
    description?: string;
    dueDate?: string;
    priority?: string;
    assignedTo?: string;
  }) => void;

}) {
  const qc = useQueryClient();
  const done = task.status === "completed";
  const [editing, setEditing] = useState(false);
  const [showComments, setShowComments] = useState(false);
const [commentText, setCommentText] = useState("");
const commentsQ = useQuery({
  queryKey: ["task-comments", projectId, task._id],
  queryFn: async () => {
    const { data } = await api.get<{ comments: Comment[] }>(
      `/api/projects/${projectId}/tasks/${task._id}/comments`,
    );

    return data.comments;
  },
  enabled: showComments,
});
 const addComment = useMutation({
  mutationFn: async (text: string) => {
    const { data } = await api.post(
      `/api/projects/${projectId}/tasks/${task._id}/comments`,
      { text },
    );

    return data;
  },

  onSuccess: () => {
    setCommentText("");

    void qc.invalidateQueries({
      queryKey: ["task-comments", projectId, task._id],
    });
  },

  onError: (error) => {
    console.error("Failed to add comment:", error);
  },
});
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description ?? "");
  const [editDueDate, setEditDueDate] = useState(task.dueDate ? task.dueDate.slice(0, 10) : "");
  const [editPriority, setEditPriority] = useState(task.priority ?? "medium");
  const [editAssignedTo, setEditAssignedTo] = useState(task.assignedTo?._id ?? "");
  const nextStatus =
    task.status === "todo" ? "in-progress" : task.status === "in-progress" ? "completed" : "todo";
  const priorityColor =
    task.priority === "high"
      ? "text-destructive"
      : task.priority === "medium"
        ? "text-amber-500"
        : "text-muted-foreground";

  return (
    <li className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
      <button
        onClick={() => onToggle(nextStatus)}
        className="mt-0.5 text-muted-foreground transition-colors hover:text-brand"
        aria-label={`Change status to ${nextStatus}`}
      >
        {done ? <CheckCircle2 className="h-5 w-5 text-brand" /> : <Circle className="h-5 w-5" />}
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
        <span className="mt-1 inline-flex rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
          {task.status === "in-progress"
            ? "In Progress"
            : task.status === "completed"
              ? "Completed"
              : "Todo"}
        </span>
        {task.description ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {task.priority ? (
            <span className={"inline-flex items-center gap-1 " + priorityColor}>
              <Flag className="h-3 w-3" /> {task.priority}
            </span>
          ) : null}
          {task.aiEstimatedTime ? (
            <span className="text-xs text-muted-foreground">
              Estimated time: {task.aiEstimatedTime}
            </span>
          ) : null}

          {task.aiReason ? (
            <p className="mt-1 text-xs text-muted-foreground">AI reason: {task.aiReason}</p>
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
      <div className="flex gap-2">
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      setShowComments((value) => !value);
    }}
    className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
  >
    {showComments ? "Hide Comments" : "Comments"}
  </button>

  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      setEditing(true);
    }}
    className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
  >
    Edit
  </button>
</div>
      {showComments ? (
        <div className="mt-3 w-full rounded-lg border border-border bg-background p-3">
          <h4 className="mb-3 text-sm font-medium text-foreground">
            Comments
          </h4>

          {commentsQ.isLoading ? (
            <p className="text-xs text-muted-foreground">
              Loading comments...
            </p>
          ) : commentsQ.isError ? (
            <p className="text-xs text-destructive">
              Unable to load comments.
            </p>
          ) : commentsQ.data?.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No comments yet.
            </p>
          ) : (
            <div className="space-y-2">
              {commentsQ.data?.map((comment) => (
                <div
                  key={comment._id}
                  className="rounded-md border border-border bg-card p-2"
                >
                  <p className="text-xs font-medium text-foreground">
                    {comment.author?.name ?? "Unknown user"}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {comment.text}
                  </p>

                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
            />

            <button
              type="button"
              disabled={!commentText.trim() || addComment.isPending}
              onClick={() => {
                if (!commentText.trim()) return;
                addComment.mutate(commentText.trim());
              }}
              className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground hover:opacity-90 disabled:opacity-50"
            >
              {addComment.isPending ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      ) : null}
      {editing ? (
        <div className="mt-3 space-y-3 rounded-lg border border-border bg-background p-3">
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Task title"
            className="block h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          />

          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Description"
            rows={3}
            className="block w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          />

          <input
            type="date"
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
            className="block h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          />
          <select
            value={editPriority}
            onChange={(e) => setEditPriority(e.target.value)}
            className="block h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select
            value={editAssignedTo}
            onChange={(e) => setEditAssignedTo(e.target.value)}
            className="block h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          >
            <option value="">Unassigned</option>

            {projectMembers.map((member) => (
              <option key={member.user._id} value={member.user._id}>
                {member.user.name} ({member.user.email})
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (!editTitle.trim()) return;

                onEdit({
                  title: editTitle.trim(),
                  description: editDescription.trim() || undefined,
                  dueDate: editDueDate || undefined,
                  priority: editPriority,
                  assignedTo: editAssignedTo || undefined,
                });

                setEditing(false);
              }}
              className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground hover:opacity-90"
            >
              Save
            </button>

            <button
              type="button"
              onClick={() => {
                setEditTitle(task.title);
                setEditDescription(task.description ?? "");
                setEditDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
                setEditPriority(task.priority ?? "medium");
                setEditAssignedTo(task.assignedTo?._id ?? "");
                setEditing(false);
              }}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
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
