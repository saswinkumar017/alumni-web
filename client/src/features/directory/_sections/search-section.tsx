"use client";

// Section: SearchSection
// Rendering: Client
// Data: Props-only (receives callbacks from Feature)
// Interaction: Reactive (search/filter input)

import SearchForm from "@/components/ui/search-form";

export interface SearchSectionProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export function SearchSection({
  placeholder = "Search by name, batch, or department...",
  onSearch,
}: SearchSectionProps) {
  return (
    <section aria-label="Search alumni" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SearchForm id="directory-search" placeholder={placeholder} onSearch={onSearch} />
    </section>
  );
}
