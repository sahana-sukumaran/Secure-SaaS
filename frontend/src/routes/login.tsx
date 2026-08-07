import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { AuthShell, useClientReady } from "@/components/auth/AuthShell";
import { useAuth } from "@/lib/auth";
import { apiErrorMessage, tenantStorage } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — SecureFlow" },
      {
        name: "description",
        content: "Sign in to your SecureFlow workspace.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const ready = useClientReady();
  const navigate = useNavigate();

  const { login, isAuthenticated, isReady } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantId, setTenantId] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready) {
      setTenantId(tenantStorage.get() ?? "");
    }
  }, [ready]);

  useEffect(() => {
    if (isReady && isAuthenticated) {
      void navigate({
        to: "/dashboard",
        replace: true,
      });
    }
  }, [isReady, isAuthenticated, navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    setError(null);

    // Frontend validation
    if (!tenantId.trim()) {
      setError("Please enter your Tenant ID.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setSubmitting(true);

    try {
      await login({
        email: email.trim(),
        password,
        tenantId: tenantId.trim(),
      });

      tenantStorage.set(tenantId.trim());

      await navigate({
        to: "/dashboard",
        replace: true,
      });
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to sign in"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Enter your credentials to continue to your workspace."
      footer={
        <>
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-brand hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Field
          label="Tenant ID"
          hint="Your organization's workspace identifier."
          value={tenantId}
          onChange={setTenantId}
          placeholder="e.g. 65f0a1b2c3d4e5f6a7b8c9d0"
          autoComplete="organization"
          required
        />

        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@company.com"
          autoComplete="email"
          required
        />

        {/* Password */}
        <div>
          <label className="text-sm font-medium text-foreground">
            Password
          </label>

          <div className="relative mt-1.5">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              className="block h-11 w-full rounded-lg border border-input bg-card px-3 pr-11 text-sm text-foreground shadow-sm outline-none transition-all placeholder:text-muted-foreground hover:border-ring/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-medium text-brand-foreground shadow-sm transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>
    </AuthShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  hint,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
>) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">
        {label}
      </span>

      <input
        {...rest}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 block h-11 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-sm outline-none transition-all placeholder:text-muted-foreground hover:border-ring/60 focus:border-ring focus:ring-2 focus:ring-ring/30"
      />

      {hint ? (
        <span className="mt-1.5 block text-xs text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </label>
  );
}