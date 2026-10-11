import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useNow } from './hooks/useNow'
import { db } from './db'
import { toDateStr } from './utils/date'
import { playTimerRing } from './utils/sound'
import { grantTimerReward } from './utils/game'

const LS_KEY = 'hourglass-timer'

type TimerStatus = 'running' | 'paused' | 'finished'

interface PersistedTimer {
  status: TimerStatus
  categoryId: string
  plannedSeconds: number
  startedAt: number
  pausedRemaining: number | null
  finishedAt?: number
  eventId?: number // 从日程启动的计时：奖励由日程完成统一发放，计时本身不重复发
}

export interface TimerState extends PersistedTimer {
  remaining: number // 当前剩余秒数
}

export interface TimerApi {
  state: TimerState | null // null = 空闲
  lastReward: { label: string; at: number } | null // 最近一次计时结束发放的奖励
  start: (categoryId: string, seconds: number, eventId?: number) => void
  pause: () => void
  resume: () => void
  stop: () => void // 手动停止并记录
  reset: () => void // 放弃本次计时（不记录）
  dismiss: () => void // 完成提示 → 回到空闲
}

const TimerCtx = createContext<TimerApi | null>(null)

function readPersisted(): PersistedTimer | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as PersistedTimer
    if (typeof p.plannedSeconds !== 'number' || p.plannedSeconds <= 0) return null
    return p
  } catch {
    return null
  }
}

function writePersisted(p: PersistedTimer | null): void {
  if (p) localStorage.setItem(LS_KEY, JSON.stringify(p))
  else localStorage.removeItem(LS_KEY)
}

function calcRemaining(p: PersistedTimer, now: number): number {
  if (p.status === 'running') return Math.max(0, p.plannedSeconds - (now - p.startedAt) / 1000)
  if (p.status === 'paused') return p.pausedRemaining ?? 0
  return 0
}

// 防重入标记（StrictMode 下 effect 会执行两次）
let completingAt: number | null = null

async function recordSession(
  p: PersistedTimer,
  actualSeconds: number,
  completed: boolean,
  endedAt: number,
  onReward: (label: string) => void,
): Promise<void> {
  const actual = Math.max(1, Math.round(actualSeconds))
  await db.sessions.add({
    categoryId: p.categoryId,
    plannedSeconds: p.plannedSeconds,
    actualSeconds: actual,
    startedAt: p.startedAt,
    endedAt,
    completed,
    date: toDateStr(new Date(p.startedAt)),
  })
  // 计时结束发放聚沙奖励（实际计时 ≥1 分钟；从日程启动的计时由日程完成发奖励，不重复）
  if (!p.eventId) {
    const r = await grantTimerReward({ categoryId: p.categoryId, actualSeconds: actual })
    if (r) onReward(r.label)
  }
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedTimer | null>(() => readPersisted())
  const [lastReward, setLastReward] = useState<{ label: string; at: number } | null>(null)
  const running = state?.status === 'running'
  const now = useNow(running, 500)

  function commit(next: PersistedTimer | null): void {
    writePersisted(next)
    setState(next)
  }

  function onReward(label: string): void {
    setLastReward({ label, at: Date.now() })
  }

  // 自然到点完成：记录会话 + 响铃
  function complete(p: PersistedTimer, endedAt: number): void {
    if (completingAt === endedAt) return
    completingAt = endedAt
    void recordSession(p, p.plannedSeconds, true, endedAt, onReward)
    commit({ ...p, status: 'finished', finishedAt: endedAt })
    playTimerRing()
    completingAt = null
  }

  // 运行时检测剩余时间归零
  useEffect(() => {
    if (!state || state.status !== 'running') return
    const end = state.startedAt + state.plannedSeconds * 1000
    if (Date.now() >= end) complete(state, end)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, state])

  // 重新打开页面时补录：若计时早已结束，自动完成并记录
  useEffect(() => {
    const p = readPersisted()
    if (p && p.status === 'running') {
      const end = p.startedAt + p.plannedSeconds * 1000
      if (Date.now() >= end) complete(p, end)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const api: TimerApi = {
    state: state ? { ...state, remaining: calcRemaining(state, now) } : null,
    lastReward,
    start: (categoryId, seconds, eventId) => {
      if (seconds <= 0) return
      commit({
        status: 'running',
        categoryId,
        plannedSeconds: seconds,
        startedAt: Date.now(),
        pausedRemaining: null,
        ...(eventId ? { eventId } : {}),
      })
    },
    pause: () => {
      if (!state || state.status !== 'running') return
      commit({ ...state, status: 'paused', pausedRemaining: calcRemaining(state, Date.now()) })
    },
    resume: () => {
      if (!state || state.status !== 'paused') return
      const rem = state.pausedRemaining ?? 0
      commit({ ...state, status: 'running', startedAt: Date.now() - (state.plannedSeconds - rem) * 1000, pausedRemaining: null })
    },
    stop: () => {
      if (!state || state.status === 'finished') return
      const rem = calcRemaining(state, Date.now())
      const actual = state.plannedSeconds - rem
      if (actual > 0) void recordSession(state, actual, false, Date.now(), onReward)
      commit(null)
    },
    reset: () => {
      commit(null)
    },
    dismiss: () => {
      if (state?.status === 'finished') commit(null)
    },
  }

  // 页面标题实时显示剩余时间
  useEffect(() => {
    if (state?.status === 'running') document.title = `⏳ ${format(calcRemaining(state, now))} · 沙漏记事`
    else if (state?.status === 'paused') document.title = `⏸ ${format(calcRemaining(state, now))} · 沙漏记事`
    else document.title = '沙漏记事'
    return () => {
      document.title = '沙漏记事'
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, now])

  return <TimerCtx.Provider value={api}>{children}</TimerCtx.Provider>
}

function format(sec: number): string {
  const s = Math.max(0, Math.ceil(sec))
  const m = Math.floor(s / 60)
  const ss = String(s % 60).padStart(2, '0')
  return `${m}:${ss}`
}

export function useTimerApi(): TimerApi {
  const api = useContext(TimerCtx)
  if (!api) throw new Error('useTimerApi 必须在 TimerProvider 内使用')
  return api
}
