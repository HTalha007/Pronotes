/**
 * Normalises text for local, case/diacritic-insensitive search.
 * "İstanbul" -> "istanbul", "Şirket" -> "sirket".
 */
export function normalizeForSearch(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/** True when the (already trimmed) query is empty or found in any field. */
export function matchesQuery(query: string, fields: readonly string[]): boolean {
  const needle = normalizeForSearch(query.trim());
  if (needle.length === 0) {
    return true;
  }
  return fields.some((field) => normalizeForSearch(field).includes(needle));
}
