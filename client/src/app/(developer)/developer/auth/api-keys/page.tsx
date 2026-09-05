"use client";

import { useCallback, useEffect, useState } from "react";
import { getPlatformConfigs, updatePlatformConfig } from "@/features/developer/_services/developer-service";
import type { PlatformConfig } from "@/features/developer/_types";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { toast } from "sonner";

function generateApiKey(): string {
  return "ak_" + Array.from({ length: 32 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<PlatformConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPlatformConfigs();
      setKeys(result.data.filter((c) => c.key?.startsWith("apikey.")));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  async function generateKey() {
    setGenerating(true);
    try {
      const key = generateApiKey();
      const { createPlatformConfig } = await import("@/features/developer/_services/developer-service");
      await createPlatformConfig({
        key: `apikey.${key}`,
        value: JSON.stringify({ name: "API Key", createdAt: new Date().toISOString(), active: true }),
        valueType: "JSON",
        category: "SECURITY",
        description: "API key",
      });
      toast.success("API key generated");
      fetchKeys();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setGenerating(false);
    }
  }

  async function revokeKey(cfg: PlatformConfig) {
    try {
      const data = JSON.parse(cfg.value ?? "{}");
      data.active = false;
      await updatePlatformConfig(cfg.key, JSON.stringify(data));
      toast.success("Key revoked");
      fetchKeys();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">API Keys</h1>
          <p className="mt-1 text-sm text-zinc-600">Manage API keys for external integrations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={fetchKeys} disabled={loading}>Refresh</Button>
          <Button variant="primary" size="sm" onClick={generateKey} disabled={generating}>
            {generating ? "Generating..." : "+ Generate Key"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm text-zinc-500">Loading...</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Key</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Created</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Status</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">
                    No API keys. Generate one to get started.
                  </td>
                </tr>
              ) : (
                keys.map((cfg) => {
                  let data: any = {};
                  try { data = JSON.parse(cfg.value ?? "{}"); } catch {}
                  const isActive = data.active !== false;
                  return (
                    <tr key={cfg.id} className="border-b border-zinc-100 last:border-0">
                      <td className="px-4 py-3 font-medium text-zinc-900">{data.name ?? "Unnamed"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-500">{cfg.key?.replace("apikey.", "")}</td>
                      <td className="px-4 py-3 text-xs text-zinc-400">
                        {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={isActive ? "success" : "danger"}>
                          {isActive ? "Active" : "Revoked"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isActive && (
                          <Button variant="secondary" size="sm" onClick={() => revokeKey(cfg)}>
                            Revoke
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
