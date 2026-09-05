"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import {
  getAuditLogs,
  getAuditStats,
  exportAuditLogs,
  connectAuditStream,
} from "@/features/developer/_services/developer-service";
import type { AuditLog, AuditStats } from "@/features/developer/_types";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import TextInput from "@/components/ui/text-input";
import { toast } from "sonner";

// ── helpers ────────────────────────────────────────────────────────

function levelColor(level?: string) {
  switch (level?.toUpperCase()) {
    case "ERROR":
    case "CRITICAL":
      return "danger";
    case "WARN":
    case "WARNING":
      return "warning";
    default:
      return "success";
  }
}

function categoryBadgeVariant(cat?: string) {
  switch (cat?.toUpperCase()) {
    case "AUTH":
      return "warning" as const;
    case "SECURITY":
      return "danger" as const;
    case "USER_ACTION":
      return "success" as const;
    case "ENDPOINT":
      return "default" as const;
    case "DATABASE":
      return "warning" as const;
    case "SYSTEM":
      return "default" as const;
    default:
      return "default" as const;
  }
}

function methodBadgeVariant(m?: string) {
  switch (m?.toUpperCase()) {
    case "POST":
      return "success" as const;
    case "PUT":
    case "PATCH":
      return "warning" as const;
    case "DELETE":
      return "danger" as const;
    default:
      return "default" as const;
  }
}

function statusColor(code?: number) {
  if (!code) return "text-zinc-400";
  if (code >= 500) return "text-red-600 font-semibold";
  if (code >= 400) return "text-amber-600 font-semibold";
  if (code >= 300) return "text-blue-600";
  return "text-green-600";
}

function durationColor(ms?: number) {
  if (ms == null) return "text-zinc-400";
  if (ms >= 1000) return "text-red-600";
  if (ms >= 500) return "text-amber-600";
  return "text-zinc-600";
}

const EMPTY_STATS: AuditStats = {
  totalEvents: 0,
  eventsToday: 0,
  errorCount: 0,
  avgDurationMs: 0,
  eventsByAction: {},
  eventsByEntity: {},
  eventsByCategory: {},
};

// ── component ──────────────────────────────────────────────────────

