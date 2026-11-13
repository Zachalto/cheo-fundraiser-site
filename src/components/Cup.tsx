/** One upside-down red party cup, drawn in a 60×70 box. Use inside an <svg>. */
export function Cup({ x = 0, y = 0, className }: { x?: number; y?: number; className?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={className}>
        <path
          d="M15 4h30l10 58H5z"
          fill="var(--red)"
          stroke="var(--ink)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M13.5 20h33M12.5 26h35" stroke="var(--red-deep)" strokeWidth="2" />
        <path d="M20 9l-6 46" stroke="#fff" strokeOpacity=".35" strokeWidth="3" strokeLinecap="round" />
        <rect x="2" y="59" width="56" height="9" rx="4" fill="#fff" stroke="var(--ink)" strokeWidth="2.5" />
      </g>
    </g>
  );
}
