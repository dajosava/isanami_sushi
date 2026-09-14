/** Divide un monto en N partes (centavos) sin perder ni inventar colones. */
export function dividirEnPartes(total: number, n: number): number[] {
  const personas = Math.max(1, Math.floor(n));
  const totalCents = Math.round(total * 100);
  const base = Math.floor(totalCents / personas);
  const parts = Array.from({ length: personas }, () => base);
  let rem = totalCents - base * personas;
  for (let i = 0; i < rem; i++) {
    parts[i] = (parts[i] ?? 0) + 1;
  }
  return parts.map((c) => c / 100);
}
