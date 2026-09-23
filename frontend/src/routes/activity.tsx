import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity as ActivityIcon, Loader2, AlertTriangle } from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { api, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [{ title: "Activity — SecureFlow" }, { name: "robots", content: "noindex" }],
  }),
  component: ActivityPage,
});

interface LogEntry {
  _id: string;
  action: string;
  resource: string;
  details?: string;
  createdAt?: string;
  user?: { _id: string; name: string; email: string };
}

function ActivityPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const query = useQuery({
    queryKey: ["activity", isAdmin ? "all" : "mine"],
    queryFn: async () => {
      const url = isAdmin ? "/api/activities/admin/all" : "/api/activities/my-logs";
      const { data } = await api.get<{ activities?: LogEntry[] }>(url);
      return data.activities ?? [];
    },
  });

  return (
    <AppShell>
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Activity log</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin
              ? "All actions across your workspace."
              : "A record of what you've done in the workspace."}
          </p>
        </div>
        {isAdmin ? (
          <span className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            Admin view
          </span>
        ) : null}
      </header>

      <div className="mt-8">
        {query.isLoading ? (
          <div className="grid place-items-center rounded-xl border border-border bg-card p-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : query.isError ? (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <p>{apiErrorMessage(query.error)}</p>
          </div>
        ) : !query.data || query.data.length === 0 ? (
          <div className="grid place-items-center rounded-xl border border-dashed border-border bg-card p-16 text-center">
            <ActivityIcon className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No activity yet.</p>
          </div>
        ) : (
          <ol className="relative ml-3 border-l border-border">
            {query.data.map((entry) => (
              <li key={entry._id} className="mb-4 ml-6">
                <span className="absolute -left-1.5 mt-1.5 grid h-3 w-3 place-items-center rounded-full bg-brand ring-4 ring-background" />
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-foreground">
                      {entry.action}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      on <span className="text-foreground">{entry.resource}</span>
                    </span>
                    {entry.user ? (
                      <span className="text-xs text-muted-foreground">
                        · by <span className="text-foreground">{entry.user.name}</span>
                      </span>
                    ) : null}
                  </div>
                  {entry.details ? (
                    <p className="mt-1.5 text-sm text-foreground">{entry.details}</p>
                  ) : null}
                  {entry.createdAt ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </AppShell>
  );
}
