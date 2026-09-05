"use client";

import { useCallback, useEffect, useState } from "react";
import { getPlatformConfigs, updatePlatformConfig } from "@/features/developer/_services/developer-service";
import type { PlatformConfig } from "@/features/developer/_types";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { toast } from "sonner";

export default function MaintenancePage() {
  const [configs, setConfigs] = useState<PlatformConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maintenanceOn, setMaintenanceOn] = useState(false);
  const [message, setMessage] = useState("");

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPlatformConfigs();
      const cfgs = result.data;
      setConfigs(cfgs);
      setMaintenanceOn(cfgs.find((c) => c.key === "system.maintenance_mode")?.value === "true");
      setMessage(cfgs.find((c) => c.key === "system.maintenance_message")?.value ?? "");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load maintenance config");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  async function toggleMaintenance() {
    setSaving(true);
    try {
      const val = !maintenanceOn;
      await updatePlatformConfig("system.maintenance_mode", String(val));
      setMaintenanceOn(val);
      toast.success(val ? "Maintenance mode ON" : "Maintenance mode OFF");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveMessage() {
    setSaving(true);
    try {
      const existing = configs.find((c) => c.key === "system.maintenance_message");
      if (existing) {
        await updatePlatformConfig("system.maintenance_message", message);
      } else {
        const { createPlatformConfig } = await import("@/features/developer/_services/developer-service");
        await createPlatformConfig({ key: "system.maintenance_message", value: message, valueType: "STRING", category: "GENERAL", description: "Maintenance message" });
      }
      toast.success("Message saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Maintenance</h1>
        <p className="mt-1 text-sm text-zinc-600">Enable maintenance mode and set a custom message for users.</p>
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm text-zinc-500">Loading...</div>
      ) : (
        <>
          {/* toggle */}
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Maintenance Mode</h2>
              <p className="mt-1 text-sm text-zinc-500">When enabled, non-admin users see the maintenance page.</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={maintenanceOn ? "danger" : "success"}>
                {maintenanceOn ? "Active" : "Inactive"}
              </Badge>
              <Button
                variant={maintenanceOn ? "danger" : "primary"}
                size="sm"
                onClick={toggleMaintenance}
                disabled={saving}
              >
                {saving ? "..." : maintenanceOn ? "Disable" : "Enable"}
              </Button>
            </div>
          </div>

          {/* message */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-bold text-zinc-900">Maintenance Message</h2>
            <p className="mt-1 mb-3 text-sm text-zinc-500">Displayed to users when maintenance mode is active.</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              placeholder="We are currently performing scheduled maintenance. Please check back later."
            />
            <div className="mt-3 flex justify-end">
              <Button variant="primary" size="sm" onClick={saveMessage} disabled={saving}>
                {saving ? "Saving..." : "Save Message"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
