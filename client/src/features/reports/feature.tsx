import type { SessionUser } from "@/types";

export function ReportsDashboard({ user: _user }: { user: SessionUser }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Reports</h1>
      <p className="mt-2 text-zinc-600">
        System usage and engagement analytics.
      </p>
    </div>
  );
}
