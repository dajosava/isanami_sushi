/** Supabase a veces tipa joins many-to-one como array; normaliza a un objeto. */
export function one<T>(rel: T | T[] | null | undefined): T | null {
  if (rel == null) return null;
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}
