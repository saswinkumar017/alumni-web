"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getUsers,
  getUserById,
  suspendUser,
  activateUser,
  changeUserRole,
} from "@/features/developer/_services/developer-service";
import type { User } from "@/features/developer/_types";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import TextInput from "@/components/ui/text-input";
import { toast } from "sonner";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getUsers(page, search);
      setUsers(result.content);
      setTotalPages(result.totalPages);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    setSearch(searchInput);
  }

  async function handleViewDetails(userId: number) {
    try {
      const result = await getUserById(userId);
      setSelectedUser(result.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load user details");
    }
  }

  async function handleSuspend(userId: number) {
    setActionLoading(userId);
    try {
      const result = await suspendUser(userId);
      const updated = result.data;
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      if (selectedUser?.id === userId) setSelectedUser(updated);
      toast.success("User suspended");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to suspend user");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleActivate(userId: number) {
    setActionLoading(userId);
    try {
      const result = await activateUser(userId);
      const updated = result.data;
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      if (selectedUser?.id === userId) setSelectedUser(updated);
      toast.success("User activated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to activate user");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleChangeRole(userId: number, role: string) {
    setActionLoading(userId);
    try {
      const result = await changeUserRole(userId, role);
      setUsers((prev) => prev.map((u) => (u.id === userId ? result.data : u)));
      if (selectedUser?.id === userId) setSelectedUser(result.data);
      toast.success(`Role changed to ${role}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change role");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">User Management</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Search, view, and manage all user accounts.
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mt-6 flex gap-3">
        <TextInput
          id="user-search"
          srOnlyLabel="Search users"
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search users by name, email, or username..."
          className="flex-1"
        />
        <Button type="submit">Search</Button>
      </form>

      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        <div className={`${selectedUser ? "lg:col-span-2" : "lg:col-span-3"}`}>
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm text-zinc-500">
              Loading users...
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50">
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Role</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="border-b border-zinc-100 last:border-0">
                        <td className="px-4 py-3 font-medium text-zinc-900">
                          {user.fullName || user.username}
                        </td>
                        <td className="px-4 py-3 text-zinc-500">{user.email || "—"}</td>
                        <td className="px-4 py-3">
                          <Badge variant="default">{user.role}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              user.accountStatus === "ACTIVE"
                                ? "success"
                                : user.accountStatus === "SUSPENDED"
                                  ? "danger"
                                  : "warning"
                            }
                          >
                            {user.accountStatus || "UNKNOWN"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewDetails(user.id)}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              View
                            </button>
                            {user.accountStatus === "ACTIVE" ? (
                              <button
                                type="button"
                                onClick={() => handleSuspend(user.id)}
                                disabled={actionLoading === user.id}
                                className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                              >
                                {actionLoading === user.id ? "..." : "Suspend"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleActivate(user.id)}
                                disabled={actionLoading === user.id}
                                className="text-sm text-emerald-600 hover:text-emerald-800 disabled:opacity-50"
                              >
                                {actionLoading === user.id ? "..." : "Activate"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-zinc-500">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {selectedUser && (
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-zinc-900">User Details</h3>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-sm text-zinc-500 hover:text-zinc-700"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs text-zinc-500">Full Name</p>
                <p className="text-sm font-medium text-zinc-900">{selectedUser.fullName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Username</p>
                <p className="text-sm text-zinc-700">{selectedUser.username}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Email</p>
                <p className="text-sm text-zinc-700">{selectedUser.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Status</p>
                <Badge
                  variant={
                    selectedUser.accountStatus === "ACTIVE"
                      ? "success"
                      : selectedUser.accountStatus === "SUSPENDED"
                        ? "danger"
                        : "warning"
                  }
                >
                  {selectedUser.accountStatus || "UNKNOWN"}
                </Badge>
              </div>
              {selectedUser.masterAlumni?.batch && (
                <div>
                  <p className="text-xs text-zinc-500">Batch</p>
                  <p className="text-sm text-zinc-700">{selectedUser.masterAlumni.batch}</p>
                </div>
              )}
              {selectedUser.masterAlumni?.department && (
                <div>
                  <p className="text-xs text-zinc-500">Department</p>
                  <p className="text-sm text-zinc-700">{selectedUser.masterAlumni.department}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-zinc-500">Role</p>
                <div className="mt-1 flex gap-1">
                  {["alumni", "admin", "developer"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleChangeRole(selectedUser.id, r)}
                      disabled={selectedUser.role === r || actionLoading === selectedUser.id}
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        selectedUser.role === r
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      } disabled:opacity-50`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              {selectedUser.lastLogin && (
                <div>
                  <p className="text-xs text-zinc-500">Last Login</p>
                  <p className="text-sm text-zinc-700">
                    {new Date(selectedUser.lastLogin).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
