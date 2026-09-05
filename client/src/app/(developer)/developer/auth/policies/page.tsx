"use client";

import { useCallback, useEffect, useState } from "react";
import { getPlatformConfigs, updatePlatformConfig } from "@/features/developer/_services/developer-service";
import type { PlatformConfig } from "@/features/developer/_types";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import Badge from "@/components/ui/badge";
import { toast } from "sonner";

const POLICY_FIELDS = [
  { key: "auth.password_min_length", label: "Minimum Password Length", type: "number", placeholder: "8" },
  { key: "auth.password_require_uppercase", label: "Require Uppercase", type: "select", options: ["true", "false"] },
  { key: "auth.password_require_number", label: "Require Number", type: "select", options: ["true", "false"] },
  { key: "auth.password_require_special", label: "Require Special Character", type: "select", options: ["true", "false"] },
  { key: "auth.max_login_attempts", label: "Max Login Attempts", type: "number", placeholder: "5" },
  { key: "auth.lockout_duration_minutes", label: "Lockout Duration (minutes)", type: "number", placeholder: "30" },
  { key: "auth.session_timeout_minutes", label: "Session Timeout (minutes)", type: "number", placeholder: "60" },
  { key: "auth.jwt_expiry_hours", label: "JWT Token Expiry (hours)", type: "number", placeholder: "24" },
  { key: "auth.refresh_token_expiry_days", label: "Refresh Token Expiry (days)", type: "number", placeholder: "7" },
  { key: "auth.require_email_verification", label: "Require Email Verification", type: "select", options: ["true", "false"] },
  { key: "auth.allow_registration", label: "Allow Public Registration", type: "select", options: ["true", "false"] },
];

export default function AuthPoliciesPage() {
  const [configs, setConfigs] = useState<PlatformConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPlatformConfigs();
      setConfigs(result.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load auth policies");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  function getConfigValue(key: string): string {
    if (localValues[key] !== undefined) return localValues[key];
    return configs.find((c) => c.key === key)?.value ?? "";
  }

  async function handleSave(key: string, value: string) {
    setSavingKey(key);
    try {
      const existing = configs.find((c) => c.key === key);
      if (existing) {
        await updatePlatformConfig(key, value);
      } else {
        const { createPlatformConfig } = await import("@/features/developer/_services/developer-service");
        await createPlatformConfig({ key, value, valueType: "STRING", category: "AUTH", description: key });
      }
      toast.success(`${key} updated`);
      setLocalValues((prev) => { const n = { ...prev }; delete n[key]; return n; });
      fetchConfigs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Auth Policies</h1>
          <p className="mt-1 text-sm text-zinc-600">Configure authentication policies, password rules, and session limits.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchConfigs} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm text-zinc-500">
          Loading auth policies...
        </div>
      ) : (
        <div className="space-y-4">
          {POLICY_FIELDS.map((field) => {
            const current = getConfigValue(field.key);
            const hasUnsaved = localValues[field.key] !== undefined && localValues[field.key] !== current;
            return (
              <div key={field.key} className="flex items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-zinc-600">{field.label}</label>
                  <code className="mt-1 block text-[10px] text-zinc-400">{field.key}</code>
                </div>
                {field.type === "select" ? (
                  <select
                    value={getConfigValue(field.key)}
                    onChange={(e) => setLocalValues((p) => ({ ...p, [field.key]: e.target.value }))}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700"
                  >
                    {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <TextInput
                    id={field.key}
                    label=""
                    type={field.type}
                    value={getConfigValue(field.key)}
                    onChange={(e) => setLocalValues((p) => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                  />
                )}
                <div className="flex items-center gap-2">
                  {hasUnsaved && <Badge variant="warning">Modified</Badge>}
                  <Button
                    variant={hasUnsaved ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => handleSave(field.key, getConfigValue(field.key))}
                    disabled={savingKey === field.key || !hasUnsaved}
                  >
                    {savingKey === field.key ? "..." : "Save"}
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
