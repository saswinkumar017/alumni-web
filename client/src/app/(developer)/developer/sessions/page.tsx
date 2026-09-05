"use client";

import { useCallback, useEffect, useState } from "react";
import { getAuditLogs } from "@/features/developer/_services/developer-service";
import type { AuditLog } from "@/features/developer/_types";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { toast } from "sonner";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAuditLogs({ action: "LOGIN" });
      setSessions(result.content);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  function isRecent(dateStr: string): boolean {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    return diff < 30 * 60 * 1000;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Login Events</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Recent login activity and session history.
          </p>
        </div>
        <Button variant="secondary" onClick={fetchSessions} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {loading ? (
        <div className="mt-6 flex min-h-[200px] items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm text-zinc-500">
          Loading sessions...
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-left font-medium text-zinc-600">User ID</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Entity</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">IP Address</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Login Time</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">
                    No login events found.
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {session.userId ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={isRecent(session.createdAt) ? "success" : "default"}>
                        {isRecent(session.createdAt) ? "Recent" : "Older"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {session.entityType || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                      {session.ipAddress || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400">
                      {new Date(session.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
