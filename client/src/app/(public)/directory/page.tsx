"use client";

import { useCallback, useEffect, useState } from "react";
import { env } from "@/config/env";
import { toast } from "sonner";

interface Alumni {
  id: number;
  name: string;
  registerNumber: string;
  department: string;
  batch: string;
}

const API = env.api.baseUrl;

export default function DirectoryPage() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("");
  const [batch, setBatch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // request modals
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // update form
  const [updateFields, setUpdateFields] = useState({ name: "", currentEmail: "", email: "", department: "", batch: "" });

  // add form
  const [addFields, setAddFields] = useState({
    registerNumber: "", name: "", email: "", department: "", batch: "", yearOfPassing: "", phone: "",
  });

  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: "20" });
      if (query) params.set("query", query);
      if (department) params.set("department", department);
      if (batch) params.set("batch", batch);
      const res = await fetch(`${API}/search?${params}`);
      const data = await res.json();
      setAlumni(data.content ?? []);
      setTotalPages(data.totalPages ?? 0);
      setTotalCount(data.totalElements ?? 0);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [page, query, department, batch]);

  useEffect(() => { fetchAlumni(); }, [fetchAlumni]);

  function openUpdateModal(person: Alumni) {
    setSelectedAlumni(person);
    setUpdateFields({ name: person.name, currentEmail: "", email: "", department: person.department, batch: person.batch });
    setShowUpdateModal(true);
  }

  async function submitUpdateRequest() {
    if (!selectedAlumni) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/request/email-correction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registerNumber: selectedAlumni.registerNumber,
          currentEmail: updateFields.currentEmail,
          newEmail: updateFields.email,
          reason: "Alumni self-update request via directory",
        }),
      });
      if (res.ok) { toast.success("Update request submitted to admin"); setShowUpdateModal(false); }
      else { toast.error("Failed to submit request"); }
    } catch { toast.error("Failed to submit request"); } finally { setSubmitting(false); }
  }

  async function submitAddRequest() {
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/request/new-alumni`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addFields),
      });
      if (res.ok) { toast.success("Add request submitted to admin"); setShowAddModal(false); setAddFields({ registerNumber: "", name: "", email: "", department: "", batch: "", yearOfPassing: "", phone: "" }); }
      else { toast.error("Failed to submit request"); }
    } catch { toast.error("Failed to submit request"); } finally { setSubmitting(false); }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900">Alumni Directory</h1>
      <p className="mt-4 text-lg text-zinc-600">
        Browse and search for alumni by name, batch, or department.
      </p>

      {/* Search filters */}
      <div className="mt-8 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-zinc-600">Search</label>
          <input type="text" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Search by name..." className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600">Department</label>
          <select value={department} onChange={(e) => { setDepartment(e.target.value); setPage(0); }} className="mt-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700">
            <option value="">All</option>
            <option value="CSE">CSE</option><option value="ECE">ECE</option><option value="EEE">EEE</option>
            <option value="MECH">Mechanical</option><option value="CIVIL">Civil</option><option value="IT">IT</option>
            <option value="AERO">Aeronautical</option><option value="AI">AI & Data Science</option><option value="CSE-CS">CSE (Cyber Security)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-600">Batch</label>
          <input type="text" value={batch} onChange={(e) => { setBatch(e.target.value); setPage(0); }} placeholder="e.g. 2020" className="mt-1 w-28 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAddModal(true)} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">+ Add Alumni</button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="mt-6 flex min-h-[200px] items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm text-zinc-500">Searching...</div>
      ) : (
        <>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-zinc-600">{totalCount.toLocaleString()} alumni found</p>
          </div>
          {alumni.length === 0 ? (
            <div className="mt-4 flex flex-col items-center min-h-[200px] justify-center rounded-lg border border-zinc-200 bg-white text-center">
              <p className="text-sm text-zinc-500">No alumni found with the current search.</p>
              <p className="mt-1 text-xs text-zinc-400">If you are an alumnus and your record is missing, submit a request to add yourself.</p>
              <button onClick={() => setShowAddModal(true)} className="mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">Request to Add Alumni</button>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {alumni.map((person) => (
                <div key={person.id} className="rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 hover:shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-lg font-bold text-zinc-600">
                      {(person.name ?? "?")[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-zinc-900">{person.name}</h3>
                      {person.department && <p className="mt-0.5 text-sm text-zinc-500">{person.department} &bull; Batch {person.batch}</p>}
                      <p className="mt-0.5 text-xs text-zinc-400">Reg: {person.registerNumber}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button onClick={() => openUpdateModal(person)} className="text-xs font-medium text-zinc-500 hover:text-zinc-900">Request Update</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <span className="text-sm text-zinc-500">Page {page + 1} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-50">Previous</button>
                <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Update Request Modal — Email Correction */}
      {showUpdateModal && selectedAlumni && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-zinc-900">Request Email Update</h2>
            <p className="mt-1 text-sm text-zinc-500">For: {selectedAlumni.name} ({selectedAlumni.registerNumber})</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600">Current Email</label>
                <input value={updateFields.currentEmail} onChange={(e) => setUpdateFields((p) => ({ ...p, currentEmail: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder="Enter the email currently on your record" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600">New Email</label>
                <input value={updateFields.email} onChange={(e) => setUpdateFields((p) => ({ ...p, email: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder="Enter your corrected email" />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowUpdateModal(false)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50">Cancel</button>
              <button onClick={submitUpdateRequest} disabled={submitting} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">{submitting ? "Submitting..." : "Submit Request"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Alumni Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-zinc-900">Request to Add Alumni</h2>
            <p className="mt-1 text-sm text-zinc-500">Submit a request to add your record to the alumni directory. An admin will review and approve.</p>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Register Number *</label>
                  <input value={addFields.registerNumber} onChange={(e) => setAddFields((p) => ({ ...p, registerNumber: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder="Your reg number" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Full Name *</label>
                  <input value={addFields.name} onChange={(e) => setAddFields((p) => ({ ...p, name: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Email *</label>
                  <input value={addFields.email} onChange={(e) => setAddFields((p) => ({ ...p, email: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" type="email" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Phone</label>
                  <input value={addFields.phone} onChange={(e) => setAddFields((p) => ({ ...p, phone: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Department *</label>
                  <input value={addFields.department} onChange={(e) => setAddFields((p) => ({ ...p, department: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Batch *</label>
                  <input value={addFields.batch} onChange={(e) => setAddFields((p) => ({ ...p, batch: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Year of Passing</label>
                  <input value={addFields.yearOfPassing} onChange={(e) => setAddFields((p) => ({ ...p, yearOfPassing: e.target.value }))} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowAddModal(false)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50">Cancel</button>
              <button onClick={submitAddRequest} disabled={submitting} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">{submitting ? "Submitting..." : "Submit Request"}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}