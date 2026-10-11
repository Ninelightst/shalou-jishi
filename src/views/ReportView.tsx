import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useSettings } from '../SettingsContext'
import { CategoryBar } from '../components/CategoryBar'
import { DonutChart } from '../components/DonutChart'
import { ChevronLeftIcon, ChevronRightIcon } from '../components/Icons'
import { addDaysStr, dateLabel, minToHM, todayStr, weekdayCN } from '../utils/date'
import { formatDuration } from '../utils/time'
import { computeStats } from '../utils/reportGenerator'

export function ReportView() {
  const { settings } = useSettings()
  const [selectedDate, setSelectedDate] = useState(() => todayStr())
  const isToday = selectedDate === todayStr()

  const [events, sessions] =
    useLiveQuery(async () => {
      const evs = await db.events.where('date').equals(selectedDate).toArray()
      const ss = await db.sessions.where('date').equals(selectedDate).toArray()
      return [evs, ss] as const
    }, [selectedDate]) ?? [undefined, undefined]

  // 今日实时计算；历史日期优先读自动生成的快照（无快照则回退实时计算）
  const report = useLiveQuery(() => (isToday ? undefined : db.reports.get(selectedDate)), [selectedDate, isToday])

  const stats = useMemo(() => {
    if (!events || !sessions) return null
    if (report) {
      return {
        totalByCategory: report.totalByCategory,
        totalSeconds: report.totalSeconds,
        completedSessions: report.completedSessions,
        stoppedSessions: report.stoppedSessions,
        eventCount: report.eventCount,
      }
    }
    return computeStats(events, sessions)
  }, [events, sessions, report])

  const rows = useMemo(() => {
    if (!stats) return []
    const catMap = new Map((settings?.categories ?? []).map((c) => [c.id, c]))
    const merged: Record<string, { name: string; color: string; value: number }> = {}
    for (const [id, v] of Object.entries(stats.totalByCategory)) {
      const c = catMap.get(id)
      const key = c ? id : '__other__'
      merged[key] = merged[key] ?? { name: c?.name ?? '其他', color: c?.color ?? '#9A9DB0', value: 0 }
      merged[key].value += v
    }
    return Object.values(merged).sort((a, b) => b.value - a.value)
  }, [stats, settings])

  const catMap = new Map((settings?.categories ?? []).map((c) => [c.id, c]))
  const sortedEvents = useMemo(() => (events ?? []).slice().sort((a, b) => a.startMin - b.startMin), [events])
  const hasData = stats !== null && (stats.totalSeconds > 0 || stats.eventCount > 0)

  return (
    <div>
      <div className="page-head">
        <div className="page-title-row">
          <h1 className="page-title">
            {dateLabel(selectedDate)} · 周{weekdayCN(selectedDate)}
          </h1>
          <div className="date-nav">
            <button type="button" className="icon-btn" onClick={() => setSelectedDate((d) => addDaysStr(d, -1))} aria-label="前一天">
              <ChevronLeftIcon />
            </button>
            <input
              type="date"
              className="input date-input"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            />
            <button type="button" className="icon-btn" onClick={() => setSelectedDate((d) => addDaysStr(d, 1))} aria-label="后一天">
              <ChevronRightIcon />
            </button>
            {!isToday && (
              <button type="button" className="btn btn-sm" onClick={() => setSelectedDate(todayStr())}>
                今天
              </button>
            )}
          </div>
        </div>
        <span className={`tag ${isToday ? 'tag-live' : ''}`}>
          {isToday ? '实时统计 · 明日自动生成快照' : report ? '自动生成的每日报告' : '实时计算'}
        </span>
      </div>

      {stats === null ? (
        <div className="empty">加载中…</div>
      ) : (
        <>
          <div className="stat-cards">
            <div className="card stat-card">
              <div className="stat-value">{formatDuration(stats.totalSeconds)}</div>
              <div className="stat-label">总时长</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{stats.completedSessions}</div>
              <div className="stat-label">完成计时</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{stats.stoppedSessions}</div>
              <div className="stat-label">中止计时</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{stats.eventCount}</div>
              <div className="stat-label">日程安排</div>
            </div>
          </div>

          {hasData ? (
            <>
              <div className="card">
                <h3 className="card-title">分类分布</h3>
                <div className="rpt-flex">
                  <DonutChart
                    slices={rows.map((r) => ({ name: r.name, color: r.color, value: r.value }))}
                    total={stats.totalSeconds}
                  />
                  <div className="rpt-bars">
                    <CategoryBar rows={rows} total={stats.totalSeconds} />
                  </div>
                </div>
              </div>
              {sortedEvents.length > 0 && (
                <div className="card">
                  <h3 className="card-title">日程明细</h3>
                  <div className="rpt-list">
                    {sortedEvents.map((e) => (
                      <div key={e.id} className="rpt-item">
                        <span className="dot" style={{ background: catMap.get(e.categoryId)?.color ?? '#9A9DB0' }} />
                        <span className="rpt-item-time">
                          {minToHM(e.startMin)}–{minToHM(e.endMin)}
                        </span>
                        <span className="rpt-item-title">{e.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card">
              <div className="empty">这一天还没有时间记录</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
