"use client";

// Section: EmploymentSection
// Rendering: Client
// Data: Props-only (receives entries and callbacks from Feature)
// Interaction: Active (form inputs)

import type { FormEvent } from "react";
import Button from "@/components/ui/button";
import SectionHeader from "@/components/ui/section-header";
import TextInput from "@/components/ui/text-input";
import EmploymentEntryItem from "../_components/employment-entry-item";

export interface EmploymentEntry {
  company: string;
  role: string;
  period: string;
}

export interface EmploymentSectionProps {
  entries?: EmploymentEntry[];
  onSubmit?: (entry: EmploymentEntry) => void;
}

const SECTION_TITLE = "Employment";

export function EmploymentSection({ entries, onSubmit }: EmploymentSectionProps) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    onSubmit?.({
      company: form.get("company") as string,
      role: form.get("role") as string,
      period: form.get("period") as string,
    });
  }

  return (
    <section aria-labelledby="employment-heading" className="mt-8">
      <SectionHeader title={SECTION_TITLE} id="employment-heading" />
      {entries && entries.length > 0 && (
        <ul className="mt-4 space-y-3">
          {entries.map((entry, i) => (
            <EmploymentEntryItem
              key={i}
              company={entry.company}
              role={entry.role}
              period={entry.period}
            />
          ))}
        </ul>
      )}
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <TextInput id="company" name="company" label="Company" />
        <TextInput id="role" name="role" label="Role" />
        <TextInput id="period" name="period" label="Period" placeholder="e.g. 2018 - Present" />
        <Button type="submit">Add Employment</Button>
      </form>
    </section>
  );
}
