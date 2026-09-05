/**
 * SearchForm renders a search input with submit button.
 *
 * @stable Used by 2 features (directory, networking).
 * Client Component; emits search query via onSearch callback.
 * @example
 * ```tsx
 * <SearchForm id="alumni-search" onSearch={(q) => handleSearch(q)} />
 * ```
 */

import type { FormEvent } from "react";
import Button from "./button";
import TextInput from "./text-input";

export interface SearchFormProps {
  id: string;
  placeholder?: string;
  buttonLabel?: string;
  onSearch?: (query: string) => void;
}

export default function SearchForm({
  id,
  placeholder = "Search...",
  buttonLabel = "Search",
  onSearch,
}: SearchFormProps) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const query = data.get(id) as string;
    onSearch?.(query);
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="flex gap-3">
      <TextInput
        id={id}
        name={id}
        type="search"
        placeholder={placeholder}
        srOnlyLabel="Search"
        className="mt-0"
      />
      <Button type="submit" size="md">
        {buttonLabel}
      </Button>
    </form>
  );
}
