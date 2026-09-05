"use client";

// Section: SecuritySection
// Rendering: Client
// Data: Props-only (receives callbacks from Feature)
// Interaction: Active (password change form)

import type { FormEvent } from "react";

export interface SecuritySectionProps {
  onChangePassword?: (currentPassword: string, newPassword: string) => void;
}

const SECTION_TITLE = "Security";

export function SecuritySection({ onChangePassword }: SecuritySectionProps) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const currentPassword = form.get("currentPassword") as string;
    const newPassword = form.get("newPassword") as string;
    if (!currentPassword || !newPassword) return;
    onChangePassword?.(currentPassword, newPassword);
    e.currentTarget.reset();
  }

  return (
    <section aria-labelledby="security-heading" className="mt-8">
      <h2 id="security-heading" className="text-lg font-semibold text-zinc-900">
        {SECTION_TITLE}
      </h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="currentPassword"
            className="block text-sm font-medium text-zinc-700"
          >
            Current Password
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium text-zinc-700"
          >
            New Password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800:bg-zinc-200"
        >
          Update Password
        </button>
      </form>
    </section>
  );
}
