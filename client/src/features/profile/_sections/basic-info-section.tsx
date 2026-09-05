"use client";

// Section: BasicInfoSection
// Rendering: Client
// Data: Props-only (receives user and callbacks from Feature)
// Interaction: Active (form inputs)

import type { FormEvent } from "react";
import Button from "@/components/ui/button";
import SectionHeader from "@/components/ui/section-header";
import TextInput from "@/components/ui/text-input";

export interface BasicInfoFormData {
  name?: string;
  email?: string;
  phone?: string;
}

export interface BasicInfoSectionProps {
  initialData?: BasicInfoFormData;
  onSubmit?: (data: BasicInfoFormData) => void;
}

const SECTION_TITLE = "Basic Information";

export function BasicInfoSection({ initialData, onSubmit }: BasicInfoSectionProps) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    onSubmit?.({
      name: form.get("name") as string,
      email: form.get("email") as string,
      phone: form.get("phone") as string,
    });
  }

  return (
    <section aria-labelledby="basic-info-heading">
      <SectionHeader title={SECTION_TITLE} id="basic-info-heading" />
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <TextInput id="name" name="name" label="Full Name" defaultValue={initialData?.name ?? ""} />
        <TextInput
          id="email"
          name="email"
          label="Email"
          type="email"
          defaultValue={initialData?.email ?? ""}
        />
        <TextInput
          id="phone"
          name="phone"
          label="Phone"
          type="tel"
          defaultValue={initialData?.phone ?? ""}
        />
        <Button type="submit">Save</Button>
      </form>
    </section>
  );
}
