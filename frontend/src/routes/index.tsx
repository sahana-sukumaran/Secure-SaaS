import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, LockKeyhole, Layers, Users, ArrowRight, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Hero />
      <FeatureGrid />
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-brand text-brand-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">SecureFlow</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#security" className="transition-colors hover:text-foreground">
            Security
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-2 text-sm font-medium text-brand-foreground shadow-elev-1 transition-opacity hover:opacity-90"
          >
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="absolute inset-0 bg-grid-brand opacity-40" aria-hidden />
      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-6 py-24 md:py-32">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> Multi-tenant · JWT · RBAC
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
            Secure project management for teams that ship.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Projects, tasks, comments, notifications, and audit trails — with role-based access
            and tenant isolation built in from day one.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground shadow-elev-2 transition-opacity hover:opacity-90"
            >
              Create your workspace <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Sign in
            </Link>
          </div>
          <ul className="mt-8 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {[
              "End-to-end tenant isolation",
              "Role-based access (admin / manager / member)",
              "Signed JWT sessions",
              "Full activity audit log",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" /> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function FeatureGrid() {
  const features = [
    {
      icon: ShieldCheck,
      title: "Tenant isolation",
      body: "Every user, project, and task is scoped to a tenant. No cross-tenant leaks.",
    },
    {
      icon: LockKeyhole,
      title: "Hardened auth",
      body: "Bcrypt-hashed passwords, JWT bearer sessions, and rate-limited endpoints.",
    },
    {
      icon: Layers,
      title: "Projects & tasks",
      body: "Organize work with projects, tasks, statuses, comments, and file uploads.",
    },
    {
      icon: Users,
      title: "Role-based access",
      body: "Admin, manager, and member roles enforced at the API and UI layer.",
    },
  ];

  return (
    <section id="features" className="border-b border-border/60 bg-surface/50">
      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Built with security as the default.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Every core primitive — auth, tenants, RBAC, audit — is enforced server-side, so the
            UI stays fast without cutting corners.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-5 shadow-elev-1 transition-shadow hover:shadow-elev-2"
            >
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand/10 text-brand">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer id="security" className="border-t border-border/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-6 py-10 text-sm text-muted-foreground md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center rounded bg-brand text-brand-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
          <span>© {new Date().getFullYear()} SecureFlow. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="transition-colors hover:text-foreground">
            Sign in
          </Link>
          <Link to="/register" className="transition-colors hover:text-foreground">
            Create account
          </Link>
        </div>
      </div>
    </footer>
  );
}
