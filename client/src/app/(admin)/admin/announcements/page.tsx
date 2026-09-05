"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { env } from "@/config/env";

const API = env.api.baseUrl;
const HEADERS = () => ({ Authorization: `Bearer ${localStorage.getItem("accessToken")}`, "Content-Type": "application/json" });

interface Announcement { id: string; title: string; body: string; author: string; createdAt: string; featured: boolean; isActive: boolean; tags: string[]; }

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [featured, setFeatured] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/announcements`, { headers: HEADERS() });
      if (res.ok) setItems(await res.json());
      else toast.error("Failed to load announcements");
    } catch { toast.error("Failed to load announcements"); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!title.trim() || !body.trim()) return toast.error("Title and body required");
    try {
      const res = editingId === null
        ? await fetch(`${API}/admin/announcements`, {
            method: "POST",
            headers: HEADERS(),
            body: JSON.stringify({ title: title.trim(), body: body.trim(), featured }),
          })
        : await fetch(`${API}/admin/announcements/${editingId}`, {
            method: "PUT",
            headers: HEADERS(),
            body: JSON.stringify({ title: title.trim(), body: body.trim(), featured }),
          });
      if (!res.ok) throw new Error(String(res.status));
      setTitle(""); setBody(""); setFeatured(false); setEditingId(null); setShowForm(false);
      toast.success(editingId ? "Updated" : "Created");
      await load();
    } catch { toast.error("Failed to save"); }
  }

  async function toggleActive(a: Announcement) {
    try {
      const res = await fetch(`${API}/admin/announcements/${a.id}`, {
        method: "PUT",
        headers: HEADERS(),
        body: JSON.stringify({ isActive: !a.isActive }),
      });
      if (res.ok) { await load(); toast.success(a.isActive ? "Deactivated" : "Activated"); }
      else toast.error("Failed to update");
    } catch { toast.error("Failed to update"); }
  }

  async function remove(id: string) {
    try {
      const res = await fetch(`${API}/admin/announcements/${id}`, { method: "DELETE", headers: HEADERS() });
      if (res.ok) { await load(); toast.success("Deleted"); }
      else toast.error("Failed to delete");
    } catch { toast.error("Failed to delete"); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">Announcements</h1>
        <button type="button" onClick={() => { setShowForm(true); setTitle(""); setBody(""); setFeatured(false); setEditingId(null); }} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">+ New</button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-bold text-zinc-900">{editingId ? "Edit" : "New"} Announcement</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="ann-title" className="block text-xs font-medium text-zinc-600">Title</label>
              <input id="ann-title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder="Announcement title" />
            </div>
            <div>
              <label htmlFor="ann-body" className="block text-xs font-medium text-zinc-600">Body</label>
              <textarea id="ann-body" value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder="Announcement content..." />
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="rounded border-zinc-300" />
              Featured announcement
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={save} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">{editingId ? "Update" : "Create"}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {items === null ? (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-zinc-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center">
          <p className="text-sm text-zinc-500">No announcements yet.</p>
          <p className="mt-1 text-xs text-zinc-400">Click &quot;+ New&quot; to create your first announcement.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className={`rounded-lg border bg-white p-4 ${a.isActive ? "border-zinc-200" : "border-zinc-100 opacity-60"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-zinc-900">{a.title}</h3>
                    {a.featured && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Featured</span>}
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">{a.body}</p>
                  <p className="mt-2 text-xs text-zinc-400">{a.author} · {new Date(a.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => { setEditingId(a.id); setTitle(a.title); setBody(a.body); setFeatured(a.featured); setShowForm(true); }} className="text-xs text-zinc-500 hover:text-zinc-900">Edit</button>
                  <button type="button" onClick={() => toggleActive(a)} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${a.isActive ? "bg-green-100 text-green-800" : "bg-zinc-100 text-zinc-500"}`}>
                    {a.isActive ? "Active" : "Draft"}
                  </button>
                  <button type="button" onClick={() => remove(a.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
