import { formatDuration } from '../utils/time'

export interface BarRow {
  name: string
  color: string
  value: number
}

export function CategoryBar({ rows, total }: { rows: BarRow[]; total: number }) {
  return (
    <div className="bar-list">
      {rows.map((r) => (
        <div key={r.name} className="bar-row">
          <div className="bar-label">
            <span className="dot" style={{ background: r.color }} />
            <span>{r.name}</span>
            <span className="bar-time">{formatDuration(r.value)}</span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${total > 0 ? (r.value / total) * 100 : 0}%`, background: r.color }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
