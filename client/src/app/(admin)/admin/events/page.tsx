"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getAdminEvents,
  createAdminEvent,
  updateAdminEvent,
  deleteAdminEvent,
  type AdminEvent,
  type AdminEventInput,
} from "@/features/admin/_services/admin-service";

const inputCls =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm";
const labelCls = "block text-xs font-medium text-zinc-600";

function toDateTimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toBackendDateTime(local: string): string {
  return local.length === 16 ? `${local}:00` : local;
}

const EMPTY_FORM = {
  title: "",
  slug: "",
  description: "",
  venue: "",
  eventDate: "",
  coverImageUrl: "",
  status: "DRAFT" as "DRAFT" | "PUBLISHED" | "CANCELLED",
  maxAttendees: "",
  customFields: "",
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      setEvents(await getAdminEvents());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (!editing && !creating) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditing(null);
        setCreating(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, creating]);

  function openCreate() {
    setForm({ ...EMPTY_FORM });
    setCreating(true);
    setEditing(null);
  }

  function openEdit(ev: AdminEvent) {
    setForm({
      title: ev.title,
      slug: ev.slug,
      description: ev.description ?? "",
      venue: ev.location ?? "",
      eventDate: toDateTimeLocal(ev.date),
      coverImageUrl: ev.image ?? "",
      status: "PUBLISHED",
      maxAttendees: ev.maxAttendees != null ? String(ev.maxAttendees) : "",
      customFields: ev.customFields ? JSON.stringify(ev.customFields, null, 2) : "",
    });
    setEditing(ev);
    setCreating(false);
  }

  function set<K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.eventDate) {
      toast.error("Event date is required");
      return;
    }
    let custom: Record<string, unknown> | undefined;
    if (form.customFields.trim()) {
      try {
        const parsed: unknown = JSON.parse(form.customFields);
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("must be a JSON object");
        }
        custom = parsed as Record<string, unknown>;
      } catch {
        toast.error("Custom fields must be a valid JSON object");
        return;
      }
    }
    const payload: AdminEventInput = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      venue: form.venue.trim() || undefined,
      eventDate: toBackendDateTime(form.eventDate),
      coverImageUrl: form.coverImageUrl.trim() || undefined,
      status: form.status,
      maxAttendees: form.maxAttendees ? Number(form.maxAttendees) : undefined,
      customFields: custom,
    };
    if (!editing && form.slug.trim()) payload.slug = form.slug.trim().toLowerCase();
    setSaving(true);
    try {
      if (editing) {
        await updateAdminEvent(editing.id, payload);
        toast.success("Event updated");
      } else {
        await createAdminEvent(payload);
        toast.success("Event created — publish it to show on public pages");
      }
      setEditing(null);
      setCreating(false);
      fetchEvents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this event? Public pages will no longer show it.")) return;
    setDeletingId(id);
    try {
      await deleteAdminEvent(id);
      toast.success("Event deleted");
      fetchEvents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete event");
    } finally {
      setDeletingId(null);
    }
  }

  const showModal = creating || editing !== null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Events</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Create event cards for the public Events page. Only PUBLISHED events are visible publicly.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
        >
          + New Event
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm text-zinc-500">
          Loading events...
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-12 text-center">
          <p className="text-sm text-zinc-500">No events yet.</p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Create your first event
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Title</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Date</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Venue</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Seats</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900">{ev.title}</p>
                    <p className="font-mono text-xs text-zinc-400">{ev.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {new Date(ev.date).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{ev.location ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        ev.category === "upcoming"
                          ? "bg-green-100 text-green-800"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {ev.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{ev.maxAttendees ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(ev)}
                        className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(ev.id)}
                        disabled={deletingId === ev.id}
                        className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {deletingId === ev.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-zinc-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900">
                {editing ? `Edit Event #${editing.id}` : "New Event"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setCreating(false);
                }}
                className="text-zinc-400 hover:text-zinc-700"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <title>Close</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="ev-title" className={labelCls}>Title *</label>
                <input id="ev-title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="MSME IDEA HACKATHON 6.0" className={inputCls} />
              </div>
              <div>
                <label htmlFor="ev-slug" className={labelCls}>Slug (optional, auto if empty)</label>
                <input id="ev-slug" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="msme-hackathon-2026" className={inputCls} disabled={editing !== null} />
              </div>
              <div>
                <label htmlFor="ev-status" className={labelCls}>Status</label>
                <select id="ev-status" value={form.status} onChange={(e) => set("status", e.target.value as typeof form.status)} className={inputCls}>
                  <option value="DRAFT">Draft (hidden publicly)</option>
                  <option value="PUBLISHED">Published (visible publicly)</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="ev-desc" className={labelCls}>Description</label>
                <textarea id="ev-desc" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="ev-venue" className={labelCls}>Venue</label>
                <input id="ev-venue" value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Main Auditorium" className={inputCls} />
              </div>
              <div>
                <label htmlFor="ev-date" className={labelCls}>Event date & time *</label>
                <input id="ev-date" type="datetime-local" value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)} className={inputCls} />
              </div>
              <div>
                <label htmlFor="ev-image" className={labelCls}>Cover image URL</label>
                <input id="ev-image" value={form.coverImageUrl} onChange={(e) => set("coverImageUrl", e.target.value)} placeholder="https://..." className={inputCls} />
              </div>
              <div>
                <label htmlFor="ev-seats" className={labelCls}>Max attendees</label>
                <input id="ev-seats" type="number" min={1} value={form.maxAttendees} onChange={(e) => set("maxAttendees", e.target.value)} placeholder="200" className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="ev-custom" className={labelCls}>Dynamic fields (JSON object, optional)</label>
                <textarea
                  id="ev-custom"
                  rows={3}
                  value={form.customFields}
                  onChange={(e) => set("customFields", e.target.value)}
                  placeholder={'{\n  "chiefGuest": "Dr. A. Kumar",\n  "registrationLink": "https://..."\n}'}
                  className={`${inputCls} font-mono`}
                />
                <p className="mt-1 text-xs text-zinc-400">Extra card details stored in the events table and shown on the public page.</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setCreating(false);
                }}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {saving ? "Saving..." : editing ? "Save changes" : "Create event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
