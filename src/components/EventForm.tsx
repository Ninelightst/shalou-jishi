import { useState } from 'react'
import type { Category, ScheduleEvent } from '../types'
import { hmToMin, minToHM } from '../utils/date'
import { CategoryPicker } from './CategoryPicker'
import { CloseIcon } from './Icons'

export function EventForm({
  date,
  categories,
  initial,
  onSave,
  onClose,
}: {
  date: string
  categories: Category[]
  initial?: ScheduleEvent
  onSave: (ev: ScheduleEvent, startTimer: boolean) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? 'work')
  const [start, setStart] = useState(initial ? minToHM(initial.startMin) : '09:00')
  const [end, setEnd] = useState(initial ? minToHM(initial.endMin) : '10:00')
  const [note, setNote] = useState(initial?.note ?? '')
  const [startTimer, setStartTimer] = useState(false)
  const [err, setErr] = useState('')

  function submit() {
    if (!title.trim()) {
      setErr('请填写标题')
      return
    }
    const startMin = hmToMin(start)
    const endMin = hmToMin(end)
    if (endMin <= startMin) {
      setErr('结束时间需晚于开始时间')
      return
    }
    onSave(
      {
        ...(initial ?? {}),
        title: title.trim(),
        categoryId,
        date,
        startMin,
        endMin,
        note: note.trim() || undefined,
        createdAt: initial?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
      },
      startTimer,
    )
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{initial ? '编辑安排' : '新建安排'}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭">
            <CloseIcon />
          </button>
        </div>
        <div className="modal-body">
          <label className="field">
            <span>标题</span>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="要做什么？"
              autoFocus
            />
          </label>
          <div className="field">
            <span>分类</span>
            <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
          </div>
          <div className="field-row">
            <label className="field">
              <span>开始时间</span>
              <input className="input" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <label className="field">
              <span>结束时间</span>
              <input className="input" type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </label>
          </div>
          <label className="field">
            <span>备注</span>
            <textarea
              className="input"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="可选"
            />
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={startTimer}
              onChange={(e) => setStartTimer(e.target.checked)}
            />
            <span>保存后立即开始计时（按时长 {minToHM(Math.max(1, hmToMin(end) - hmToMin(start)))}）</span>
          </label>
          {err && <div className="form-err">{err}</div>}
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" onClick={onClose}>
            取消
          </button>
          <button type="button" className="btn btn-primary" onClick={submit}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
