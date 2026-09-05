"use client";

// Section: AccountSection
// Rendering: Client
// Data: Props-only (receives user and callbacks from Feature)
// Interaction: Active (form inputs)

import type { FormEvent } from "react";
import type { SessionUser } from "@/types";

export interface AccountSectionProps {
  user: SessionUser;
  onSubmit?: (data: { name: string; email: string }) => void;
}

const SECTION_TITLE = "Account";

export function AccountSection({ user, onSubmit }: AccountSectionProps) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    onSubmit?.({
      name: form.get("name") as string,
      email: form.get("email") as string,
    });
  }

  return (
    <section aria-labelledby="account-heading">
      <h2 id="account-heading" className="text-lg font-semibold text-zinc-900">
        {SECTION_TITLE}
      </h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="account-name"
            className="block text-sm font-medium text-zinc-700"
          >
            Name
          </label>
          <input
            id="account-name"
            name="name"
            type="text"
            defaultValue={user.name ?? ""}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="account-email"
            className="block text-sm font-medium text-zinc-700"
          >
            Email
          </label>
          <input
            id="account-email"
            name="email"
            type="email"
            defaultValue={user.email ?? ""}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800:bg-zinc-200"
        >
          Save
        </button>
      </form>
    </section>
  );
}
