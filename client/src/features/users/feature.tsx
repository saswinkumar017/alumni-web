import type { SessionUser } from "@/types";

export function UserList({ user: _user }: { user: SessionUser }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Users</h1>
      <p className="mt-2 text-zinc-600">Manage system users and roles.</p>
    </div>
  );
}

export function UserDetail({ id, user: _user }: { id: string; user: SessionUser }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">User Details</h1>
      <p className="mt-2 text-zinc-600">User ID: {id}</p>
    </div>
  );
}
