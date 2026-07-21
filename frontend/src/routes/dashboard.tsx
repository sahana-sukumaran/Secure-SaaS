import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  FolderKanban,
  ListChecks,
  CheckCircle2,
  Clock,
  Users,
  AlertTriangle,
} from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { api, apiErrorMessage } from "@/lib/api";


export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SecureFlow" },
      { name: "description", content: "Your SecureFlow workspace overview." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

interface DashboardStats {
  projects: number;
  tasks: number;
  completed: number;
  pending: number;
  members: number;
}

function DashboardPage() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data } = await api.get<{ stats: DashboardStats }>("/api/dashboard");
      return data.stats;
    },
  });

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A quick pulse on your workspace.
          </p>
        </div>
        {user ? (
          <p className="text-xs text-muted-foreground">
            Tenant · <span className="font-mono text-foreground">{user.tenantId}</span>
          </p>
        ) : null}
      </div>

      {query.isError ? (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          <div>
            <p className="font-medium">Couldn't load dashboard</p>
            <p className="mt-0.5 text-destructive/90">{apiErrorMessage(query.error)}</p>
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={FolderKanban}
          label="Projects"
          value={query.data?.projects}
          loading={query.isLoading}
        />
        <StatCard
          icon={ListChecks}
          label="Total tasks"
          value={query.data?.tasks}
          loading={query.isLoading}
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={query.data?.completed}
          loading={query.isLoading}
          accent="success"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={query.data?.pending}
          loading={query.isLoading}
          accent="warning"
        />
        <StatCard
          icon={Users}
          label="Members"
          value={query.data?.members}
          loading={query.isLoading}
        />
      </div>

      <section className="mt-10 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-elev-1">
          <h2 className="text-sm font-semibold text-foreground">Getting started</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your auth and dashboard are wired up. Next up: projects, tasks and notifications.
          </p>
          <ul className="mt-5 space-y-3 text-sm">
            {[
              "Create your first project",
              "Invite teammates to your tenant",
              "Assign tasks and track progress",
            ].map((step, i) => (
              <li key={step} className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
                  {i + 1}
                </span>
                <span className="text-foreground">{step}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-elev-1">
          <h2 className="text-sm font-semibold text-foreground">Session</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Role" value={user?.role ?? "—"} />
            <Row label="User ID" value={user?.id ?? "—"} mono />
            <Row label="Tenant" value={user?.tenantId ?? "—"} mono />
          </dl>
        </div>
      </section>
    </AppShell>
  );
}


function StatCard({
  icon: Icon,
  label,
  value,
  loading,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: number;
  loading?: boolean;
  accent?: "success" | "warning";
}) {
  const accentClass =
    accent === "success"
      ? "bg-success/10 text-success"
      : accent === "warning"
        ? "bg-warning/15 text-warning-foreground"
        : "bg-brand/10 text-brand";
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-elev-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${accentClass}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 h-8">
        {loading ? (
          <div className="h-7 w-16 animate-pulse rounded bg-muted" />
        ) : (
          <p className="text-2xl font-semibold text-foreground">{value ?? 0}</p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={`max-w-[60%] truncate text-right text-foreground ${mono ? "font-mono text-xs" : ""}`}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}
