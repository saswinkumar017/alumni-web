export function validateSlug(slug: string): string | null {
  const trimmed = slug.trim();
  if (!trimmed || trimmed.length > 200 || /[<>"']/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export function validateId(id: string): string | null {
  const trimmed = id.trim();
  if (!trimmed || trimmed.length > 100 || /[<>"']/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export function validateSearchParams<T extends Record<string, string | undefined>>(params: T): T {
  return params;
}
