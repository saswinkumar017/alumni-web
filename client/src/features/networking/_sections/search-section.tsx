"use client";

// Section: SearchSection
// Rendering: Client
// Data: Props-only (receives callbacks from Feature)
// Interaction: Reactive (search input)

import SearchForm from "@/components/ui/search-form";

export interface SearchSectionProps {
  onSearch?: (query: string) => void;
}

export function SearchSection({ onSearch }: SearchSectionProps) {
  return (
    <section aria-label="Search alumni">
      <SearchForm
        id="networking-search"
        placeholder="Search by name, batch, or department..."
        onSearch={onSearch}
      />
    </section>
  );
}
