import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Users } from "lucide-react";

import { api, apiErrorMessage } from "@/lib/api";

export const Route = createFileRoute("/members")({
  head: () => ({
    meta: [{ title: "Members — SecureFlow" }, { name: "robots", content: "noindex" }],
  }),
  component: MembersPage,
});

interface Member {
  _id: string;
  name: string;
  email: string;
  role?: string;
}

function MembersPage() {
  const query = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data } = await api.get<{ members: Member[] }>("/api/projects/members");
      return data.members;
    },
  });

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Members</h1>
        <p className="mt-1 text-sm text-muted-foreground">People in your workspace.</p>
      </div>

      {query.isLoading ? (
        <div className="mt-8 grid place-items-center rounded-xl border border-border bg-card p-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : query.isError ? (
        <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {apiErrorMessage(query.error)}
        </div>
      ) : (
        <ul className="mt-8 grid gap-3">
          {query.data?.map((member) => (
            <li
              key={member._id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div className="grid h-10 w-10 place-items-center rounded-full bg-accent">
                <Users className="h-5 w-5 text-brand" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.email}</p>
              </div>

              {member.role ? (
                <span className="ml-auto rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                  {member.role}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
