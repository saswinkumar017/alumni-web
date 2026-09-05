"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getAdminDashboard } from "@/features/admin/_services/admin-service";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminDashboard();
      setStats(data);
      setLastRefresh(new Date());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load dashboard stats");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { const i = setInterval(fetchStats, 60000); return () => clearInterval(i); }, [fetchStats]);

  if (loading && !stats) return <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm text-zinc-500">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600">Overview of the alumni network.</p>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && <span className="text-xs text-zinc-400">Updated {lastRefresh.toLocaleTimeString()}</span>}
          <button type="button" onClick={fetchStats} disabled={loading} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-50">
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium text-zinc-500">Total Alumni</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">{stats?.totalAlumni ?? 0}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium text-zinc-500">Total Requests</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">{stats?.totalRequests ?? 0}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium text-zinc-500">Pending Requests</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{stats?.pending ?? 0}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium text-zinc-500">Approved Today</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{stats?.approvedToday ?? 0}</p>
        </div>
      </div>

      {stats?.recentRequests && stats.recentRequests.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 px-4 py-3">
            <p className="text-sm font-medium text-zinc-700">Recent Requests</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="px-4 py-2 text-left font-medium text-zinc-600">ID</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-600">Type</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-600">Status</th>
                <th className="px-4 py-2 text-left font-medium text-zinc-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentRequests.map((r: any) => (
                <tr key={r.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-2 text-zinc-900">#{r.id}</td>
                  <td className="px-4 py-2">{r.type}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.status === "PENDING" ? "bg-amber-100 text-amber-800" :
                      r.status === "APPROVED" ? "bg-green-100 text-green-800" :
                      "bg-red-100 text-red-800"
                    }`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-2 text-xs text-zinc-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

