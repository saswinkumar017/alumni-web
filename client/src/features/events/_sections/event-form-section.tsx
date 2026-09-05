"use client";

// Section: EventFormSection
// Rendering: Client
// Data: Props-only (receives callbacks from Feature)
// Interaction: Active (form submission)

import type { FormEvent } from "react";
import Button from "@/components/ui/button";
import TextInput from "@/components/ui/text-input";
import Textarea from "@/components/ui/textarea";

export interface EventFormSectionProps {
  mode: "create" | "edit";
  initialData?: {
    title?: string;
    description?: string;
    date?: string;
    location?: string;
  };
  onSubmit?: (data: Record<string, FormDataEntryValue>) => void;
}

export function EventFormSection({ mode, initialData }: EventFormSectionProps) {
  const heading = mode === "create" ? "Create Event" : "Edit Event";
  const description =
    mode === "create" ? "Set up a new alumni event." : "Update the event details.";

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
  }

  return (
    <section aria-labelledby="event-form-heading">
      <h1 id="event-form-heading" className="text-2xl font-bold text-zinc-900">
        {heading}
      </h1>
      <p className="mt-2 text-zinc-600">{description}</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <TextInput id="title" name="title" label="Title" defaultValue={initialData?.title ?? ""} />
        <Textarea
          id="description"
          name="description"
          label="Description"
          rows={4}
          defaultValue={initialData?.description ?? ""}
        />
        <TextInput
          id="date"
          name="date"
          label="Date"
          type="date"
          defaultValue={initialData?.date ?? ""}
        />
        <TextInput
          id="location"
          name="location"
          label="Location"
          defaultValue={initialData?.location ?? ""}
        />
        <Button type="submit" size="lg">
          {mode === "create" ? "Create Event" : "Save Changes"}
        </Button>
      </form>
    </section>
  );
}
