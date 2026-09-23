import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, LockKeyhole, Users, Activity } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
      {/* LEFT — LOGIN */}
      <div className="flex min-h-screen flex-col bg-background px-6 py-6 sm:px-10 lg:px-12">
        {/* Logo */}
        <Link
          to="/"
          className="flex w-fit items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-brand-foreground shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <span className="text-base font-semibold tracking-tight text-foreground">SecureFlow</span>
        </Link>

        {/* FORM AREA */}
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[360px]">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>

            <div className="mt-7">{children}</div>

            {footer ? (
              <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
            ) : null}
          </div>
        </div>

        {/* SECURITY FOOTER */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <LockKeyhole className="h-3.5 w-3.5" />
          <span>Protected by JWT-signed sessions · Rate-limited API</span>
        </div>
      </div>

      {/* RIGHT — SECURITY / PRODUCT PANEL */}
      <aside className="relative hidden overflow-hidden bg-hero-gradient lg:block">
        <div className="absolute inset-0 bg-grid-brand opacity-20" aria-hidden />

        {/* subtle glow */}
        <div
          className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand/20 blur-3xl"
          aria-hidden
        />

        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          {/* HEADER */}
          <div className="max-w-lg">
            <p className="text-xs uppercase tracking-[0.22em] text-primary-foreground/60">
              SecureFlow platform
            </p>

            <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-tight">
              A calmer command center for secure teamwork.
            </h2>

            <p className="mt-5 max-w-md text-sm leading-6 text-primary-foreground/75">
              Multi-tenant isolation, role-based access, and audited activity — so your team can
              focus on the work, not the plumbing.
            </p>

            {/* SECURITY FEATURES */}
            <div className="mt-10 grid gap-4">
              <SecurityFeature
                icon={ShieldCheck}
                title="Role-based access"
                description="Control what every team member can access."
              />

              <SecurityFeature
                icon={Users}
                title="Multi-tenant workspace"
                description="Keep organizations and their data isolated."
              />

              <SecurityFeature
                icon={Activity}
                title="Audited activity"
                description="Track important workspace actions securely."
              />
            </div>
          </div>

          {/* PRODUCT METRICS */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <p className="mb-5 text-xs font-medium uppercase tracking-wider text-primary-foreground/50">
              Workspace security
            </p>

            <div className="grid grid-cols-3 gap-4">
              <Metric label="Projects" value="2" />

              <Metric label="Tasks" value="1" />

              <Metric label="Members" value="3" />
            </div>

            <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-primary-foreground/70">
                SecureFlow services operational
              </span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function SecurityFeature({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5">
        <Icon className="h-4 w-4" />
      </div>

      <div>
        <p className="text-sm font-medium text-primary-foreground">{title}</p>

        <p className="mt-0.5 text-xs leading-5 text-primary-foreground/55">{description}</p>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-primary-foreground/50">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-primary-foreground">{value}</p>
    </div>
  );
}

export function useClientReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

  return ready;
}
