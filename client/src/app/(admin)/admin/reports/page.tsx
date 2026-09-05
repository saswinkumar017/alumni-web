"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminDashboard, getAdminAuditStats } from "@/features/admin/_services/admin-service";

export default function ReportsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [auditStats, setAuditStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [d, a] = await Promise.allSettled([getAdminDashboard(), getAdminAuditStats()]);
      if (d.status === "fulfilled") setDashboard(d.value);
      if (a.status === "fulfilled") setAuditStats(a.value);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="flex min-h-[200px] items-center justify-center text-sm text-zinc-500">Loading reports...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Reports</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Alumni" value={dashboard?.totalAlumni ?? 0} />
        <StatCard title="Total Requests" value={dashboard?.totalRequests ?? 0} />
        <StatCard title="Pending Requests" value={dashboard?.pending ?? 0} color="text-amber-600" />
        <StatCard title="Approved Today" value={dashboard?.approvedToday ?? 0} color="text-green-600" />
        <StatCard title="Total Audit Events" value={auditStats?.totalEvents ?? 0} />
        <StatCard title="Error Events" value={auditStats?.errorCount ?? 0} color="text-red-600" />
      </div>

      {dashboard?.recentRequests && dashboard.recentRequests.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 px-4 py-3">
            <p className="text-sm font-medium text-zinc-700">Recent Requests</p>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="px-4 py-2 text-left font-medium text-zinc-600">ID</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-600">Type</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-600">Status</th>
              <th className="px-4 py-2 text-left font-medium text-zinc-600">Date</th>
            </tr></thead>
            <tbody>
              {dashboard.recentRequests.map((r: any) => (
                <tr key={r.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-2 font-mono text-xs text-zinc-500">#{r.id}</td>
                  <td className="px-4 py-2">{r.type}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.status === "PENDING" ? "bg-amber-100 text-amber-800" :
                      r.status === "APPROVED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
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

function StatCard({ title, value, color }: { title: string; value: number; color?: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{title}</p>
      <p className={`mt-1 text-2xl font-bold ${color ?? "text-zinc-900"}`}>{value.toLocaleString()}</p>
    </div>
  );
}
