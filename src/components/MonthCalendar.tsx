import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { parseDateStr, toDateStr, todayStr } from '../utils/date'
import { ChevronLeftIcon, ChevronRightIcon } from './Icons'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

export function MonthCalendar({
  selected,
  onSelect,
}: {
  selected: string
  onSelect: (dateStr: string) => void
}) {
  const sel = parseDateStr(selected)
  const [ym, setYm] = useState({ y: sel.getFullYear(), m: sel.getMonth() })

  // 选中日期变化时同步显示的月份
  useEffect(() => {
    const d = parseDateStr(selected)
    setYm({ y: d.getFullYear(), m: d.getMonth() })
  }, [selected])

  const monthStart = `${ym.y}-${String(ym.m + 1).padStart(2, '0')}-01`
  const next = new Date(ym.y, ym.m + 1, 1)
  const monthEnd = toDateStr(next) // 不含
  const events = useLiveQuery(
    () => db.events.where('date').between(monthStart, monthEnd, true, false).toArray(),
    [monthStart, monthEnd],
  )
  const hasSet = useMemo(() => new Set((events ?? []).map((e) => e.date)), [events])

  const offset = (new Date(ym.y, ym.m, 1).getDay() + 6) % 7 // 周一起始
  const days = new Date(ym.y, ym.m + 1, 0).getDate()
  const t = todayStr()

  const cells: (string | null)[] = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= days; d++) {
    cells.push(`${ym.y}-${String(ym.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }

  return (
    <div className="cal">
      <div className="cal-head">
        <button type="button" className="icon-btn" onClick={() => setYm((p) => ({ y: p.m === 0 ? p.y - 1 : p.y, m: p.m === 0 ? 11 : p.m - 1 }))} aria-label="上个月">
          <ChevronLeftIcon />
        </button>
        <span className="cal-title">
          {ym.y}年{ym.m + 1}月
        </span>
        <button type="button" className="icon-btn" onClick={() => setYm((p) => ({ y: p.m === 11 ? p.y + 1 : p.y, m: p.m === 11 ? 0 : p.m + 1 }))} aria-label="下个月">
          <ChevronRightIcon />
        </button>
      </div>
      <div className="cal-grid">
        {WEEKDAYS.map((w) => (
          <div key={w} className="cal-wd">
            {w}
          </div>
        ))}
        {cells.map((d, i) =>
          d === null ? (
            <div key={`x${i}`} />
          ) : (
            <button
              key={d}
              type="button"
              className={`cal-cell ${d === selected ? 'sel' : ''} ${d === t ? 'today' : ''}`}
              onClick={() => onSelect(d)}
            >
              {Number(d.slice(-2))}
              {hasSet.has(d) && <span className="cal-dot" />}
            </button>
          ),
        )}
      </div>
    </div>
  )
}
