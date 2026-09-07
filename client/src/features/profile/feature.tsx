"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { env } from "@/config/env";

const API = env.api.baseUrl;
const HEADERS = () => ({ Authorization: `Bearer ${localStorage.getItem("accessToken")}`, "Content-Type": "application/json" });

export function ProfileManager(_props: { user: unknown }) {
  const [profile, setProfile] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API}/profile`, { headers: HEADERS() });
      if (res.ok) { setProfile(await res.json()); setError(null); }
      else setError("Failed to load your profile");
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  async function handleSave(fields: Record<string, string>) {
    setSaving(true);
    try {
      const res = await fetch(`${API}/profile`, { method: "PUT", headers: HEADERS(), body: JSON.stringify(fields) });
      if (res.ok) { toast.success("Profile updated"); await fetchProfile(); }
      else toast.error("Failed to update profile");
    } catch { toast.error("Failed to update profile"); } finally { setSaving(false); }
  }

  if (loading) return <div className="flex min-h-[200px] items-center justify-center text-sm text-zinc-500">Loading profile...</div>;

  if (error) {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-sm font-medium text-red-800">{error}</p>
        <button type="button" onClick={fetchProfile} className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Profile</h1>
      <p className="mt-2 text-zinc-600">Manage your alumni profile information.</p>

      <div className="mt-8 space-y-8">
        {/* Basic Info */}
        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-bold text-zinc-900">Basic Information</h2>
          <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); handleSave(Object.fromEntries(f.entries()) as Record<string, string>); }} className="mt-4 space-y-4">
            <Field label="Phone" name="phone" defaultValue={profile?.phone} />
            <Field label="Address" name="address" defaultValue={profile?.address} />
            <button type="submit" disabled={saving} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
          </form>
        </section>

        {/* Education — admin-managed (read-only) */}
        <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900">Education</h2>
            <span className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
              Admin managed
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            These details are set when your record is created and can only be changed by an admin.
          </p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <ReadonlyField label="Degree" value={profile?.degree} />
            <ReadonlyField label="Department" value={profile?.department} />
            <ReadonlyField label="Batch" value={profile?.batch} />
            <ReadonlyField label="Year of Passing" value={profile?.yearOfPassing} />
          </dl>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-bold text-zinc-900">Employment</h2>
          <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); handleSave(Object.fromEntries(f.entries()) as Record<string, string>); }} className="mt-4 space-y-4">
            <Field label="Company" name="company" defaultValue={profile?.company} />
            <Field label="Designation" name="designation" defaultValue={profile?.designation} />
            <Field label="Profession" name="profession" defaultValue={profile?.profession} />
            <div>
              <label htmlFor="availability" className="block text-sm font-medium text-zinc-700">Availability</label>
              <select
                id="availability"
                name="availability"
                defaultValue={profile?.availability ?? "AVAILABLE"}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              >
                <option value="AVAILABLE">Available</option>
                <option value="BUSY">Busy</option>
                <option value="UNAVAILABLE">Unavailable</option>
              </select>
            </div>
            <button type="submit" disabled={saving} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function ReadonlyField({ label, value }: { label: string; value?: string | number }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-zinc-900">{value || "—"}</dd>
    </div>
  );
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-zinc-700">{label}</label>
      <input id={name} name={name} defaultValue={defaultValue ?? ""} className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500" />
    </div>
  );
}
