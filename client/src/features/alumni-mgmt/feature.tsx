import type { SessionUser } from "@/types";

export function AlumniRecordsList({ user: _user }: { user: SessionUser }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Alumni Management</h1>
      <p className="mt-2 text-zinc-600">View and manage alumni records.</p>
    </div>
  );
}

export function AlumniRecordDetail({ id, user: _user }: { id: string; user: SessionUser }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Alumni Record</h1>
      <p className="mt-2 text-zinc-600">Record ID: {id}</p>
    </div>
  );
}
