// 秒 → 中文时长
export function formatDuration(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h > 0) return m > 0 ? `${h}小时${m}分` : `${h}小时`
  if (m > 0) return `${m}分钟`
  return `${sec}秒`
}

// 秒 → 计时器显示 mm:ss / h:mm:ss
export function formatClock(totalSec: number): string {
  const sec = Math.max(0, Math.ceil(totalSec))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

// 秒 → 简短显示（预设按钮用）
export function formatPreset(totalSec: number): string {
  const m = Math.round(totalSec / 60)
  if (m >= 60 && m % 60 === 0) return `${m / 60}小时`
  if (m % 1 === 0) return `${m}分钟`
  return formatDuration(totalSec)
}
