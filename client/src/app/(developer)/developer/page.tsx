"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getUsers,
  getFeatureFlags,
  getAuditStats,
  getMonitoringData,
} from "@/features/developer/_services/developer-service";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { toast } from "sonner";

export default function DeveloperDashboardPage() {
  const [stats, setStats] = useState({
    users: 0,
    featureFlags: 0,
    auditLogs: 0,
    activeSessions: 0,
    memoryUsed: 0,
    memoryMax: 0,
    uptime: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, flagsRes, auditRes, monitorRes] = await Promise.allSettled([
        getUsers(0),
        getFeatureFlags(),
        getAuditStats(),
        getMonitoringData(),
      ]);

      const users = usersRes.status === "fulfilled" ? usersRes.value : null;
      const flags = flagsRes.status === "fulfilled" ? flagsRes.value : null;
      const audit = auditRes.status === "fulfilled" ? auditRes.value : null;
      const monitor = monitorRes.status === "fulfilled" ? monitorRes.value : null;

      setStats({
        users: users?.totalElements ?? 0,
        featureFlags: flags?.data?.length ?? 0,
        auditLogs: audit?.data?.totalEvents ?? 0,
        activeSessions: monitor?.activeSessions ?? 0,
        memoryUsed: monitor?.memoryUsedMB ?? 0,
        memoryMax: monitor?.memoryMaxMB ?? 0,
        uptime: monitor?.uptimeMs ?? 0,
      });

      const failures = [usersRes, flagsRes, auditRes, monitorRes].filter((r) => r.status === "rejected");
      if (failures.length > 0) {
        toast.warning(`Some dashboard data failed to load (${failures.length} of 4)`);
      }
    } catch (err) {
      toast.error("Failed to load dashboard data");
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
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Developer Dashboard</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Platform overview and quick actions.
          </p>
        </div>
        <Button variant="secondary" onClick={fetchData} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-zinc-500">Total Users</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">
            {loading ? "..." : stats.users}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500">Feature Flags</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">
            {loading ? "..." : stats.featureFlags}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500">Audit Events</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">
            {loading ? "..." : stats.auditLogs}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500">Active Sessions</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">
            {loading ? "..." : stats.activeSessions}
          </p>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-zinc-500">Memory Usage</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">
            {loading ? "..." : `${stats.memoryUsed} / ${stats.memoryMax} MB`}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500">Uptime</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">
            {loading ? "..." : formatUptime(stats.uptime)}
          </p>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900">Quick Actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href="/developer/rbac/roles"
            className="rounded-lg border border-zinc-200 bg-white p-4 text-sm font-medium text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50"
          >
            Manage Roles
          </a>
          <a
            href="/developer/rbac/permissions"
            className="rounded-lg border border-zinc-200 bg-white p-4 text-sm font-medium text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50"
          >
            Manage Permissions
          </a>
          <a
            href="/developer/users"
            className="rounded-lg border border-zinc-200 bg-white p-4 text-sm font-medium text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50"
          >
            Manage Users
          </a>
          <a
            href="/developer/audit"
            className="rounded-lg border border-zinc-200 bg-white p-4 text-sm font-medium text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50"
          >
            View Audit Logs
          </a>
          <a
            href="/developer/platform/config"
            className="rounded-lg border border-zinc-200 bg-white p-4 text-sm font-medium text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50"
          >
            Platform Config
          </a>
          <a
            href="/developer/platform/feature-flags"
            className="rounded-lg border border-zinc-200 bg-white p-4 text-sm font-medium text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50"
          >
            Feature Flags
          </a>
          <a
            href="/developer/monitoring"
            className="rounded-lg border border-zinc-200 bg-white p-4 text-sm font-medium text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50"
          >
            Monitoring
          </a>
        </div>
      </div>
    </div>
  );
}
