import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, Clock, Flag, Loader2 } from "lucide-react";

import { api, apiErrorMessage } from "@/lib/api";

export const Route = createFileRoute("/tasks")({
  validateSearch: (search: Record<string, unknown>) => ({
    status:
      search.status === "completed" || search.status === "pending" ? search.status : undefined,
  }),

  head: () => ({
    meta: [{ title: "Tasks — SecureFlow" }, { name: "robots", content: "noindex" }],
  }),
  component: TasksPage,
});

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  dueDate?: string;
  project?: {
    _id: string;
    name: string;
  };
  assignedTo?: {
    name: string;
    email: string;
  };
}

function TasksPage() {
  const search = Route.useSearch();

  const query = useQuery({
    queryKey: ["all-tasks", search.status],
    queryFn: async () => {
      const params =
        search.status === "completed" || search.status === "pending"
          ? { status: search.status }
          : undefined;

      const { data } = await api.get<{ tasks: Task[] }>("/api/projects/tasks", { params });

      return data.tasks;
    },
  });

  const title =
    search.status === "completed"
      ? "Completed Tasks"
      : search.status === "pending"
        ? "Pending Tasks"
        : "All Tasks";

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage tasks across your workspace.
        </p>
      </div>

      {query.isLoading ? (
        <div className="mt-8 grid place-items-center rounded-xl border border-border bg-card p-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : query.isError ? (
        <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {apiErrorMessage(query.error)}
        </div>
      ) : !query.data || query.data.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">No tasks found.</p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-3">
          {query.data.map((task) => {
            const completed = task.status === "completed";

            return (
              <li
                key={task._id}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
              >
                {completed ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-brand" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 text-muted-foreground" />
                )}

                <div className="min-w-0 flex-1">
                  <p
                    className={
                      "text-sm font-medium " +
                      (completed ? "text-muted-foreground line-through" : "text-foreground")
                    }
                  >
                    {task.title}
                  </p>

                  {task.description ? (
                    <p className="mt-1 text-xs text-muted-foreground">{task.description}</p>
                  ) : null}

                  <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                    {task.project ? (
  <Link
    to="/projects/$projectId"
    params={{ projectId: task.project._id }}
    className="text-brand hover:underline"
  >
    {task.project.name}
  </Link>
) : null}
                    {task.priority ? (
                      <span className="inline-flex items-center gap-1">
                        <Flag className="h-3 w-3" />
                        {task.priority}
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
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
