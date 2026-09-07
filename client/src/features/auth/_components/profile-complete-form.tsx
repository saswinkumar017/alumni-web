"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { env } from "@/config/env";
import { profileCompleteSchema, type ProfileCompleteInput } from "../_validation/auth-schemas";

const inputCls =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm";

export function ProfileCompleteForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileCompleteInput>({
    resolver: zodResolver(profileCompleteSchema),
    defaultValues: {
      company: "",
      designation: "",
      phone: "",
      address: "",
      profession: "",
      availability: "AVAILABLE",
    },
  });

  async function onSubmit(data: ProfileCompleteInput) {
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }
      const res = await fetch(`${env.api.baseUrl}/profile/complete`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? body?.message ?? "Failed to save profile");
      }
      toast.success("Profile completed");
      window.location.assign("/alumni/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save profile";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">One last step</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Tell us about your current work so alumni can find and connect with you.
        Your email is verified — these two fields are the only required ones.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <label htmlFor="pc-company" className="block text-sm font-medium text-zinc-700">
            Current working company <span className="text-red-600">*</span>
          </label>
          <input
            id="pc-company"
            type="text"
            autoComplete="organization"
            placeholder="e.g. Infosys"
            className={inputCls}
            {...register("company")}
          />
          {errors.company && (
            <p className="mt-1 text-xs text-red-600">{errors.company.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="pc-designation" className="block text-sm font-medium text-zinc-700">
            Designation <span className="text-red-600">*</span>
          </label>
          <input
            id="pc-designation"
            type="text"
            autoComplete="organization-title"
            placeholder="e.g. Software Engineer"
            className={inputCls}
            {...register("designation")}
          />
          {errors.designation && (
            <p className="mt-1 text-xs text-red-600">{errors.designation.message}</p>
          )}
        </div>

        <details className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
          <summary className="cursor-pointer text-xs font-medium text-zinc-600">
            Add optional details (recommended)
          </summary>
          <div className="mt-3 space-y-3">
            <div>
              <label htmlFor="pc-phone" className="block text-sm font-medium text-zinc-700">Phone</label>
              <input id="pc-phone" type="tel" placeholder="98765 43210" className={inputCls} {...register("phone")} />
            </div>
            <div>
              <label htmlFor="pc-address" className="block text-sm font-medium text-zinc-700">Address</label>
              <input id="pc-address" type="text" placeholder="City, State" className={inputCls} {...register("address")} />
            </div>
            <div>
              <label htmlFor="pc-profession" className="block text-sm font-medium text-zinc-700">Profession</label>
              <input id="pc-profession" type="text" placeholder="e.g. Software Engineer" className={inputCls} {...register("profession")} />
            </div>
            <div>
              <label htmlFor="pc-availability" className="block text-sm font-medium text-zinc-700">Availability</label>
              <select id="pc-availability" className={inputCls} {...register("availability")}>
                <option value="AVAILABLE">Available</option>
                <option value="BUSY">Busy</option>
                <option value="UNAVAILABLE">Unavailable</option>
              </select>
            </div>
          </div>
        </details>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Complete profile"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-zinc-600">
        <Link href="/" className="font-medium text-zinc-900 hover:underline">
          Skip for now
        </Link>
      </div>
    </div>
  );
}
