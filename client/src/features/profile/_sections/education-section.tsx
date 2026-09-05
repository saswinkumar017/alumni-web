"use client";

// Section: EducationSection
// Rendering: Client
// Data: Props-only (receives entries and callbacks from Feature)
// Interaction: Active (form inputs)

import type { FormEvent } from "react";
import Button from "@/components/ui/button";
import SectionHeader from "@/components/ui/section-header";
import TextInput from "@/components/ui/text-input";
import EducationEntryItem from "../_components/education-entry-item";

export interface EducationEntry {
  institution: string;
  degree: string;
  year: string;
}

export interface EducationSectionProps {
  entries?: EducationEntry[];
  onSubmit?: (entry: EducationEntry) => void;
}

const SECTION_TITLE = "Education";

export function EducationSection({ entries, onSubmit }: EducationSectionProps) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    onSubmit?.({
      institution: form.get("institution") as string,
      degree: form.get("degree") as string,
      year: form.get("year") as string,
    });
  }

  return (
    <section aria-labelledby="education-heading" className="mt-8">
      <SectionHeader title={SECTION_TITLE} id="education-heading" />
      {entries && entries.length > 0 && (
        <ul className="mt-4 space-y-3">
          {entries.map((entry, i) => (
            <EducationEntryItem
              key={i}
              institution={entry.institution}
              degree={entry.degree}
              year={entry.year}
            />
          ))}
        </ul>
      )}
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <TextInput id="institution" name="institution" label="Institution" />
        <TextInput id="degree" name="degree" label="Degree" />
        <TextInput id="year" name="year" label="Year" />
        <Button type="submit">Add Education</Button>
      </form>
    </section>
  );
}
