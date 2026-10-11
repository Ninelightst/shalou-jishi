import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { CATEGORY_PALETTE, db } from '../db'
import { useSettings } from '../SettingsContext'
import { useTimerApi } from '../TimerContext'
import { MonthCalendar } from '../components/MonthCalendar'
import { EventForm } from '../components/EventForm'
import { CategoryPicker } from '../components/CategoryPicker'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  StopIcon,
  TrashIcon,
} from '../components/Icons'
import { addDaysStr, dateLabel, minToHM, todayStr, weekdayCN } from '../utils/date'
import { formatClock, formatDuration, formatPreset } from '../utils/time'
import { grantEventReward } from '../utils/game'
import type { Category, ScheduleEvent } from '../types'

const LAST_CAT_KEY = 'hourglass-last-category'

// 聚沙成塔：计时专注 + 日程安排，每一次完成都积攒一粒沙
export function PagodaView() {
  const timer = useTimerApi()
  const { settings, update } = useSettings()
  const cats = settings?.categories ?? []
  const catMap = new Map(cats.map((c) => [c.id, c]))

  // —— 计时器 ——
  const [categoryId, setCategoryId] = useState(() => localStorage.getItem(LAST_CAT_KEY) ?? 'work')
  const [customCat, setCustomCat] = useState('')
  const [preset, setPreset] = useState<number | null>(25 * 60)
  const [customH, setCustomH] = useState(0)
  const [customM, setCustomM] = useState(25)
  const s = timer.state
  const customSeconds = customH * 3600 + customM * 60
  const chosen = preset !== null ? preset : customSeconds
  const effCat = cats.find((c) => c.id === categoryId) ?? cats[0]
  const catColor = effCat?.color ?? '#9A9DB0'

  // 计时结束奖励提示
  const [timerToast, setTimerToast] = useState('')
  useEffect(() => {
    if (timer.lastReward) {
      setTimerToast(`🎉 计时奖励：${timer.lastReward.label}（去沙漠页看看吧）`)
      const id = window.setTimeout(() => setTimerToast(''), 3000)
      return () => window.clearTimeout(id)
    }
  }, [timer.lastReward])

  // 自填类型：已有同名分类则复用，否则自动创建新分类
  async function ensureCategory(name: string): Promise<Category | undefined> {
    const existing = cats.find((c) => c.name === name)
    if (existing) return existing
    const c: Category = {
      id: `c${Date.now()}`,
      name,
      color: CATEGORY_PALETTE[cats.length % CATEGORY_PALETTE.length],
    }
    update({ categories: [...cats, c] })
    return c
  }

  async function startTimer() {
    if (chosen <= 0) return
    let cat = effCat
    const typed = customCat.trim()
    if (typed) {
      const c = await ensureCategory(typed)
      if (c) cat = c
      setCustomCat('')
    }
    if (!cat) return
    localStorage.setItem(LAST_CAT_KEY, cat.id)
    timer.start(cat.id, chosen)
  }

  // 删除自定义分类：历史记录保留（显示/统计归入「其他」），并复位受影响的选中状态
  function removeCategory(id: string) {
    if (!window.confirm('删除该分类？已有记录仍会保留，但会归入「其他」。')) return
    const next = cats.filter((c) => c.id !== id)
    update({ categories: next })
    if (filterCat === id) setFilterCat('all')
    if (categoryId === id) {
      const first = next[0]
      setCategoryId(first?.id ?? 'work')
      if (first) localStorage.setItem(LAST_CAT_KEY, first.id)
      else localStorage.removeItem(LAST_CAT_KEY)
    }
  }

  // —— 日程 ——
  const [selectedDate, setSelectedDate] = useState(() => todayStr())
  const [filterCat, setFilterCat] = useState('all')
  const [editing, setEditing] = useState<ScheduleEvent | 'new' | null>(null)
  const [toast, setToast] = useState('')
  const toastTimer = useRef<number | undefined>(undefined)

  const events = useLiveQuery(() => db.events.where('date').equals(selectedDate).sortBy('startMin'), [selectedDate]) ?? []
  const filtered = filterCat === 'all' ? events : events.filter((e) => e.categoryId === filterCat)
  const totalMin = filtered.reduce((a, e) => a + (e.endMin - e.startMin), 0)
  const doneCount = filtered.filter((e) => e.done).length

  async function save(ev: ScheduleEvent, startTimer: boolean) {
    const id = await db.events.put(ev)
    if (startTimer) {
      // 勾选「保存后立即开始计时」才启动计时，时长取日程时间段
      // 奖励由该日程的完成统一发放，计时本身不重复发
      timer.start(ev.categoryId, Math.max(60, (ev.endMin - ev.startMin) * 60), id as number)
    }
    setEditing(null)
  }

  async function remove(id: number) {
    if (!window.confirm('删除这条安排？')) return
    await db.events.delete(id)
  }

  // 勾选完成 → 发放聚沙奖励（同一日程只发放一次）
  async function toggleDone(e: ScheduleEvent) {
    await db.events.update(e.id as number, { done: !e.done, updatedAt: Date.now() })
    if (!e.done) {
      const r = await grantEventReward(e)
      if (r) {
        setToast(`🎉 完成奖励：${r.label}（去沙漠页看看吧）`)
        window.clearTimeout(toastTimer.current)
        toastTimer.current = window.setTimeout(() => setToast(''), 2800)
      }
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">聚沙成塔</h1>
        <p className="page-sub">每一次专注与完成的日程，都会积成一粒沙</p>
      </div>

      {/* ===== 计时器 ===== */}
      <div className="card timer-setup">
        {s?.status === 'finished' ? (
          <div className="finished-card">
            <div className="finished-icon">✓</div>
            <div className="finished-title">计时完成</div>
            <div className="finished-sub">
              {cats.find((c) => c.id === s.categoryId)?.name ?? '其他'} · {formatPreset(s.plannedSeconds)} · 已记录到今日报告
            </div>
            <div className="timer-btns">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const cat = s.categoryId
                  const sec = s.plannedSeconds
                  timer.dismiss()
                  timer.start(cat, sec)
                }}
              >
                再来一次
              </button>
              <button type="button" className="btn btn-primary" onClick={timer.dismiss}>
                知道了
              </button>
            </div>
          </div>
        ) : !s ? (
          <>
            <div className="field">
              <span>时长</span>
              <div className="preset-row">
                {(settings?.timerPresets ?? []).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`chip ${preset === p ? 'active' : ''}`}
                    onClick={() => setPreset(p)}
                  >
                    {formatPreset(p)}
                  </button>
                ))}
                <button
                  type="button"
                  className={`chip ${preset === null ? 'active' : ''}`}
                  onClick={() => setPreset(null)}
                >
                  自定义
                </button>
              </div>
            </div>

            {preset === null && (
              <div className="field">
                <span>自定义时长</span>
                <div className="custom-row">
                  <label className="custom-field">
                    <input
                      className="input"
                      type="number"
                      min="0"
                      max="23"
                      value={customH}
                      onChange={(e) => {
                        setPreset(null)
                        setCustomH(Number(e.target.value))
                      }}
                    />
                    <span>小时</span>
                  </label>
                  <label className="custom-field">
                    <input
                      className="input"
                      type="number"
                      min="0"
                      max="59"
                      value={customM}
                      onChange={(e) => {
                        setPreset(null)
                        setCustomM(Number(e.target.value))
                      }}
                    />
                    <span>分钟</span>
                  </label>
                </div>
              </div>
            )}

            <div className="field">
              <span>类型</span>
              <CategoryPicker categories={cats} value={effCat?.id ?? ''} onChange={setCategoryId} />
              <input
                className="input custom-cat"
                placeholder="或输入新类型，如：锻炼（自动创建分类）"
                value={customCat}
                onChange={(e) => setCustomCat(e.target.value)}
              />
            </div>

            <button type="button" className="btn btn-primary btn-start" disabled={chosen <= 0} onClick={() => void startTimer()}>
              <PlayIcon size={18} /> 开始 · {formatClock(chosen)}
            </button>
          </>
        ) : (
          <div className="timer-run-row">
            <div className="timer-run-time">{formatClock(s.remaining)}</div>
            <div className="timer-run-meta">
              <span className="dot" style={{ background: catColor }} />
              {cats.find((c) => c.id === s.categoryId)?.name ?? '其他'} · {formatPreset(s.plannedSeconds)}
              {s.status === 'paused' ? ' · 已暂停' : ''}
            </div>
            <div className="timer-btns">
              {s.status === 'running' ? (
                <button type="button" className="btn" onClick={timer.pause}>
                  <PauseIcon size={16} /> 暂停
                </button>
              ) : (
                <button type="button" className="btn" onClick={timer.resume}>
                  <PlayIcon size={16} /> 继续
                </button>
              )}
              <button type="button" className="btn" onClick={timer.stop}>
                <StopIcon size={16} /> 停止并记录
              </button>
              <button type="button" className="btn btn-danger" onClick={timer.reset}>
                放弃
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== 日程 ===== */}
      <div className="page-head sched-head">
        <div className="page-title-row">
          <h2 className="page-title">
            {dateLabel(selectedDate)} · 周{weekdayCN(selectedDate)}
          </h2>
          <div className="date-nav">
            <button type="button" className="icon-btn" onClick={() => setSelectedDate((d) => addDaysStr(d, -1))} aria-label="前一天">
              <ChevronLeftIcon />
            </button>
            <button type="button" className="btn btn-sm" onClick={() => setSelectedDate(todayStr())}>
              今天
            </button>
            <button type="button" className="icon-btn" onClick={() => setSelectedDate((d) => addDaysStr(d, 1))} aria-label="后一天">
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </div>

      <MonthCalendar selected={selectedDate} onSelect={setSelectedDate} />

      <div className="sched-tabs">
        <button type="button" className={`chip ${filterCat === 'all' ? 'active' : ''}`} onClick={() => setFilterCat('all')}>
          全部
        </button>
        {cats.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`chip ${filterCat === c.id ? 'active' : ''}`}
            onClick={() => setFilterCat(c.id)}
          >
            <span className="dot" style={{ background: c.color }} />
            {c.name}
            {c.id.startsWith('c') && cats.length > 1 && (
              <span
                className="chip-x"
                role="button"
                aria-label={`删除分类${c.name}`}
                title="删除该分类"
                onClick={(ev) => {
                  ev.stopPropagation()
                  removeCategory(c.id)
                }}
              >
                ×
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="sched-summary">
        <span>
          {filtered.length > 0
            ? `共 ${filtered.length} 个安排 · 完成 ${doneCount} · 合计 ${formatDuration(totalMin * 60)}`
            : '暂无安排'}
        </span>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => setEditing('new')}>
          <PlusIcon size={16} /> 添加
        </button>
      </div>

      {filtered.length > 0 && doneCount < filtered.length && (
        <div className="hint-banner">💡 日程到点后会自动完成并发奖励；想提前完成，点条目左侧的圆圈</div>
      )}

      <div className="tl">
        {filtered.length === 0 && <div className="empty">这一天还没有安排，点击「添加」开始规划</div>}
        {filtered.map((e) => (
          <div key={e.id} className="tl-item" onClick={() => setEditing(e)}>
            <button
              type="button"
              className={`check ${e.done ? 'done' : ''}`}
              onClick={(ev) => {
                ev.stopPropagation()
                void toggleDone(e)
              }}
              aria-label={e.done ? '取消完成' : '标记完成'}
              title={e.done ? '取消完成（奖励不会收回）' : '标记完成并获得聚沙奖励'}
            >
              {e.done ? '✓' : ''}
            </button>
            <div className="tl-time">
              {minToHM(e.startMin)}
              <br />
              {minToHM(e.endMin)}
            </div>
            <div className="tl-body">
              <div className={`tl-title ${e.done ? 'tl-done' : ''}`}>
                <span className="dot" style={{ background: catMap.get(e.categoryId)?.color ?? '#9A9DB0' }} />
                {e.title}
                <span className="tl-cat">{catMap.get(e.categoryId)?.name ?? '其他'}</span>
              </div>
              {e.note && <div className="tl-note">{e.note}</div>}
            </div>
            <button
              type="button"
              className="icon-btn tl-del"
              onClick={(ev) => {
                ev.stopPropagation()
                void remove(e.id as number)
              }}
              aria-label="删除"
            >
              <TrashIcon size={16} />
            </button>
          </div>
        ))}
      </div>

      {editing && (
        <EventForm
          date={selectedDate}
          categories={cats}
          initial={editing === 'new' ? undefined : editing}
          onSave={(ev, st) => void save(ev, st)}
          onClose={() => setEditing(null)}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
      {timerToast && <div className="toast">{timerToast}</div>}
    </div>
  )
}
