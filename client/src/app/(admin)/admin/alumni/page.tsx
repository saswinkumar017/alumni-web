"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getAdminAlumni } from "@/features/admin/_services/admin-service";

export default function AlumniPage() {
  const [alumni, setAlumni] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminAlumni(query || undefined, page);
      setAlumni(data.content ?? []);
      setTotalPages(data.totalPages ?? 0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load alumni records");
    } finally { setLoading(false); }
  }, [page, query]);

  useEffect(() => { fetchAlumni(); }, [fetchAlumni]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Alumni Directory</h1>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="alumni-search" className="block text-xs font-medium text-zinc-600">Search</label>
          <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Search by name, department, batch..." id="alumni-search" className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm" />
        </div>
      </div>
      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm text-zinc-500">Loading alumni...</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Reg No</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Department</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Batch</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600">Email</th>
              </tr>
            </thead>
            <tbody>
              {alumni.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">No alumni found.</td></tr>
              ) : alumni.map((a: any) => (
                <tr key={a.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{a.registerNumber}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{a.name}</td>
                  <td className="px-4 py-3 text-zinc-600">{a.department}</td>
                  <td className="px-4 py-3 text-zinc-600">{a.batch}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{a.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3">
              <span className="text-sm text-zinc-500">Page {page + 1} of {totalPages}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="rounded border border-zinc-300 px-3 py-1 text-xs text-zinc-600 disabled:opacity-50">Prev</button>
                <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="rounded border border-zinc-300 px-3 py-1 text-xs text-zinc-600 disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


