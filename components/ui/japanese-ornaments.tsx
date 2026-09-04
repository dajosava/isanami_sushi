export function SakuraBranch({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 64"
      className={className}
      aria-hidden
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 48 C48 44 72 28 110 30 C140 32 160 40 192 36"
        stroke="#8a743f"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M70 34 C78 22 92 16 104 20"
        stroke="#8a743f"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M130 32 C138 20 150 14 164 18"
        stroke="#8a743f"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {[
        [58, 40],
        [74, 24],
        [96, 18],
        [118, 28],
        [142, 18],
        [166, 22],
        [182, 32],
      ].map(([cx, cy], i) => (
        <g key={i} transform={`translate(${cx} ${cy})`}>
          <circle r="5" fill="#eec3cc" opacity="0.9" />
          <circle r="2.2" fill="#dc8fa0" opacity="0.85" cx="1" cy="-1" />
        </g>
      ))}
    </svg>
  );
}

const KANJI_MESA = ["壱", "弐", "参", "四", "五", "六", "七", "八", "九", "十"] as const;

export function kanjiMesa(numero: number): string {
  if (numero >= 1 && numero <= 10) return KANJI_MESA[numero - 1]!;
  if (numero > 10 && numero < 20) return `十${KANJI_MESA[numero - 11]!}`;
  return String(numero);
}
