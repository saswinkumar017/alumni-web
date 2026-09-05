"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getDonations, createDonation, getDonationStats } from "./_services/donation-service";
import type { Donation, DonationStats } from "@/types/domain/donation";

export function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [d, s] = await Promise.all([getDonations(), getDonationStats()]);
        setDonations(d);
        setStats(s);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load donations");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDonate = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!purpose.trim()) {
      toast.error("Please enter a purpose");
      return;
    }
    setSubmitting(true);
    try {
      await createDonation({ amount: numAmount, purpose: purpose.trim() });
      toast.success("Donation recorded!");
      setShowForm(false);
      setAmount("");
      setPurpose("");
      const [d, s] = await Promise.all([getDonations(), getDonationStats()]);
      setDonations(d);
      setStats(s);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to donate");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-zinc-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Donations</h1>
          <p className="mt-2 text-zinc-600">Track donations and contribute to alumni initiatives.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "Make a Donation"}
        </button>
      </div>

      {stats && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Total Donated</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">
              {(stats.totalAmount ?? 0).toLocaleString()} INR
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Total Donations</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">{stats.totalDonations}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Average Donation</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900">
              {stats.totalDonations > 0 ? ((stats.totalAmount ?? 0) / stats.totalDonations).toLocaleString() : "0"} INR
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Make a Donation</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700">Amount</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Purpose</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g., Scholarship fund, Infrastructure"
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleDonate}
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Processing..." : "Donate"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900">Donation History</h2>
        {donations.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-zinc-300 p-8 text-center">
            <p className="text-sm text-zinc-500">No donations yet.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Donor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Purpose</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {donations.map((d) => (
                  <tr key={d.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">{d.displayName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                      {d.amount.toLocaleString()} {d.currency}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600">{d.purpose}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        d.status === "completed"
                          ? "bg-green-50 text-green-700"
                          : d.status === "pending"
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-red-50 text-red-700"
                      }`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

