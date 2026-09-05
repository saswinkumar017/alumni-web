"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getAdminUsers,
  suspendAdminUser,
  activateAdminUser,
} from "@/features/admin/_services/admin-service";

interface User {
  id: number;
  username: string;
  email?: string;
  role: string;
  accountStatus?: string;
  createdAt?: string;
  lastLogin?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers(query || undefined, page);
      setUsers(data.content ?? []);
      setTotalPages(data.totalPages ?? 0);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleSuspend(id: number) {
    setProcessingId(id);
    try {
      await suspendAdminUser(id);
      toast.success("User suspended");
      await fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to suspend user");
    } finally { setProcessingId(null); }
  }

  async function handleActivate(id: number) {
    setProcessingId(id);
    try {
      await activateAdminUser(id);
      toast.success("User activated");
      await fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to activate user");
    } finally { setProcessingId(null); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">User Management</h1>

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="user-search" className="block text-xs font-medium text-zinc-600">Search</label>
          <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Search by username or email..." id="user-search" className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm" />
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm text-zinc-500">Loading users...</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-left font-medium text-zinc-600">ID</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Username</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Email</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Role</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Last Login</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-500">No users found.</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3 text-zinc-400">#{u.id}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{u.username}</td>
                  <td className="px-4 py-3 text-sm text-zinc-600">{u.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.role === "ADMIN" ? "bg-red-100 text-red-800" :
                      u.role === "DEVELOPER" ? "bg-purple-100 text-purple-800" :
                      "bg-zinc-100 text-zinc-700"
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.accountStatus === "ACTIVE" ? "bg-green-100 text-green-800" :
                      u.accountStatus === "SUSPENDED" ? "bg-red-100 text-red-800" :
                      "bg-zinc-100 text-zinc-700"
                    }`}>{u.accountStatus ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.accountStatus === "ACTIVE" ? (
                      <button type="button" onClick={() => handleSuspend(u.id)} disabled={processingId === u.id} className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50">
                        {processingId === u.id ? "..." : "Suspend"}
                      </button>
                    ) : u.accountStatus === "SUSPENDED" ? (
                      <button type="button" onClick={() => handleActivate(u.id)} disabled={processingId === u.id} className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50">
                        {processingId === u.id ? "..." : "Activate"}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3">
              <span className="text-sm text-zinc-500">Page {page + 1} of {totalPages}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="rounded border border-zinc-300 px-3 py-1 text-xs text-zinc-600 disabled:opacity-50">Prev</button>
                <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="rounded border border-zinc-300 px-3 py-1 text-xs text-zinc-600 disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



