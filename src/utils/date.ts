export function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayStr(): string {
  return toDateStr(new Date())
}

export function parseDateStr(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDaysStr(s: string, n: number): string {
  const d = parseDateStr(s)
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}

export function minToHM(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function hmToMin(hm: string): number {
  const [h, m] = hm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function weekdayCN(dateStr: string): string {
  const wd = parseDateStr(dateStr).getDay()
  return '日一二三四五六'[wd]
}

// 相对今天的中文标签：今天 / 明天 / 昨天 / M月D日
export function dateLabel(dateStr: string): string {
  const t = todayStr()
  if (dateStr === t) return '今天'
  if (dateStr === addDaysStr(t, 1)) return '明天'
  if (dateStr === addDaysStr(t, -1)) return '昨天'
  const d = parseDateStr(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 13) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}