export default function AuditPage() {
  // data
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // filters
  const [filters, setFilters] = useState({
    action: "",
    userId: "",
    from: "",
    to: "",
    category: "",
    logLevel: "",
    method: "",
    endpoint: "",
    statusCode: "",
  });

  // real-time
  const [realTime, setRealTime] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // ── fetch logs ────────────────────────────────────────────────

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAuditLogs({
        page,
        action: filters.action || undefined,
        userId: filters.userId ? Number(filters.userId) : undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        category: filters.category || undefined,
        logLevel: filters.logLevel || undefined,
        method: filters.method || undefined,
      });
      setLogs(result.content);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalElements);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  const fetchStats = useCallback(async () => {
    try {
      const result = await getAuditStats();
      setStats(result.data);
    } catch {
      // non-critical; silently ignore
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [fetchLogs, fetchStats]);

  // ── SSE stream ────────────────────────────────────────────────

  useEffect(() => {
    if (!realTime) {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      return;
    }
    const source = connectAuditStream(
      (log) => {
        setLogs((prev) => [log, ...prev]);
        setTotalCount((c) => c + 1);
        setStats((s) => ({ ...s, totalEvents: s.totalEvents + 1, eventsToday: s.eventsToday + 1 }));
        if (log.logLevel?.toUpperCase() === "ERROR" || log.logLevel?.toUpperCase() === "CRITICAL") {
          setStats((s) => ({ ...s, errorCount: s.errorCount + 1 }));
          toast.error(`Error: ${log.action} on ${log.endpoint ?? log.entityType ?? "unknown"}`);
        }
      },
      () => {
        toast.error("Audit stream disconnected");
        setRealTime(false);
      },
    );
    eventSourceRef.current = source;
    return () => {
      source.close();
      eventSourceRef.current = null;
    };
  }, [realTime]);

  // ── handlers ──────────────────────────────────────────────────

  function handleFilterChange(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  }

  function clearFilters() {
    setFilters({ action: "", userId: "", from: "", to: "", category: "", logLevel: "", method: "", endpoint: "", statusCode: "" });
    setPage(0);
  }

  async function handleExport(format: "csv" | "json") {
    try {
      const blob = await exportAuditLogs(
        {
          action: filters.action || undefined,
          userId: filters.userId ? Number(filters.userId) : undefined,
          from: filters.from || undefined,
          to: filters.to || undefined,
          category: filters.category || undefined,
          logLevel: filters.logLevel || undefined,
          method: filters.method || undefined,
        },
        format,
      );
      const ext = format === "csv" ? "csv" : "json";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported audit logs as ${ext.toUpperCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    }
  }

  // client-side filters for username and status code
  const displayedLogs = logs.filter((log) => {
    if (filters.endpoint && !(log.endpoint ?? "").toLowerCase().includes(filters.endpoint.toLowerCase())) return false;
    if (filters.statusCode && String(log.statusCode) !== filters.statusCode) return false;
    return true;
  });

  // ── render ────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Audit Logs</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Complete system audit trail. {totalCount.toLocaleString()} total entries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { fetchLogs(); fetchStats(); }}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            variant={realTime ? "primary" : "secondary"}
            size="sm"
            onClick={() => setRealTime(!realTime)}
          >
            {realTime ? "● Live" : "○ Live"}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleExport("csv")}>
            Export CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleExport("json")}>
            Export JSON
          </Button>
        </div>
      </div>

      {/* stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Events", value: stats.totalEvents.toLocaleString() },
          { label: "Events Today", value: stats.eventsToday.toLocaleString() },
          { label: "Error Count", value: stats.errorCount.toLocaleString(), danger: stats.errorCount > 0 },
          { label: "Avg Response Time", value: `${stats.avgDurationMs.toFixed(0)}ms` },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-zinc-200 bg-white p-4"
          >
            <p className="text-xs font-medium text-zinc-500">{card.label}</p>
            <p className={`mt-1 text-2xl font-bold ${card.danger ? "text-red-600" : "text-zinc-900"}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* filter bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <div>
          <label htmlFor="filter-category" className="block text-xs font-medium text-zinc-600">
            Category
          </label>
          <select
            id="filter-category"
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            className="mt-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700"
          >
            <option value="">All categories</option>
            <option value="AUTH">Auth</option>
            <option value="ENDPOINT">Endpoint</option>
            <option value="DATABASE">Database</option>
            <option value="SECURITY">Security</option>
            <option value="USER_ACTION">User Action</option>
            <option value="SYSTEM">System</option>
          </select>
        </div>
        <div>
          <label htmlFor="filter-level" className="block text-xs font-medium text-zinc-600">
            Log Level
          </label>
          <select
            id="filter-level"
            value={filters.logLevel}
            onChange={(e) => handleFilterChange("logLevel", e.target.value)}
            className="mt-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700"
          >
            <option value="">All levels</option>
            <option value="INFO">Info</option>
            <option value="WARN">Warn</option>
            <option value="ERROR">Error</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
        <div>
          <label htmlFor="filter-method" className="block text-xs font-medium text-zinc-600">
            Method
          </label>
          <select
            id="filter-method"
            value={filters.method}
            onChange={(e) => handleFilterChange("method", e.target.value)}
            className="mt-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700"
          >
            <option value="">All methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
        <div>
          <label htmlFor="filter-action" className="block text-xs font-medium text-zinc-600">
            Action
          </label>
          <select
            id="filter-action"
            value={filters.action}
            onChange={(e) => handleFilterChange("action", e.target.value)}
            className="mt-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700"
          >
            <option value="">All actions</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
          </select>
        </div>
        <div>
          <TextInput
            id="filter-user"
            label="User ID"
            type="number"
            value={filters.userId}
            onChange={(e) => handleFilterChange("userId", e.target.value)}
            placeholder="User ID"
          />
        </div>
        <div>
          <TextInput
            id="filter-endpoint"
            label="Endpoint"
            type="text"
            value={filters.endpoint}
            onChange={(e) => handleFilterChange("endpoint", e.target.value)}
            placeholder="/api/..."
          />
        </div>
        <div>
          <TextInput
            id="filter-from"
            label="From"
            type="date"
            value={filters.from}
            onChange={(e) => handleFilterChange("from", e.target.value)}
          />
        </div>
        <div>
          <TextInput
            id="filter-to"
            label="To"
            type="date"
            value={filters.to}
            onChange={(e) => handleFilterChange("to", e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button variant="secondary" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        </div>
      </div>

      {/* table */}
      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm text-zinc-500">
          Loading audit logs...
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <div className="overflow-x-auto">
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
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">Duration</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">User</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-600">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedLogs.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-sm text-zinc-500">
                        No audit logs found.
                      </td>
                    </tr>
                  ) : (
                    displayedLogs.map((log) => {
                      const isExpanded = expandedId === log.id;
                      const hasDetails = log.oldValues || log.newValues || log.requestParams;
                      return (
                        <Fragment key={log.id}>
                          <tr
                            className={`border-b border-zinc-100 last:border-0 ${hasDetails ? "cursor-pointer hover:bg-zinc-50" : ""}`}
                            onClick={() => hasDetails && setExpandedId(isExpanded ? null : log.id)}
                          >
                            <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-400">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={categoryBadgeVariant(log.category)}>
                                {log.category ?? "—"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={levelColor(log.logLevel)}>
                                {log.logLevel ?? "INFO"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <span className="max-w-[120px] truncate text-xs text-zinc-700" title={log.action}>
                                {log.action}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {log.method ? (
                                <Badge variant={methodBadgeVariant(log.method)}>
                                  {log.method}
                                </Badge>
                              ) : (
                                <span className="text-xs text-zinc-400">—</span>
                              )}
                            </td>
                            <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs text-zinc-600">
                              {log.endpoint ?? "—"}
                            </td>
                            <td className={`px-4 py-3 font-mono text-xs ${statusColor(log.statusCode)}`}>
                              {log.statusCode ?? "—"}
                            </td>
                            <td className={`px-4 py-3 font-mono text-xs ${durationColor(log.durationMs)}`}>
                              {log.durationMs != null ? `${log.durationMs}ms` : "—"}
                            </td>
                            <td className="px-4 py-3 text-xs font-medium text-zinc-900">
                              {log.username ?? (log.userId ? `#${log.userId}` : "—")}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-zinc-500">
                              {log.ipAddress || "—"}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="border-b border-zinc-100 bg-zinc-50">
                              <td colSpan={10} className="px-4 py-3">
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                  {log.oldValues && (
                                    <div>
                                      <p className="mb-1 text-xs font-medium text-zinc-500">Old Values</p>
                                      <pre className="max-h-40 overflow-auto rounded bg-zinc-100 p-2 text-xs text-zinc-700">
                                        {(() => {
                                          try {
                                            return JSON.stringify(JSON.parse(log.oldValues), null, 2);
                                          } catch {
                                            return log.oldValues;
                                          }
                                        })()}
                                      </pre>
                                    </div>
                                  )}
                                  {log.newValues && (
                                    <div>
                                      <p className="mb-1 text-xs font-medium text-zinc-500">New Values</p>
                                      <pre className="max-h-40 overflow-auto rounded bg-zinc-100 p-2 text-xs text-zinc-700">
                                        {(() => {
                                          try {
                                            return JSON.stringify(JSON.parse(log.newValues), null, 2);
                                          } catch {
                                            return log.newValues;
                                          }
                                        })()}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                                {log.requestParams && (
                                  <div className="mt-3">
                                    <p className="mb-1 text-xs font-medium text-zinc-500">Request Params</p>
                                    <pre className="max-h-24 overflow-auto rounded bg-zinc-100 p-2 text-xs text-zinc-700">
                                      {(() => {
                                        try {
                                          return JSON.stringify(JSON.parse(log.requestParams), null, 2);
                                        } catch {
                                          return log.requestParams;
                                        }
                                      })()}
                                    </pre>
                                  </div>
                                )}
                                {log.responseSummary && (
                                  <div className="mt-3">
                                    <p className="mb-1 text-xs font-medium text-zinc-500">Response Summary</p>
                                    <p className="text-xs text-zinc-600">{log.responseSummary}</p>
                                  </div>
                                )}
                                {log.userAgent && (
                                  <div className="mt-3">
                                    <p className="mb-1 text-xs font-medium text-zinc-500">User Agent</p>
                                    <p className="break-all text-xs text-zinc-600">{log.userAgent}</p>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
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
        </>
      )}
    </div>
  );
}
