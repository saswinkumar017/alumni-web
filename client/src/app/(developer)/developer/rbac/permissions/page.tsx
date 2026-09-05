"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getPermissions,
  createPermission,
} from "@/features/developer/_services/developer-service";
import type { Permission } from "@/features/developer/_types";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import { toast } from "sonner";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", code: "" });
  const [saving, setSaving] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPermissions();
      setPermissions(result.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load permissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const grouped = useMemo(() => {
    return permissions.reduce<Record<string, Permission[]>>((acc, p) => {
      const cat = p.group?.category?.name ?? p.group?.name ?? "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat]!.push(p);
      return acc;
    }, {});
  }, [permissions]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return;
    setSaving(true);
    try {
      const result = await createPermission({
        name: form.name.trim(),
        code: form.code.trim(),
      });
      setPermissions((prev) => [...prev, result.data]);
      setForm({ name: "", code: "" });
      setShowCreate(false);
      toast.success("Permission created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create permission");
    } finally {
      setSaving(false);
    }
  }

  const categories = Object.keys(grouped);
  const totalPermissions = permissions.length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Permissions</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {totalPermissions} permissions across {categories.length} categories.
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "Create Permission"}
        </Button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mt-4 rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="text-sm font-medium text-zinc-900">New Permission</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <TextInput
              id="perm-name"
              label="Name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. View Users"
            />
            <TextInput
              id="perm-code"
              label="Code"
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              placeholder="e.g. users.read"
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" disabled={saving || !form.name.trim() || !form.code.trim()}>
              {saving ? "Saving..." : "Create"}
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="mt-6 flex min-h-[200px] items-center justify-center text-sm text-zinc-500">
          Loading permissions...
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const perms = grouped[cat] || [];
            const isExpanded = expandedCategory === cat;
            return (
              <div
                key={cat}
                className="rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-300"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-zinc-900">{cat}</h3>
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                    {perms.length}
                  </span>
                </div>
                {isExpanded && perms.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {perms.map((p) => (
                      <li key={p.id} className="flex items-center justify-between text-sm text-zinc-600">
                        <div>
                          <span className="font-mono text-xs text-zinc-500">{p.code}</span>
                          <span className="mx-1.5 text-zinc-300">|</span>
                          {p.name}
                        </div>
                        {p.riskLevel && (
                          <span className="text-xs text-zinc-400">{p.riskLevel}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                  className="mt-3 text-sm text-zinc-600 hover:text-zinc-900"
                >
                  {isExpanded ? "Collapse" : "View all"} →
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
