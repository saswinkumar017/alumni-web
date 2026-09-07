"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { env } from "@/config/env";

interface MyRequest {
  requestId: number;
  requestType: string;
  status: string;
  submittedAt: string;
  resolvedAt: string | null;
  adminNotes: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  NEW_ALUMNI: "New Alumni",
  EMAIL_CORRECTION: "Email Correction",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

export default function AlumniRequestsPage() {
  const [requests, setRequests] = useState<MyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMine = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${env.api.baseUrl}/request/mine`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to load your requests");
      setRequests(await res.json());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load your requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMine();
  }, [fetchMine]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">My Requests</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Track your email-correction and new-alumni requests and see admin responses.
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm text-zinc-500">
          Loading your requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-12 text-center">
          <p className="text-sm text-zinc-500">You have not submitted any requests yet.</p>
          <Link
            href="/directory"
            className="mt-3 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Browse Directory
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-left font-medium text-zinc-600">ID</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Type</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Submitted</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Resolved</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Admin Response</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.requestId} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">#{r.requestId}</td>
                  <td className="px-4 py-3">{TYPE_LABELS[r.requestType] ?? r.requestType}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status] ?? "bg-zinc-100 text-zinc-800"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {new Date(r.submittedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {r.resolvedAt ? new Date(r.resolvedAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-600">
                    {r.adminNotes ?? <span className="text-zinc-400">Awaiting review</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
