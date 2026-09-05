"use client";

import { useCallback, useEffect, useState } from "react";
import { getPlatformConfigs, updatePlatformConfig } from "@/features/developer/_services/developer-service";
import type { PlatformConfig } from "@/features/developer/_types";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import { toast } from "sonner";

export default function ConfigPage() {
  const [configs, setConfigs] = useState<PlatformConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPlatformConfigs();
      setConfigs(result.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load configs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  function startEdit(config: PlatformConfig) {
    setEditingKey(config.key);
    setEditValue(config.value);
  }

  async function saveEdit(key: string) {
    setSaving(true);
    try {
      const result = await updatePlatformConfig(key, editValue);
      setConfigs((prev) =>
        prev.map((c) => (c.key === key ? { ...c, ...result.data } : c)),
      );
      setEditingKey(null);
      toast.success("Configuration updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;
    setSaving(true);
    try {
      const result = await updatePlatformConfig(newKey.trim(), newValue.trim());
      setConfigs((prev) => [...prev, result.data]);
      setNewKey("");
      setNewValue("");
      setShowCreate(false);
      toast.success("Configuration created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create config");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Platform Configuration</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Key-value configuration for the entire platform.
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "Create Config"}
        </Button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mt-4 rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="text-sm font-medium text-zinc-900">New Configuration</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <TextInput
              id="new-key"
              label="Key"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="e.g. app.setting_name"
            />
            <TextInput
              id="new-value"
              label="Value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Configuration value"
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" disabled={saving || !newKey.trim()}>
              {saving ? "Saving..." : "Create"}
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="mt-6 flex min-h-[200px] items-center justify-center text-sm text-zinc-500">
          Loading configurations...
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Key</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Value</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Category</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Updated</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {configs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">
                    No configurations found.
                  </td>
                </tr>
              ) : (
                configs.map((config) => (
                  <tr key={config.key} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-900">{config.key}</td>
                    <td className="px-4 py-3">
                      {editingKey === config.key ? (
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full rounded border border-zinc-300 px-2 py-1 text-sm text-zinc-900"
                          autoFocus
                        />
                      ) : (
                        <span className="max-w-xs truncate text-zinc-600">
                          {config.isSensitive ? "••••••••" : (config.value || "—")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{config.category || "—"}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400">
                      {config.updatedAt ? new Date(config.updatedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {config.isReadonly ? (
                        <span className="text-xs text-zinc-400">Read-only</span>
                      ) : editingKey === config.key ? (
                        <div className="flex gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => saveEdit(config.key)}
                            disabled={saving}
                          >
                            {saving ? "..." : "Save"}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditingKey(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(config)}
                          className="text-sm text-zinc-600 hover:text-zinc-900"
                        >
                          Edit
                        </button>
                      )}
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
