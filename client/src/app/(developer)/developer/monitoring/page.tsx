"use client";

import { useCallback, useEffect, useState } from "react";
import { getMonitoringData } from "@/features/developer/_services/developer-service";
import type { MonitoringData } from "@/features/developer/_types";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { toast } from "sonner";

export default function MonitoringPage() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMonitoringData();
      setData(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load monitoring data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function formatUptime(ms: number): string {
    if (!ms) return "—";
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h ${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
  }

  function healthVariant(status?: string): "success" | "warning" | "danger" | "default" {
    if (status === "healthy" || status === "UP") return "success";
    if (status === "degraded" || status === "DOWN") return "warning";
    return "default";
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Platform Monitoring</h1>
          <p className="mt-1 text-sm text-zinc-600">Real-time system health and resource usage.</p>
        </div>
        <Button variant="secondary" onClick={fetchData} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {loading ? (
        <div className="mt-6 flex min-h-[200px] items-center justify-center text-sm text-zinc-500">
          Loading monitoring data...
        </div>
      ) : data ? (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <p className="text-sm text-zinc-500">Status</p>
              <div className="mt-1">
                <Badge variant={healthVariant(data.status)}>
                  {data.status || "Unknown"}
                </Badge>
              </div>
            </Card>
            <Card>
              <p className="text-sm text-zinc-500">Total Users</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900">{data.totalUsers ?? "—"}</p>
            </Card>
            <Card>
              <p className="text-sm text-zinc-500">Active Sessions</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900">{data.activeSessions ?? "—"}</p>
            </Card>
            <Card>
              <p className="text-sm text-zinc-500">Processors</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900">{data.processors ?? "—"}</p>
            </Card>
          </div>

          <h2 className="mt-8 text-lg font-semibold text-zinc-900">System Resources</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Card>
              <p className="text-sm text-zinc-500">Memory Usage</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900">
                {data.memoryUsedMB ?? 0} / {data.memoryMaxMB ?? 0} MB
              </p>
              {data.memoryMaxMB ? (
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{
                      width: `${Math.min(100, ((data.memoryUsedMB ?? 0) / (data.memoryMaxMB ?? 1)) * 100)}%`,
                    }}
                  />
                </div>
              ) : null}
            </Card>
            <Card>
              <p className="text-sm text-zinc-500">Uptime</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900">
                {formatUptime(data.uptimeMs ?? 0)}
              </p>
            </Card>
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
          No monitoring data available.
        </div>
      )}
    </div>
  );
}
