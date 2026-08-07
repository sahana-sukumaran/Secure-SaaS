import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  FolderKanban,
  ListChecks,
  CheckCircle2,
  Clock,
  Users,
  AlertTriangle,
  ArrowRight,
  Copy,
  Check,
  ShieldCheck,
  UserPlus,
  ClipboardCheck,
} from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/lib/auth";
import { api, apiErrorMessage } from "@/lib/api";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SecureFlow" },
      {
        name: "description",
        content: "Your SecureFlow workspace overview.",
      },
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
  const [copied, setCopied] = useState(false);

  const query = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data } = await api.get<{ stats: DashboardStats }>(
        "/api/dashboard",
      );
      return data.stats;
    },
  });

  async function copyTenantId() {
    if (!user?.tenantId) return;

    try {
      await navigator.clipboard.writeText(user.tenantId);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <AppShell>
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand/10 text-brand">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                SecureFlow workspace
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Overview
              </h1>
            </div>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            A quick pulse on your workspace.
          </p>
        </div>

        {user?.tenantId ? (
          <div className="flex items-center gap-2 self-start rounded-lg border border-border bg-card px-3 py-2 sm:self-auto">
            <span className="text-xs text-muted-foreground">Tenant</span>

            <span
              className="max-w-[220px] truncate font-mono text-xs text-foreground"
              title={user.tenantId}
            >
              {user.tenantId}
            </span>

            <button
              type="button"
              onClick={copyTenantId}
              title="Copy tenant ID"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        ) : null}
      </section>

      {/* Error */}
      {query.isError ? (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

          <div>
            <p className="font-medium">Couldn't load dashboard</p>

            <p className="mt-1 text-destructive/90">
              {apiErrorMessage(query.error)}
            </p>
          </div>
        </div>
      ) : null}

      {/* Statistics */}
      <section
        aria-label="Workspace statistics"
        className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        {/* Projects */}
        <Link
          to="/projects"
          className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <StatCard
            icon={FolderKanban}
            label="Projects"
            value={query.data?.projects}
            loading={query.isLoading}
            clickable
          />
        </Link>

        {/* Total Tasks */}
        <Link
          to="/tasks"
          search={{status: undefined}}
          className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <StatCard
            icon={ListChecks}
            label="Total tasks"
            value={query.data?.tasks}
            loading={query.isLoading}
            clickable
          />
        </Link>

        {/* Completed */}
        <Link
          to="/tasks"
          search={{ status: "completed" }}
          className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <StatCard
            icon={CheckCircle2}
            label="Completed"
            value={query.data?.completed}
            loading={query.isLoading}
            accent="success"
            clickable
          />
        </Link>

        {/* Pending */}
        <Link
          to="/tasks"
          search={{ status: "pending" }}
          className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <StatCard
            icon={Clock}
            label="Pending"
            value={query.data?.pending}
            loading={query.isLoading}
            accent="warning"
            clickable
          />
        </Link>

        {/* Members */}
        <Link
          to="/members"
          className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <StatCard
            icon={Users}
            label="Members"
            value={query.data?.members}
            loading={query.isLoading}
            clickable
          />
        </Link>
      </section>

      {/* Main content */}
      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Getting started */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-elev-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Getting started
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Set up your workspace and start collaborating securely.
              </p>
            </div>

            <div className="hidden rounded-lg bg-brand/10 p-2 text-brand sm:block">
              <ClipboardCheck className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Link
              to="/projects"
              className="group flex items-center gap-4 rounded-lg border border-transparent p-3 transition-colors hover:border-border hover:bg-accent/50"
            >
              <StepNumber number={1} />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  Create your first project
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Organize your work into a secure project.
                </p>
              </div>

              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </Link>

            <div className="flex items-center gap-4 rounded-lg border border-transparent p-3">
              <StepNumber number={2} />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  Invite teammates to your tenant
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Bring your team into the workspace.
                </p>
              </div>

              <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                Coming soon
              </span>
            </div>

            <div className="flex items-center gap-4 rounded-lg border border-transparent p-3">
              <StepNumber number={3} />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  Assign tasks and track progress
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Manage work and monitor completion.
                </p>
              </div>

              <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                Coming soon
              </span>
            </div>
          </div>
        </div>

        {/* Session */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-elev-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Session
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Current authenticated workspace session.
              </p>
            </div>

            <div className="rounded-lg bg-success/10 p-2 text-success">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>

          <dl className="mt-6 divide-y divide-border">
            <SessionRow
              label="Role"
              value={user?.role ?? "—"}
              badge
            />

            <SessionRow
              label="User ID"
              value={user?.id ?? "—"}
              mono
            />

            <SessionRow
              label="Tenant ID"
              value={user?.tenantId ?? "—"}
              mono
            />
          </dl>

          <div className="mt-5 flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2.5 text-xs text-success">
            <Check className="h-3.5 w-3.5" />
            <span>Authenticated session active</span>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="mt-8">
        <div className="mb-3">
          <h2 className="text-base font-semibold text-foreground">
            Quick actions
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Jump directly into the areas you use most.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            to="/projects"
            className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-elev-1 transition-all hover:-translate-y-0.5 hover:border-ring hover:shadow-elev-2"
          >
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand/10 text-brand">
              <FolderKanban className="h-5 w-5" />
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                Manage projects
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                View and create projects in your tenant.
              </p>
            </div>

            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>

          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 opacity-80 shadow-elev-1">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand/10 text-brand">
              <UserPlus className="h-5 w-5" />
            </div>

            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                Invite teammates
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Team invitations will be available soon.
              </p>
            </div>

            <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
              Soon
            </span>
          </div>
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
  clickable = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: number;
  loading?: boolean;
  accent?: "success" | "warning";
  clickable?: boolean;
}) {
  const accentClass =
    accent === "success"
      ? "bg-success/10 text-success"
      : accent === "warning"
        ? "bg-warning/15 text-warning-foreground"
        : "bg-brand/10 text-brand";

  return (
    <div
      className={`rounded-xl border border-border bg-card p-5 shadow-elev-1 transition-all ${
        clickable
          ? "group-hover:-translate-y-0.5 group-hover:border-ring group-hover:shadow-elev-2"
          : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>

        <span
          className={`grid h-9 w-9 place-items-center rounded-lg ${accentClass}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="h-8 w-16 animate-pulse rounded-md bg-muted" />
        ) : (
          <p className="text-2xl font-semibold tracking-tight text-foreground">
            {value ?? 0}
          </p>
        )}
      </div>

      {clickable ? (
        <div className="mt-3 flex items-center gap-1 text-xs font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
          View details
          <ArrowRight className="h-3 w-3" />
        </div>
      ) : null}
    </div>
  );
}

function StepNumber({ number }: { number: number }) {
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
      {number}
    </span>
  );
}

function SessionRow({
  label,
  value,
  mono,
  badge,
}: {
  label: string;
  value: string;
  mono?: boolean;
  badge?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>

      <dd
        className={`max-w-[65%] truncate text-right text-sm text-foreground ${
          mono ? "font-mono text-xs" : ""
        }`}
        title={value}
      >
        {badge ? (
          <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
            {value}
          </span>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}