import { useRef, useState } from 'react'
import { CATEGORY_PALETTE } from '../db'
import { useSettings } from '../SettingsContext'
import type { Category } from '../types'
import { downloadText, exportAll, importAll } from '../utils/exportImport'
import { formatPreset } from '../utils/time'
import { todayStr } from '../utils/date'
import { CloseIcon, DownloadIcon, MoonIcon, SunIcon, UploadIcon } from './Icons'

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, update } = useSettings()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [presetInput, setPresetInput] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  if (!settings) return null

  function renameCategory(id: string, name: string) {
    update({ categories: settings!.categories.map((c) => (c.id === id ? { ...c, name } : c)) })
  }

  function setColor(id: string, color: string) {
    update({ categories: settings!.categories.map((c) => (c.id === id ? { ...c, color } : c)) })
  }

  function addCategory() {
    const cats: Category[] = settings!.categories
    const c: Category = {
      id: `c${Date.now()}`,
      name: '新分类',
      color: CATEGORY_PALETTE[cats.length % CATEGORY_PALETTE.length],
    }
    update({ categories: [...cats, c] })
  }

  function removeCategory(id: string) {
    if (!window.confirm('删除该分类？已有记录仍会保留，但会归入「其他」。')) return
    update({ categories: settings!.categories.filter((c) => c.id !== id) })
  }

  function removePreset(seconds: number) {
    update({ timerPresets: settings!.timerPresets.filter((p) => p !== seconds) })
  }

  function addPreset() {
    const min = Math.round(Number(presetInput))
    if (!min || min <= 0) return
    const seconds = min * 60
    if (!settings!.timerPresets.includes(seconds)) {
      update({ timerPresets: [...settings!.timerPresets, seconds].sort((a, b) => a - b) })
    }
    setPresetInput('')
  }

  async function doExport() {
    try {
      const json = await exportAll()
      downloadText(`沙漏记事备份-${todayStr()}.json`, json)
      setMsg('已导出备份文件')
    } catch (e) {
      setMsg(`导出失败：${e instanceof Error ? e.message : e}`)
    }
  }

  async function doImport(file: File) {
    if (!window.confirm('导入将覆盖当前全部数据，确定继续？')) return
    setBusy(true)
    setMsg('')
    try {
      const text = await file.text()
      const r = await importAll(text)
      setMsg(`导入成功：日程 ${r.events} 条，计时 ${r.sessions} 次，报告 ${r.reports} 份。正在刷新…`)
      setTimeout(() => window.location.reload(), 1200)
    } catch (e) {
      setMsg(`导入失败：${e instanceof Error ? e.message : e}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>设置</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭">
            <CloseIcon />
          </button>
        </div>
        <div className="modal-body">
          <section className="set-section">
            <h4>外观</h4>
            <div className="theme-toggle">
              <button
                type="button"
                className={`btn ${settings.theme === 'light' ? 'btn-primary' : ''}`}
                onClick={() => update({ theme: 'light' })}
              >
                <SunIcon size={16} /> 浅色
              </button>
              <button
                type="button"
                className={`btn ${settings.theme === 'dark' ? 'btn-primary' : ''}`}
                onClick={() => update({ theme: 'dark' })}
              >
                <MoonIcon size={16} /> 深色
              </button>
            </div>
          </section>

          <section className="set-section">
            <h4>分类管理</h4>
            <div className="cat-list">
              {settings.categories.map((c) => (
                <div key={c.id} className="cat-edit-row">
                  <input
                    type="color"
                    className="color-input"
                    value={c.color}
                    onChange={(e) => setColor(c.id, e.target.value)}
                  />
                  <input
                    className="input"
                    value={c.name}
                    onChange={(e) => renameCategory(c.id, e.target.value)}
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    disabled={settings.categories.length <= 1}
                    onClick={() => removeCategory(c.id)}
                    aria-label={`删除${c.name}`}
                  >
                    <CloseIcon size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-sm" onClick={addCategory}>
              + 添加分类
            </button>
          </section>

          <section className="set-section">
            <h4>计时预设</h4>
            <div className="preset-chips">
              {settings.timerPresets.map((p) => (
                <span key={p} className="chip">
                  {formatPreset(p)}
                  <button type="button" className="chip-x" onClick={() => removePreset(p)} aria-label={`删除预设${formatPreset(p)}`}>
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="preset-add">
              <input
                className="input"
                type="number"
                min="1"
                placeholder="分钟数"
                value={presetInput}
                onChange={(e) => setPresetInput(e.target.value)}
              />
              <button type="button" className="btn btn-sm" onClick={addPreset}>
                添加预设
              </button>
            </div>
          </section>

          <section className="set-section">
            <h4>数据备份</h4>
            <p className="hint">数据保存在当前设备本地。建议定期导出备份，换设备时可导入恢复。</p>
            <div className="backup-btns">
              <button type="button" className="btn" onClick={doExport}>
                <DownloadIcon size={16} /> 导出备份
              </button>
              <button type="button" className="btn" disabled={busy} onClick={() => fileRef.current?.click()}>
                <UploadIcon size={16} /> 导入备份
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void doImport(f)
                  e.target.value = ''
                }}
              />
            </div>
            {msg && <div className="form-msg">{msg}</div>}
          </section>
        </div>
      </div>
    </div>
  )
}
