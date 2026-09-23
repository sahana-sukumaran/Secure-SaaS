import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { FolderKanban, Plus, Loader2, AlertTriangle, ArrowRight, Users } from "lucide-react";

import { api, apiErrorMessage } from "@/lib/api";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [{ title: "Projects — SecureFlow" }, { name: "robots", content: "noindex" }],
  }),
  component: ProjectsPage,
});

interface ProjectMember {
  user: { _id: string; name: string; email: string } | string;
  role: string;
}

interface Project {
  _id: string;
  name: string;
  description?: string;
  status?: string;
  owner: { _id: string; name: string; email: string } | string;
  members: ProjectMember[];
  createdAt?: string;
}

function ProjectsPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formErr, setFormErr] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data } = await api.get<{ projects: Project[] }>("/api/projects");
      return data.projects;
    },
  });

  const create = useMutation({
    mutationFn: async (payload: { name: string; description: string }) => {
      const { data } = await api.post<{ project: Project }>("/api/projects", payload);
      return data.project;
    },
    onSuccess: () => {
      setName("");
      setDescription("");
      setFormErr(null);
      void qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err) => setFormErr(apiErrorMessage(err, "Unable to create project")),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setFormErr("Project name is required");
      return;
    }
    create.mutate({ name: name.trim(), description: description.trim() });
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything your workspace is shipping.
          </p>
        </div>
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {query.isLoading ? (
            <div className="grid place-items-center rounded-xl border border-border bg-card p-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : query.isError ? (
            <ErrorBox message={apiErrorMessage(query.error)} />
          ) : !query.data || query.data.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="grid gap-3">
              {query.data.map((p) => (
                <li key={p._id}>
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: p._id }}
                    className="group flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-ring hover:bg-accent/40"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FolderKanban className="h-4 w-4 text-brand" />
                        <h3 className="truncate text-sm font-semibold text-foreground">{p.name}</h3>
                        {p.status ? (
                          <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
                            {p.status}
                          </span>
                        ) : null}
                      </div>
                      {p.description ? (
                        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                          {p.description}
                        </p>
                      ) : null}
                      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {p.members?.length ?? 0} member
                        {(p.members?.length ?? 0) === 1 ? "" : "s"}
                      </p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">New project</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Create a project in your tenant. You'll be the owner.
          </p>
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              maxLength={120}
              required
              className="block h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
              maxLength={500}
              className="block w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
            />
            {formErr ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {formErr}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={create.isPending}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-brand text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {create.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create project
            </button>
          </form>
        </aside>
      </section>
    </>
  );
}

function EmptyState() {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-border bg-card p-16 text-center">
      <FolderKanban className="h-8 w-8 text-muted-foreground" />
      <h3 className="mt-3 text-sm font-semibold text-foreground">No projects yet</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Create your first project to start organizing tasks and collaborators.
      </p>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      <AlertTriangle className="mt-0.5 h-4 w-4" />
      <div>
        <p className="font-medium">Couldn't load projects</p>
        <p className="mt-0.5 text-destructive/90">{message}</p>
      </div>
    </div>
  );
}
