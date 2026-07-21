import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Loader2, Trash2, AlertTriangle } from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { api, apiErrorMessage } from "@/lib/api";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — SecureFlow" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotificationsPage,
});

interface Notification {
  _id: string;
  message: string;
  type?: string;
  read?: boolean;
  createdAt?: string;
}

function NotificationsPage() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get<Notification[] | { notifications?: Notification[] }>(
        "/api/notifications",
      );
      return Array.isArray(data) ? data : (data.notifications ?? []);
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/api/notifications/${id}/read`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/notifications/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <AppShell>
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Updates from your projects and tasks.
          </p>
        </div>
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
            <Bell className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">You're all caught up.</p>
          </div>
        ) : (
          <ul className="grid gap-2">
            {query.data.map((n) => (
              <li
                key={n._id}
                className={
                  "flex items-start gap-3 rounded-xl border p-4 transition-colors " +
                  (n.read
                    ? "border-border bg-card"
                    : "border-brand/30 bg-brand/5")
                }
              >
                <div
                  className={
                    "mt-0.5 grid h-8 w-8 place-items-center rounded-full " +
                    (n.read ? "bg-muted text-muted-foreground" : "bg-brand text-brand-foreground")
                  }
                >
                  <Bell className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{n.message}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {n.type ? <span>{n.type} · </span> : null}
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {!n.read ? (
                    <button
                      onClick={() => markRead.mutate(n._id)}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      <Check className="h-3.5 w-3.5" /> Mark read
                    </button>
                  ) : null}
                  <button
                    onClick={() => remove.mutate(n._id)}
                    className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
                    aria-label="Delete notification"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
