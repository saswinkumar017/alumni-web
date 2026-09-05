"use client";

import { useCallback, useEffect, useState } from "react";
import { env } from "@/config/env";
import { toast } from "sonner";

const API = env.api.baseUrl;
const TOKEN = () => localStorage.getItem("accessToken") ?? "";
const HEADERS = () => ({ Authorization: `Bearer ${TOKEN()}`, "Content-Type": "application/json" });

interface PendingRequest {
  requestId: number;
  requestType: string;
  status: string;
  submittedAt: string;
  requesterEmail: string;
  payload: string;
  alumni: {
    id: number;
    name: string;
    registerNumber: string;
    department: string;
    batch: string;
    email: string;
  } | null;
}

interface PageData {
  content: PendingRequest[];
  totalElements: number;
  totalPages: number;
  number: number;
}

type FilterStatus = "" | "PENDING" | "APPROVED" | "REJECTED";

export default function AdminRequestsPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selected, setSelected] = useState<PendingRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("type", typeFilter);
      const res = await fetch(`${API}/admin/requests?${params}`, { headers: HEADERS() });
      if (!res.ok) throw new Error("Failed to load");
      setData(await res.json());
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  async function handleApprove() {
    if (!selected) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/admin/request/${selected.requestId}/approve`, {
        method: "POST",
        headers: HEADERS(),
        body: JSON.stringify({ requestId: selected.requestId, decision: "APPROVED", adminNotes: adminNotes || null }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Request approved — email sent to user");
      setSelected(null);
      setAdminNotes("");
      fetchRequests();
    } catch {
      toast.error("Failed to approve request");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!selected) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/admin/request/${selected.requestId}/reject`, {
        method: "POST",
        headers: HEADERS(),
        body: JSON.stringify({ requestId: selected.requestId, decision: "REJECTED", adminNotes: adminNotes || null }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Request rejected — email sent to user");
      setSelected(null);
      setAdminNotes("");
      fetchRequests();
    } catch {
      toast.error("Failed to reject request");
    } finally {
      setActionLoading(false);
    }
  }

  function statusBadge(status: string) {
    const styles: Record<string, string> = {
      PENDING: "bg-amber-100 text-amber-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? "bg-zinc-100 text-zinc-800"}`}>
        {status}
      </span>
    );
  }

  function typeLabel(type: string) {
    const labels: Record<string, string> = {
      NEW_ALUMNI: "New Alumni",
      EMAIL_CORRECTION: "Email Correction",
    };
    return labels[type] ?? type;
  }

  function parsePayload(payload: string | null) {
    if (!payload) return null;
    try { return JSON.parse(payload); } catch { return null; }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Manage Requests</h1>
        <p className="mt-1 text-sm text-zinc-600">Review and approve/reject alumni registration and email correction requests.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as FilterStatus); setPage(0); }} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm">
          <option value="">All types</option>
          <option value="NEW_ALUMNI">New Alumni</option>
          <option value="EMAIL_CORRECTION">Email Correction</option>
        </select>
        <button onClick={() => fetchRequests()} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50">Refresh</button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center text-sm text-zinc-500">Loading requests...</div>
        ) : !data || data.content.length === 0 ? (
          <div className="flex min-h-[200px] items-center justify-center text-sm text-zinc-500">No requests found</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-600">ID</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Type</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Alumni</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Requester</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Submitted</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Status</th>
                <th className="px-4 py-3 font-medium text-zinc-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data.content.map((req) => (
                <tr key={req.requestId} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">#{req.requestId}</td>
                  <td className="px-4 py-3">{typeLabel(req.requestType)}</td>
                  <td className="px-4 py-3">
                    {req.alumni ? (
                      <div>
                        <p className="font-medium text-zinc-900">{req.alumni.name}</p>
                        <p className="text-xs text-zinc-500">{req.alumni.registerNumber}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{req.requesterEmail}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{new Date(req.submittedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{statusBadge(req.status)}</td>
                  <td className="px-4 py-3">
                    {req.status === "PENDING" ? (
                      <button onClick={() => { setSelected(req); setAdminNotes(""); }} className="rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800">
                        Review
                      </button>
                    ) : (
                      <button onClick={() => setSelected(req)} className="text-xs text-zinc-500 hover:text-zinc-900">View</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">
            Page {page + 1} of {data.totalPages} ({data.totalElements} total)
          </span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-50">Previous</button>
            <button onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))} disabled={page >= data.totalPages - 1} className="rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-50">Next</button>
          </div>
        </div>
      )}

      {/* Detail / Action Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900">Request #{selected.requestId}</h2>
              <button onClick={() => setSelected(null)} className="text-zinc-400 hover:text-zinc-700">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-zinc-500">Type:</span> <span className="ml-1 font-medium">{typeLabel(selected.requestType)}</span></div>
                <div><span className="text-zinc-500">Status:</span> <span className="ml-1">{statusBadge(selected.status)}</span></div>
                <div><span className="text-zinc-500">Submitted:</span> <span className="ml-1">{new Date(selected.submittedAt).toLocaleString()}</span></div>
                <div><span className="text-zinc-500">Requester:</span> <span className="ml-1">{selected.requesterEmail}</span></div>
              </div>

              {selected.alumni && (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                  <p className="font-medium text-zinc-900">{selected.alumni.name}</p>
                  <p className="text-xs text-zinc-500">Reg: {selected.alumni.registerNumber} | Dept: {selected.alumni.department} | Batch: {selected.alumni.batch}</p>
                  <p className="text-xs text-zinc-500">Email: {selected.alumni.email}</p>
                </div>
              )}

              {selected.payload && (() => {
                const p = parsePayload(selected.payload);
                if (!p) return null;
                return (
                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-xs font-medium text-zinc-600 mb-1">Request Details:</p>
                    <pre className="text-xs text-zinc-600 whitespace-pre-wrap">{JSON.stringify(p, null, 2)}</pre>
                  </div>
                );
              })()}

              {selected.status === "PENDING" && (
                <div>
                  <label className="block text-xs font-medium text-zinc-600">Admin Notes (optional)</label>
                  <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" placeholder="Add notes about your decision..." />
                </div>
              )}
            </div>

            {selected.status === "PENDING" && (
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setSelected(null)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50">Cancel</button>
                <button onClick={handleReject} disabled={actionLoading} className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">
                  {actionLoading ? "Processing..." : "Reject"}
                </button>
                <button onClick={handleApprove} disabled={actionLoading} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                  {actionLoading ? "Processing..." : "Approve"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
