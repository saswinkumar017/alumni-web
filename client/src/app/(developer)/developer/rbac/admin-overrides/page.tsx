"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getRoleTemplates,
  updateRoleTemplate,
} from "@/features/developer/_services/developer-service";
import type { RoleTemplate } from "@/features/developer/_types";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import TextInput from "@/components/ui/text-input";
import { toast } from "sonner";

export default function AdminOverridesPage() {
  const [roles, setRoles] = useState<RoleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string[]>>({});
  const [newPerm, setNewPerm] = useState("");

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getRoleTemplates();
      setRoles(result.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  function toggleOverride(roleId: number, perm: string) {
    setOverrides((prev) => {
      const current = prev[roleId] ?? [];
      const has = current.includes(perm);
      return { ...prev, [roleId]: has ? current.filter((p) => p !== perm) : [...current, perm] };
    });
  }

  async function saveOverrides(roleId: number) {
    const perms = overrides[roleId] ?? [];
    try {
      await updateRoleTemplate(roleId, { permissions: perms } as any);
      toast.success("Admin overrides saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Admin Overrides</h1>
        <p className="mt-1 text-sm text-zinc-600">Override specific permissions for admin users by role.</p>
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm text-zinc-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* role list */}
          <div className="rounded-lg border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-4 py-3">
              <p className="text-sm font-medium text-zinc-700">Roles</p>
            </div>
            <div className="divide-y divide-zinc-100">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedId(role.id)}
                  className={`w-full px-4 py-3 text-left text-sm hover:bg-zinc-50 ${selectedId === role.id ? "bg-zinc-50 font-medium text-zinc-900" : "text-zinc-600"}`}
                >
                  {role.name}
                  {role.description && <span className="ml-2 text-xs text-zinc-400">{role.description}</span>}
                </button>
              ))}
              {roles.length === 0 && <p className="px-4 py-6 text-center text-sm text-zinc-400">No roles found</p>}
            </div>
          </div>

          {/* override config */}
          <div className="lg:col-span-2">
            {selectedId ? (
              <div className="rounded-lg border border-zinc-200 bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-zinc-900">
                    Overrides for {roles.find((r) => r.id === selectedId)?.name}
                  </h2>
                  <Button variant="primary" size="sm" onClick={() => saveOverrides(selectedId)}>
                    Save Overrides
                  </Button>
                </div>
                <p className="mb-4 text-sm text-zinc-500">
                  Add permission keys that should be force-granted to users with this role, regardless of standard permissions.
                </p>
                <div className="flex gap-2">
                  <TextInput
                    id="new-perm"
                    label=""
                    type="text"
                    value={newPerm}
                    onChange={(e) => setNewPerm(e.target.value)}
                    placeholder="e.g. admin.users.delete"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (newPerm.trim()) {
                        toggleOverride(selectedId, newPerm.trim());
                        setNewPerm("");
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(overrides[selectedId] ?? []).map((perm) => (
                    <Badge key={perm} variant="success">
                      {perm}
                      <button
                        onClick={() => toggleOverride(selectedId, perm)}
                        className="ml-1 text-xs hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  {!(overrides[selectedId]?.length) && (
                    <p className="text-sm text-zinc-400">No overrides configured</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex min-h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 bg-white">
                <p className="text-sm text-zinc-400">Select a role to configure overrides</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
