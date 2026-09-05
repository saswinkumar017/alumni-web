"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getRoleTemplates,
  createRoleTemplate,
  updateRoleTemplate,
  deleteRoleTemplate,
} from "@/features/developer/_services/developer-service";
import type { RoleTemplate } from "@/features/developer/_types";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import { toast } from "sonner";

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", code: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

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

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  function startEdit(role: RoleTemplate) {
    setEditId(role.id);
    setForm({
      name: role.name,
      code: role.code,
      description: role.description || "",
    });
    setShowCreate(false);
  }

  function startCreate() {
    setEditId(null);
    setForm({ name: "", code: "", description: "" });
    setShowCreate(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    try {
      if (editId) {
        const result = await updateRoleTemplate(editId, {
          name: form.name,
          description: form.description || undefined,
        });
        setRoles((prev) => prev.map((r) => (r.id === editId ? result.data : r)));
        toast.success("Role updated");
      } else {
        const result = await createRoleTemplate({
          name: form.name,
          code: form.code.trim(),
          description: form.description || undefined,
        });
        setRoles((prev) => [...prev, result.data]);
        toast.success("Role created");
      }
      setShowCreate(false);
      setEditId(null);
      setForm({ name: "", code: "", description: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save role");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete role "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deleteRoleTemplate(id);
      setRoles((prev) => prev.filter((r) => r.id !== id));
      toast.success("Role deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete role");
    } finally {
      setDeleting(null);
    }
  }

  function cancelForm() {
    setShowCreate(false);
    setEditId(null);
    setForm({ name: "", code: "", description: "" });
  }

  const isFormOpen = showCreate || editId !== null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Role Templates</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Define roles and their permissions.
          </p>
        </div>
        <Button onClick={startCreate}>Create Role</Button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mt-4 rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="text-sm font-medium text-zinc-900">
            {editId ? "Edit Role" : "New Role"}
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <TextInput
              id="role-name"
              label="Name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Role name"
            />
            {!editId && (
              <TextInput
                id="role-code"
                label="Code"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                placeholder="e.g. CONTENT_MANAGER"
              />
            )}
          </div>
          <div className="mt-3">
            <TextInput
              id="role-desc"
              label="Description"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Optional description"
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={cancelForm}>
              Cancel
            </Button>
            <Button size="sm" type="submit" disabled={saving || !form.name.trim()}>
              {saving ? "Saving..." : editId ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="mt-6 flex min-h-[200px] items-center justify-center text-sm text-zinc-500">
          Loading roles...
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Code</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Description</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">System</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Created</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">
                    No roles found.
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-zinc-900">{role.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">{role.code}</td>
                    <td className="px-4 py-3 text-zinc-500 max-w-xs truncate">{role.description || "—"}</td>
                    <td className="px-4 py-3">
                      {role.isSystem ? (
                        <span className="text-xs text-zinc-400">System</span>
                      ) : (
                        <span className="text-xs text-zinc-400">Custom</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400">
                      {role.createdAt ? new Date(role.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => startEdit(role)}
                          className="text-sm text-zinc-600 hover:text-zinc-900"
                        >
                          Edit
                        </button>
                        {!role.isSystem && (
                          <button
                            type="button"
                            onClick={() => handleDelete(role.id, role.name)}
                            disabled={deleting === role.id}
                            className="text-sm text-zinc-400 hover:text-red-600 disabled:opacity-50"
                          >
                            {deleting === role.id ? "..." : "Delete"}
                          </button>
                        )}
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
