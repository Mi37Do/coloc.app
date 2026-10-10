// Butter arc on a black-outlined ring with a big percentage, as in "Household progress".
export function ProgressRing({ percent, size = 168, label }: { percent: number; size?: number; label: string }) {
  const stroke = size * 0.1
  const r = (size - stroke) / 2 - 3
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, percent))

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        {/* outer and inner hairlines */}
        <circle cx={size / 2} cy={size / 2} r={r + stroke / 2} fill="none" stroke="#0B0B0B" strokeWidth="2" />
        <circle cx={size / 2} cy={size / 2} r={r - stroke / 2} fill="#FFFFFF" stroke="#0B0B0B" strokeWidth="2" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#FAECAA"
          strokeWidth={stroke - 2}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped / 100)}
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}
        />
      </svg>
      <span className="absolute text-3xl font-extrabold tabular-nums">{clamped}%</span>
    </div>
  )
}
