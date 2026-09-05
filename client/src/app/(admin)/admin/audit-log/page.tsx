"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getAdminAuditLogs,
  connectAdminAuditStream,
} from "@/features/admin/_services/admin-service";
import type { AuditLog } from "@/features/developer/_types";

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [realTime, setRealTime] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const [category, setCategory] = useState("");
  const [logLevel, setLogLevel] = useState("");
  const [method, setMethod] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAdminAuditLogs({ page, category: category || undefined, logLevel: logLevel || undefined, method: method || undefined });
      setLogs(result.content ?? []);
      setTotalPages(result.totalPages ?? 0);
      setTotalCount(result.totalElements ?? 0);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [page, category, logLevel, method]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    if (!realTime) { eventSourceRef.current?.close(); eventSourceRef.current = null; return; }
    const source = connectAdminAuditStream(
      (log) => { setLogs((prev) => [log, ...prev]); setTotalCount((c) => c + 1); },
      () => { setRealTime(false); },
    );
    eventSourceRef.current = source;
    return () => { source.close(); eventSourceRef.current = null; };
  }, [realTime]);

  function clearFilters() { setCategory(""); setLogLevel(""); setMethod(""); setPage(0); }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Audit Log</h1>
          <p className="mt-1 text-sm text-zinc-600">{totalCount.toLocaleString()} total entries.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setRealTime(!realTime)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${realTime ? "bg-green-600 text-white" : "border border-zinc-300 text-zinc-600 hover:bg-zinc-50"}`}>
            {realTime ? "● Live" : "○ Live"}
          </button>
          <button onClick={fetchLogs} disabled={loading} className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-50">
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <div>
          <label className="block text-xs font-medium text-zinc-600">Category</label>
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(0); }} className="mt-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm">
            <option value="">All</option>
            <option value="AUTH">Auth</option>
            <option value="ENDPOINT">Endpoint</option>
            <option value="DATABASE">Database</option>
            <option value="SECURITY">Security</option>
            <option value="USER_ACTION">User Action</option>
            <option value="SYSTEM">System</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600">Level</label>
          <select value={logLevel} onChange={(e) => { setLogLevel(e.target.value); setPage(0); }} className="mt-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm">
            <option value="">All</option>
            <option value="INFO">Info</option>
            <option value="WARN">Warn</option>
            <option value="ERROR">Error</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600">Method</label>
          <select value={method} onChange={(e) => { setMethod(e.target.value); setPage(0); }} className="mt-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm">
            <option value="">All</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
        {(category || logLevel || method) && (
          <button onClick={clearFilters} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50">Clear</button>
        )}
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm text-zinc-500">Loading...</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Time</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Category</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Level</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Action</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Method</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Endpoint</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">User</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-zinc-500">No audit logs found.</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-400">{log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      log.category === "SECURITY" ? "bg-red-100 text-red-800" : log.category === "AUTH" ? "bg-amber-100 text-amber-800" : "bg-zinc-100 text-zinc-700"
                    }`}>{log.category ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      log.logLevel === "ERROR" || log.logLevel === "CRITICAL" ? "bg-red-100 text-red-800" : log.logLevel === "WARN" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
                    }`}>{log.logLevel ?? "INFO"}</span>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs text-zinc-600">{log.action}</td>
                  <td className="px-4 py-3">{log.method ?? "—"}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs text-zinc-500">{log.endpoint ?? "—"}</td>
                  <td className={`px-4 py-3 font-mono text-xs ${log.statusCode && log.statusCode >= 400 ? "text-red-600 font-semibold" : "text-zinc-600"}`}>{log.statusCode ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-zinc-600">{log.username ?? (log.userId ? `#${log.userId}` : "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3">
              <span className="text-sm text-zinc-500">Page {page + 1} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="rounded border border-zinc-300 px-3 py-1 text-xs text-zinc-600 disabled:opacity-50">Prev</button>
                <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="rounded border border-zinc-300 px-3 py-1 text-xs text-zinc-600 disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
