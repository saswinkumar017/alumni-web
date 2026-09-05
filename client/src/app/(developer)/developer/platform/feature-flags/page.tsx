"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getFeatureFlags,
  createFeatureFlag,
  toggleFeatureFlag,
  deleteFeatureFlag,
} from "@/features/developer/_services/developer-service";
import type { FeatureFlag } from "@/features/developer/_types";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import TextInput from "@/components/ui/text-input";
import { toast } from "sonner";

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newFlag, setNewFlag] = useState({ code: "", name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getFeatureFlags();
      setFlags(result.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load feature flags");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  async function handleToggle(id: number, currentEnabled: boolean) {
    setToggling(id);
    try {
      const result = await toggleFeatureFlag(id, !currentEnabled);
      setFlags((prev) => prev.map((f) => (f.id === id ? result.data : f)));
      toast.success(`Flag ${!currentEnabled ? "enabled" : "disabled"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle flag");
    } finally {
      setToggling(null);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete flag "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deleteFeatureFlag(id);
      setFlags((prev) => prev.filter((f) => f.id !== id));
      toast.success("Flag deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete flag");
    } finally {
      setDeleting(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newFlag.code.trim() || !newFlag.name.trim()) return;
    setSaving(true);
    try {
      const result = await createFeatureFlag({
        code: newFlag.code.trim(),
        name: newFlag.name.trim(),
        description: newFlag.description.trim() || undefined,
      });
      setFlags((prev) => [...prev, result.data]);
      setNewFlag({ code: "", name: "", description: "" });
      setShowCreate(false);
      toast.success("Feature flag created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create flag");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Feature Flags</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Toggle features on and off across the platform.
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "Create Flag"}
        </Button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mt-4 rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="text-sm font-medium text-zinc-900">New Feature Flag</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <TextInput
              id="flag-code"
              label="Code"
              value={newFlag.code}
              onChange={(e) => setNewFlag((p) => ({ ...p, code: e.target.value }))}
              placeholder="e.g. new_dashboard"
            />
            <TextInput
              id="flag-name"
              label="Name"
              value={newFlag.name}
              onChange={(e) => setNewFlag((p) => ({ ...p, name: e.target.value }))}
              placeholder="Human-readable name"
            />
          </div>
          <div className="mt-3">
            <TextInput
              id="flag-desc"
              label="Description"
              value={newFlag.description}
              onChange={(e) => setNewFlag((p) => ({ ...p, description: e.target.value }))}
              placeholder="Optional description"
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" disabled={saving || !newFlag.code.trim() || !newFlag.name.trim()}>
              {saving ? "Saving..." : "Create"}
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="mt-6 flex min-h-[200px] items-center justify-center text-sm text-zinc-500">
          Loading feature flags...
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Code</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Description</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Created</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {flags.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">
                    No feature flags found.
                  </td>
                </tr>
              ) : (
                flags.map((flag) => (
                  <tr key={flag.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3">
                      <Badge variant={flag.isEnabled ? "success" : "default"}>
                        {flag.isEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-900">{flag.code}</td>
                    <td className="px-4 py-3 font-medium text-zinc-900">{flag.name}</td>
                    <td className="px-4 py-3 text-zinc-500 max-w-xs truncate">{flag.description || "—"}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400">
                      {flag.createdAt ? new Date(flag.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggle(flag.id, flag.isEnabled)}
                          disabled={toggling === flag.id}
                          className={`text-sm font-medium disabled:opacity-50 ${
                            flag.isEnabled ? "text-red-600 hover:text-red-800" : "text-emerald-600 hover:text-emerald-800"
                          }`}
                        >
                          {toggling === flag.id ? "..." : flag.isEnabled ? "Disable" : "Enable"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(flag.id, flag.name)}
                          disabled={deleting === flag.id}
                          className="text-sm text-zinc-400 hover:text-red-600 disabled:opacity-50"
                        >
                          {deleting === flag.id ? "..." : "Delete"}
                        </button>
                      </div>
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
