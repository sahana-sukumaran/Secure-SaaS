import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

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
      {/* Left — form */}
      <div className="flex flex-col justify-between px-6 py-8 sm:px-10">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-brand text-brand-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">SecureFlow</span>
        </Link>

        <div className="mx-auto w-full max-w-sm py-12">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-6 text-sm text-muted-foreground">{footer}</div> : null}
        </div>

        <p className="text-xs text-muted-foreground">
          Protected by JWT-signed sessions · Rate-limited API
        </p>
      </div>

      {/* Right — brand */}
      <aside className="relative hidden overflow-hidden bg-hero-gradient lg:block">
        <div className="absolute inset-0 bg-grid-brand opacity-20" aria-hidden />
        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <div className="max-w-md">
            <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/70">
              SecureFlow platform
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight">
              A calmer command center for secure teamwork.
            </h2>
            <p className="mt-4 text-sm text-primary-foreground/80">
              Multi-tenant isolation, role-based access, and audited activity — so you can focus
              on the work, not the plumbing.
            </p>
          </div>
          <div className="grid gap-4 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <Metric label="Active tenants" value="128" trend="+12% MoM" />
            <Metric label="Tasks completed / wk" value="4.2k" trend="+8%" />
            <Metric label="Uptime (90d)" value="99.98%" trend="SLO green" />
          </div>
        </div>
      </aside>
    </div>
  );
}

function Metric({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-primary-foreground/60">{label}</p>
        <p className="text-lg font-semibold text-primary-foreground">{value}</p>
      </div>
      <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-primary-foreground/80">
        {trend}
      </span>
    </div>
  );
}

export function useClientReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}
