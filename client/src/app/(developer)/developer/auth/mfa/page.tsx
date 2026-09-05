"use client";

import { useCallback, useEffect, useState } from "react";
import { getPlatformConfigs, updatePlatformConfig } from "@/features/developer/_services/developer-service";
import type { PlatformConfig } from "@/features/developer/_types";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { toast } from "sonner";

const MFA_OPTIONS = [
  { key: "mfa.enabled", label: "Enable MFA", description: "Require multi-factor authentication for all users" },
  { key: "mfa.required_for_admin", label: "Required for Admins", description: "Force MFA for admin accounts" },
  { key: "mfa.required_for_developer", label: "Required for Developer", description: "Force MFA for developer accounts" },
  { key: "mfa.allow_sms", label: "Allow SMS", description: "Allow SMS-based verification" },
  { key: "mfa.allow_authenticator", label: "Allow Authenticator App", description: "Allow TOTP authenticator apps" },
  { key: "mfa.allow_backup_codes", label: "Allow Backup Codes", description: "Allow backup recovery codes" },
  { key: "mfa.backup_code_count", label: "Backup Code Count", description: "Number of backup codes generated" },
];

export default function MfaPage() {
  const [configs, setConfigs] = useState<PlatformConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPlatformConfigs();
      setConfigs(result.data.filter((c) => c.key?.startsWith("mfa.")));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load MFA config");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  function getValue(key: string): string {
    return configs.find((c) => c.key === key)?.value ?? "false";
  }

  async function toggleOption(key: string) {
    setSavingKey(key);
    try {
      const current = getValue(key);
      const newVal = current === "true" ? "false" : "true";
      const existing = configs.find((c) => c.key === key);
      if (existing) {
        await updatePlatformConfig(key, newVal);
      } else {
        const { createPlatformConfig } = await import("@/features/developer/_services/developer-service");
        await createPlatformConfig({ key, value: newVal, valueType: "BOOLEAN", category: "SECURITY", description: key });
      }
      toast.success(`${key} ${newVal === "true" ? "enabled" : "disabled"}`);
      fetchConfigs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">MFA Settings</h1>
          <p className="mt-1 text-sm text-zinc-600">Configure multi-factor authentication policies.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchConfigs} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm text-zinc-500">Loading...</div>
      ) : (
        <div className="space-y-3">
          {MFA_OPTIONS.map((opt) => {
            const isEnabled = getValue(opt.key) === "true";
            return (
              <div key={opt.key} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-4">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{opt.label}</p>
                  <p className="text-xs text-zinc-500">{opt.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={isEnabled ? "success" : "default"}>
                    {isEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Button
                    variant={isEnabled ? "danger" : "primary"}
                    size="sm"
                    onClick={() => toggleOption(opt.key)}
                    disabled={savingKey === opt.key}
                  >
                    {savingKey === opt.key ? "..." : isEnabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
