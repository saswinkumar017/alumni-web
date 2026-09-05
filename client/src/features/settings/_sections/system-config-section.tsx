"use client";

// Section: SystemConfigSection
// Rendering: Client
// Data: Props-only (receives config and callbacks from Feature)
// Interaction: Active (form inputs)

import type { FormEvent } from "react";

export interface SystemConfig {
  siteName?: string;
  supportEmail?: string;
}

export interface SystemConfigSectionProps {
  config?: SystemConfig;
  onSubmit?: (config: SystemConfig) => void;
}

const SECTION_TITLE = "System Configuration";

export function SystemConfigSection({ config, onSubmit }: SystemConfigSectionProps) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    onSubmit?.({
      siteName: form.get("siteName") as string,
      supportEmail: form.get("supportEmail") as string,
    });
  }

  return (
    <section aria-labelledby="system-config-heading">
      <h2
        id="system-config-heading"
        className="text-lg font-semibold text-zinc-900"
      >
        {SECTION_TITLE}
      </h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="siteName"
            className="block text-sm font-medium text-zinc-700"
          >
            Site Name
          </label>
          <input
            id="siteName"
            name="siteName"
            type="text"
            defaultValue={config?.siteName ?? ""}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="supportEmail"
            className="block text-sm font-medium text-zinc-700"
          >
            Support Email
          </label>
          <input
            id="supportEmail"
            name="supportEmail"
            type="email"
            defaultValue={config?.supportEmail ?? ""}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800:bg-zinc-200"
        >
          Save Config
        </button>
      </form>
    </section>
  );
}
