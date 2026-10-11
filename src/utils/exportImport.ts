import { db } from '../db'
import type { DailyReport, ScheduleEvent, TimerSession } from '../types'

// 全量导出为 JSON 字符串
export async function exportAll(): Promise<string> {
  const [events, sessions, reports, settings] = await Promise.all([
    db.events.toArray(),
    db.sessions.toArray(),
    db.reports.toArray(),
    db.settings.toArray(),
  ])
  return JSON.stringify(
    {
      app: '沙漏记事',
      version: 1,
      exportedAt: new Date().toISOString(),
      events,
      sessions,
      reports,
      settings,
    },
    null,
    2,
  )
}

// 导入并覆盖当前全部数据
export async function importAll(json: string): Promise<{ events: number; sessions: number; reports: number }> {
  const data = JSON.parse(json) as {
    app?: string
    events?: ScheduleEvent[]
    sessions?: TimerSession[]
    reports?: DailyReport[]
    settings?: { key: string; value: unknown }[]
  }
  if (!data || data.app !== '沙漏记事') {
    throw new Error('不是有效的沙漏记事备份文件')
  }
  const events = data.events ?? []
  const sessions = data.sessions ?? []
  const reports = data.reports ?? []
  const settings = data.settings ?? []
  await db.transaction('rw', db.events, db.sessions, db.reports, db.settings, async () => {
    await Promise.all([db.events.clear(), db.sessions.clear(), db.reports.clear(), db.settings.clear()])
    await db.events.bulkAdd(events)
    await db.sessions.bulkAdd(sessions)
    await db.reports.bulkAdd(reports)
    await db.settings.bulkAdd(settings)
  })
  return { events: events.length, sessions: sessions.length, reports: reports.length }
}

export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
