import { db } from '../db'
import type { DailyReport, ScheduleEvent, TimerSession } from '../types'
import { addDaysStr, todayStr } from './date'

export interface DayStats {
  totalByCategory: Record<string, number>
  totalSeconds: number
  completedSessions: number
  stoppedSessions: number
  eventCount: number
  events: ScheduleEvent[]
  sessions: TimerSession[]
}

// 纯函数：聚合当日事件时长 + 计时会话时长
export function computeStats(events: ScheduleEvent[], sessions: TimerSession[]): DayStats {
  const totalByCategory: Record<string, number> = {}
  for (const e of events) {
    totalByCategory[e.categoryId] = (totalByCategory[e.categoryId] ?? 0) + (e.endMin - e.startMin) * 60
  }
  for (const s of sessions) {
    totalByCategory[s.categoryId] = (totalByCategory[s.categoryId] ?? 0) + s.actualSeconds
  }
  const totalSeconds = Object.values(totalByCategory).reduce((a, b) => a + b, 0)
  return {
    totalByCategory,
    totalSeconds,
    completedSessions: sessions.filter((s) => s.completed).length,
    stoppedSessions: sessions.filter((s) => !s.completed).length,
    eventCount: events.length,
    events,
    sessions,
  }
}

async function computeDayStats(dateStr: string): Promise<DayStats> {
  const [events, sessions] = await Promise.all([
    db.events.where('date').equals(dateStr).toArray(),
    db.sessions.where('date').equals(dateStr).toArray(),
  ])
  return computeStats(events, sessions)
}

export async function generateReportForDate(dateStr: string, auto: boolean): Promise<void> {
  const stats = await computeDayStats(dateStr)
  const report: DailyReport = {
    date: dateStr,
    totalByCategory: stats.totalByCategory,
    totalSeconds: stats.totalSeconds,
    completedSessions: stats.completedSessions,
    stoppedSessions: stats.stoppedSessions,
    eventCount: stats.eventCount,
    eventIds: stats.events.map((e) => e.id as number),
    sessionIds: stats.sessions.map((s) => s.id as number),
    generatedAt: Date.now(),
    auto,
  }
  await db.reports.put(report)
}

async function dateHasData(dateStr: string): Promise<boolean> {
  const [evCount, seCount] = await Promise.all([
    db.events.where('date').equals(dateStr).count(),
    db.sessions.where('date').equals(dateStr).count(),
  ])
  return evCount + seCount > 0
}

// 日期翻转检测：为「最后一个报告之后到昨天」之间有数据的日期补生成报告快照
// 今日报告始终实时计算，不落快照
export async function generateMissingReports(): Promise<number> {
  const t = todayStr()
  const lastReport = await db.reports.orderBy('date').last()
  let start: string | null
  if (lastReport) {
    start = addDaysStr(lastReport.date, 1)
  } else {
    const firstEvent = await db.events.orderBy('date').first()
    const firstSession = await db.sessions.orderBy('date').first()
    const dates = [firstEvent?.date, firstSession?.date].filter(Boolean).sort() as string[]
    start = dates[0] ?? null
  }
  const end = addDaysStr(t, -1) // 昨天
  if (!start || start > end) return 0
  let count = 0
  let d = start
  while (d <= end) {
    if (await dateHasData(d)) {
      await generateReportForDate(d, true)
      count++
    }
    d = addDaysStr(d, 1)
  }
  return count
}
