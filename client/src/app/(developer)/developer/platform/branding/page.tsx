"use client";

import { useCallback, useEffect, useState } from "react";
import { getPlatformConfigs, updatePlatformConfig } from "@/features/developer/_services/developer-service";
import type { PlatformConfig } from "@/features/developer/_types";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import Badge from "@/components/ui/badge";
import { toast } from "sonner";

const BRANDING_FIELDS = [
  { key: "brand.site_name", label: "Site Name", placeholder: "JJCET Alumni" },
  { key: "brand.tagline", label: "Tagline", placeholder: "Connecting generations" },
  { key: "brand.primary_color", label: "Primary Color", placeholder: "#1e40af" },
  { key: "brand.secondary_color", label: "Secondary Color", placeholder: "#3b82f6" },
  { key: "brand.accent_color", label: "Accent Color", placeholder: "#10b981" },
  { key: "brand.logo_url", label: "Logo URL", placeholder: "/images/logo.png" },
  { key: "brand.favicon_url", label: "Favicon URL", placeholder: "/icons/favicon.ico" },
  { key: "brand.footer_text", label: "Footer Text", placeholder: "© 2026 JJCET Alumni" },
  { key: "brand.contact_email", label: "Contact Email", placeholder: "admin@jjcet.ac.in" },
  { key: "brand.contact_phone", label: "Contact Phone", placeholder: "+91-XXX-XXXX" },
];

export default function BrandingPage() {
  const [configs, setConfigs] = useState<PlatformConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPlatformConfigs();
      setConfigs(result.data.filter((c) => c.key?.startsWith("brand.")));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load branding");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  function getConfigValue(key: string): string {
    if (localValues[key] !== undefined) return localValues[key];
    return configs.find((c) => c.key === key)?.value ?? "";
  }

  async function handleSave(key: string) {
    setSavingKey(key);
    try {
      const existing = configs.find((c) => c.key === key);
      if (existing) {
        await updatePlatformConfig(key, getConfigValue(key));
      } else {
        const { createPlatformConfig } = await import("@/features/developer/_services/developer-service");
        await createPlatformConfig({ key, value: getConfigValue(key), valueType: "STRING", category: "GENERAL", description: key });
      }
      toast.success(`${key} saved`);
      setLocalValues((prev) => { const n = { ...prev }; delete n[key]; return n; });
      fetchConfigs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingKey(null);
    }
  }

  const previewColor = getConfigValue("brand.primary_color");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Branding</h1>
          <p className="mt-1 text-sm text-zinc-600">Customize site name, logo, colors, and branding elements.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchConfigs} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {/* preview */}
      {previewColor && (
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="mb-2 text-xs font-medium text-zinc-500">Color Preview</p>
          <div className="flex gap-2">
            {["brand.primary_color", "brand.secondary_color", "brand.accent_color"].map((k) => {
              const c = getConfigValue(k);
              return c ? (
                <div key={k} className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded border border-zinc-200" style={{ backgroundColor: c }} />
                  <span className="text-xs text-zinc-500">{c}</span>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm text-zinc-500">Loading...</div>
      ) : (
        <div className="space-y-3">
          {BRANDING_FIELDS.map((field) => {
            const current = getConfigValue(field.key);
            const hasUnsaved = localValues[field.key] !== undefined;
            return (
              <div key={field.key} className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-4">
                {field.key.includes("color") && current && (
                  <div className="h-6 w-6 shrink-0 rounded border border-zinc-200" style={{ backgroundColor: current }} />
                )}
                <div className="flex-1">
                  <TextInput
                    id={field.key}
                    label={field.label}
                    type="text"
                    value={current}
                    onChange={(e) => setLocalValues((p) => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                  />
                </div>
                <div className="flex items-center gap-2">
                  {hasUnsaved && <Badge variant="warning">Modified</Badge>}
                  <Button variant={hasUnsaved ? "primary" : "secondary"} size="sm" onClick={() => handleSave(field.key)} disabled={savingKey === field.key || !hasUnsaved}>
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
