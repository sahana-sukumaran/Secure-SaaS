import { Outlet, createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app/AppShell";

export const Route = createFileRoute("/projects/_layout")({
  component: ProjectsLayout,
});

function ProjectsLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
