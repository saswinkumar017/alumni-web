"use client";

// Section: SocialLinksSection
// Rendering: Client
// Data: Props-only (receives links and callbacks from Feature)
// Interaction: Active (form inputs)

import type { FormEvent } from "react";
import Button from "@/components/ui/button";
import SectionHeader from "@/components/ui/section-header";
import TextInput from "@/components/ui/text-input";

export interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  website?: string;
}

export interface SocialLinksSectionProps {
  initialData?: SocialLinks;
  onSubmit?: (data: SocialLinks) => void;
}

const SECTION_TITLE = "Social Links";

export function SocialLinksSection({ initialData, onSubmit }: SocialLinksSectionProps) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    onSubmit?.({
      linkedin: form.get("linkedin") as string,
      twitter: form.get("twitter") as string,
      website: form.get("website") as string,
    });
  }

  return (
    <section aria-labelledby="social-links-heading" className="mt-8">
      <SectionHeader title={SECTION_TITLE} id="social-links-heading" />
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <TextInput
          id="linkedin"
          name="linkedin"
          label="LinkedIn"
          type="url"
          defaultValue={initialData?.linkedin ?? ""}
        />
        <TextInput
          id="twitter"
          name="twitter"
          label="Twitter"
          type="url"
          defaultValue={initialData?.twitter ?? ""}
        />
        <TextInput
          id="website"
          name="website"
          label="Website"
          type="url"
          defaultValue={initialData?.website ?? ""}
        />
        <Button type="submit">Save Links</Button>
      </form>
    </section>
  );
}
