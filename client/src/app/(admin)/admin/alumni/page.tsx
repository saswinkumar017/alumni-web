"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getAdminAlumni, importAdminAlumni } from "@/features/admin/_services/admin-service";

export default function AlumniPage() {
  const [alumni, setAlumni] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [accountFilter, setAccountFilter] = useState<"" | "yes" | "no">("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminAlumni(query || undefined, page, {
        hasAccount: accountFilter === "" ? undefined : accountFilter === "yes",
      });
      setAlumni(data.content ?? []);
      setTotalPages(data.totalPages ?? 0);
      setTotalElements(data.totalElements ?? 0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load alumni records");
    } finally { setLoading(false); }
  }, [page, query, accountFilter]);

  useEffect(() => { fetchAlumni(); }, [fetchAlumni]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setImporting(true);
    try {
      const res = await importAdminAlumni(f);
      toast.success(`Imported: ${res.created} created, ${res.updated} updated, ${res.skipped} skipped (${res.totalRows} rows)`);
      if (res.errors?.length) { const first = res.errors[0]; if (first) toast.warning(`${res.errors.length} row errors (showing first: row ${first.row} – ${first.message})`); }
      fetchAlumni();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-[-24px] z-20 -mx-4 space-y-4 bg-zinc-100 px-4 pb-4 pt-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-zinc-900">Alumni Directory {totalElements ? <span className="text-sm font-normal text-zinc-500">({totalElements})</span> : null}</h1>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.json" className="hidden" onChange={handleFile} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={importing} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50">
              {importing ? "Importing..." : "Import CSV / Excel / JSON"}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-52">
            <label htmlFor="alumni-search" className="block text-xs font-medium text-zinc-600">Search (name, reg no, email, dept, company)</label>
            <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Search by name, department, batch..." id="alumni-search" className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="account-filter" className="block text-xs font-medium text-zinc-600">Portal account</label>
            <select id="account-filter" value={accountFilter} onChange={(e) => { setAccountFilter(e.target.value as any); setPage(0); }} className="mt-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm">
              <option value="">All</option>
              <option value="yes">Has account</option>
              <option value="no">No account</option>
            </select>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm text-zinc-500">Loading alumni...</div>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="sticky top-[126px] z-10 bg-zinc-50 px-4 py-3 text-left font-medium text-zinc-600 shadow-[0_1px_0_0_#e4e4e7]">Reg No</th>
                <th className="sticky top-[126px] z-10 bg-zinc-50 px-4 py-3 text-left font-medium text-zinc-600 shadow-[0_1px_0_0_#e4e4e7]">Name</th>
                <th className="sticky top-[126px] z-10 bg-zinc-50 px-4 py-3 text-left font-medium text-zinc-600 shadow-[0_1px_0_0_#e4e4e7]">Department</th>
                <th className="sticky top-[126px] z-10 bg-zinc-50 px-4 py-3 text-left font-medium text-zinc-600 shadow-[0_1px_0_0_#e4e4e7]">Batch</th>
                <th className="sticky top-[126px] z-10 bg-zinc-50 px-4 py-3 text-left font-medium text-zinc-600 shadow-[0_1px_0_0_#e4e4e7]">Email</th>
                <th className="sticky top-[126px] z-10 bg-zinc-50 px-4 py-3 text-left font-medium text-zinc-600 shadow-[0_1px_0_0_#e4e4e7]">Account</th>
              </tr>
            </thead>
            <tbody>
              {alumni.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">No alumni found.</td></tr>
              ) : alumni.map((a: any) => (
                <tr key={a.id} className="hover:bg-zinc-50">
                  <td className="border-b border-zinc-100 px-4 py-3 font-mono text-xs text-zinc-500">{a.registerNumber}</td>
                  <td className="border-b border-zinc-100 px-4 py-3 font-medium text-zinc-900">{a.name}</td>
                  <td className="border-b border-zinc-100 px-4 py-3 text-zinc-600">{a.department}</td>
                  <td className="border-b border-zinc-100 px-4 py-3 text-zinc-600">{a.batch}</td>
                  <td className="border-b border-zinc-100 px-4 py-3 text-xs text-zinc-500">{a.email}</td>
                  <td className="border-b border-zinc-100 px-4 py-3 text-xs">
                    {a.hasAccount ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700" title={a.username ?? ""}>
                        ● {a.emailVerified ? "Verified" : "Registered"}{a.accountStatus ? ` · ${a.accountStatus}` : ""}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-500">No account</span>
                    )}
                  </td>
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


