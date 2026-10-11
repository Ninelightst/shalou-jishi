import { formatDuration } from '../utils/time'

export interface Slice {
  name: string
  color: string
  value: number
}

export function DonutChart({ slices, total, size = 180 }: { slices: Slice[]; total: number; size?: number }) {
  const R = 42
  const C = 2 * Math.PI * R
  const strokeW = 14
  let acc = 0
  return (
    <div className="donut-wrap" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={R} fill="none" stroke="var(--border)" strokeWidth={strokeW} />
        {total > 0 &&
          slices.map((s) => {
            const frac = s.value / total
            const el = (
              <circle
                key={s.name}
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={strokeW}
                strokeDasharray={`${frac * C} ${C}`}
                strokeDashoffset={-acc * C}
                transform="rotate(-90 60 60)"
              />
            )
            acc += frac
            return el
          })}
      </svg>
      <div className="donut-center">
        <div className="donut-total">{formatDuration(total)}</div>
        <div className="donut-label">总时长</div>
      </div>
    </div>
  )
}
