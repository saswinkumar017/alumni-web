import type { SessionUser } from "@/types";

export function AuditLogViewer({ user: _user }: { user: SessionUser }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Audit Log</h1>
      <p className="mt-2 text-zinc-600">Trail of administrative actions.</p>
    </div>
  );
}
