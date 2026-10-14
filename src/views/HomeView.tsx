import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useSettings } from '../SettingsContext'
import { useTimerApi } from '../TimerContext'
import { useNow } from '../hooks/useNow'
import { HourglassLogo } from '../components/HourglassLogo'
import { CategoryBar } from '../components/CategoryBar'
import { ChartIcon, ChevronRightIcon, ClockIcon, GearIcon, TreeIcon } from '../components/Icons'
import { computeStats } from '../utils/reportGenerator'
import { dateLabel, greeting, todayStr, weekdayCN } from '../utils/date'
import { formatClock, formatDuration } from '../utils/time'
import type { ViewId } from '../types'

export function HomeView({
  onNavigate,
  onOpenSettings,
}: {
  onNavigate: (v: ViewId) => void
  onOpenSettings: () => void
}) {
  const timer = useTimerApi()
  const { settings } = useSettings()
  const now = useNow(true, 1000)
  const t = todayStr()

  const [events, sessions] =
    useLiveQuery(async () => {
      const evs = await db.events.where('date').equals(t).toArray()
      const ss = await db.sessions.where('date').equals(t).toArray()
      return [evs, ss] as const
    }, [t]) ?? [undefined, undefined]

  const stats = events && sessions ? computeStats(events, sessions) : null
  const catMap = new Map((settings?.categories ?? []).map((c) => [c.id, c]))
  const rows = stats
    ? Object.entries(stats.totalByCategory)
        .map(([id, v]) => ({
          name: catMap.get(id)?.name ?? '其他',
          color: catMap.get(id)?.color ?? '#9A9DB0',
          value: v,
        }))
        .sort((a, b) => b.value - a.value)
    : []

  const active = timer.state
  const activeCat = active ? catMap.get(active.categoryId) : undefined

  return (
    <div>
      <div className="page-head home-head">
        <h1 className="page-title">
          {greeting()}，{dateLabel(t)} · 周{weekdayCN(t)}
        </h1>
        <div className="version-badge">v1.6</div>
      </div>

      <div className="home-hero">
        <HourglassLogo size={132} progress={(now % 60000) / 60000} className="hero-logo" />
      </div>

      {active && (
        <button type="button" className="card timer-mini" onClick={() => onNavigate('pagoda')}>
          <span className="dot" style={{ background: activeCat?.color ?? '#9A9DB0' }} />
          <span className="timer-mini-text">
            {active.status === 'finished'
              ? '计时已完成，点击查看'
              : active.status === 'paused'
                ? `计时已暂停 · ${activeCat?.name ?? '其他'} · 剩余 ${formatClock(active.remaining)}`
                : `正在计时 · ${activeCat?.name ?? '其他'} · 剩余 ${formatClock(active.remaining)}`}
          </span>
          <ChevronRightIcon size={16} />
        </button>
      )}

      <div className="quick-grid">
        <button type="button" className="quick-card" onClick={() => onNavigate('pagoda')}>
          <span className="quick-icon" style={{ background: '#4F6BED' }}>
            <ClockIcon />
          </span>
          <div>
            <div className="quick-title">聚沙成塔</div>
            <div className="quick-sub">计时 · 日程 · 积沙成塔</div>
          </div>
        </button>
        <button type="button" className="quick-card" onClick={() => onNavigate('report')}>
          <span className="quick-icon" style={{ background: '#E8A13C' }}>
            <ChartIcon />
          </span>
          <div>
            <div className="quick-title">今日报告</div>
            <div className="quick-sub">
              {stats && stats.totalSeconds > 0 ? `已记录 ${formatDuration(stats.totalSeconds)}` : '实时统计中'}
            </div>
          </div>
        </button>
        <button type="button" className="quick-card" onClick={() => onNavigate('desert')}>
          <span className="quick-icon" style={{ background: '#2FA36B' }}>
            <TreeIcon />
          </span>
          <div>
            <div className="quick-title">沙漠</div>
            <div className="quick-sub">倒沙 · 种树 · 养成</div>
          </div>
        </button>
        <button type="button" className="quick-card" onClick={onOpenSettings}>
          <span className="quick-icon" style={{ background: '#8E6FC8' }}>
            <GearIcon />
          </span>
          <div>
            <div className="quick-title">设置</div>
            <div className="quick-sub">分类 · 预设 · 备份</div>
          </div>
        </button>
      </div>

      <div className="card today-card">
        <div className="today-card-head">
          <span>今日时间记录</span>
          <button type="button" className="btn btn-sm" onClick={() => onNavigate('report')}>
            查看报告
          </button>
        </div>
        {stats && stats.totalSeconds > 0 ? (
          <CategoryBar rows={rows} total={stats.totalSeconds} />
        ) : (
          <div className="empty">今天还没有时间记录，去开始一段专注吧</div>
        )}
      </div>
    </div>
  )
}
