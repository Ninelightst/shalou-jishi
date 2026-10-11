import { useEffect, useRef, useState, type ReactNode } from 'react'
import { SettingsProvider, useSettings } from './SettingsContext'
import { TimerProvider } from './TimerContext'
import { generateMissingReports } from './utils/reportGenerator'
import { autoCompleteEvents } from './utils/game'
import { installAudioUnlock } from './utils/sound'
import { todayStr } from './utils/date'
import { HourglassLogo } from './components/HourglassLogo'
import { CalendarIcon, ChartIcon, GearIcon, HomeIcon, TreeIcon } from './components/Icons'
import { HomeView } from './views/HomeView'
import { PagodaView } from './views/PagodaView'
import { ReportView } from './views/ReportView'
import { DesertView } from './views/DesertView'
import { SettingsModal } from './components/SettingsModal'
import { InstallTip } from './components/InstallTip'
import type { ViewId } from './types'

const NAV: { id: ViewId; label: string; icon: ReactNode }[] = [
  { id: 'home', label: '主页', icon: <HomeIcon /> },
  { id: 'pagoda', label: '聚沙成塔', icon: <CalendarIcon /> },
  { id: 'report', label: '报告', icon: <ChartIcon /> },
  { id: 'desert', label: '沙漠', icon: <TreeIcon /> },
]

// 轻量 hash 路由：刷新后停留在当前页面（#/pagoda 等）
function viewFromHash(): ViewId {
  const h = location.hash.replace(/^#\/?/, '')
  return (NAV.some((n) => n.id === h) ? h : 'home') as ViewId
}

function Shell() {
  const { settings } = useSettings()
  const [view, setView] = useState<ViewId>(viewFromHash)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [dayKey, setDayKey] = useState(0)
  const [autoToast, setAutoToast] = useState('')
  const lastDayRef = useRef(todayStr())
  const autoToastTimer = useRef<number | undefined>(undefined)

  // 视图切换同步到 hash（可刷新保持、支持返回键），hash 变化同步回视图
  const go = (v: ViewId) => {
    setView(v)
    const target = `#/${v}`
    if (location.hash !== target) location.hash = target
  }
  useEffect(() => {
    const onHash = () => setView(viewFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // 主题：同步根节点属性与 Android 窗口主题色（避免下拉时露出黑色背景）
  useEffect(() => {
    if (!settings) return
    document.documentElement.dataset.theme = settings.theme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', settings.theme === 'dark' ? '#1C1D26' : '#F7F5F0')
  }, [settings?.theme])

  // 日程到点自动完成：发放奖励并提示
  function checkAuto() {
    void autoCompleteEvents()
      .then((r) => {
        if (!r) return
        setAutoToast(`🎉 ${r.count} 条日程已自动完成：${r.label}（去沙漠页看看吧）`)
        window.clearTimeout(autoToastTimer.current)
        autoToastTimer.current = window.setTimeout(() => setAutoToast(''), 4000)
      })
      .catch(console.error)
  }

  // 日期翻转检测 + 自动生成每日报告 + 日程自动完成
  useEffect(() => {
    installAudioUnlock()
    void generateMissingReports().catch(console.error)
    checkAuto()
    const onVis = () => {
      if (!document.hidden) {
        checkDay()
        void generateMissingReports().catch(console.error)
        checkAuto()
      }
    }
    document.addEventListener('visibilitychange', onVis)
    const id = setInterval(() => {
      checkDay()
      checkAuto()
    }, 60000)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      clearInterval(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function checkDay() {
    const t = todayStr()
    if (t !== lastDayRef.current) {
      lastDayRef.current = t
      setDayKey((k) => k + 1) // 强制刷新视图中的「今天」
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <HourglassLogo size={40} progress={0} />
          <span>沙漏记事</span>
        </div>
        <nav className="side-nav">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              className={`side-item ${view === n.id ? 'active' : ''}`}
              onClick={() => go(n.id)}
            >
              {n.icon}
              {n.label}
            </button>
          ))}
        </nav>
        <div className="side-footer">
          <button type="button" className="side-item" onClick={() => setSettingsOpen(true)}>
            <GearIcon /> 设置
          </button>
        </div>
      </aside>

      <main className="main" key={dayKey}>
        {view === 'home' && <HomeView onNavigate={go} onOpenSettings={() => setSettingsOpen(true)} />}
        {view === 'pagoda' && <PagodaView />}
        {view === 'report' && <ReportView />}
        {view === 'desert' && <DesertView onOpenSettings={() => setSettingsOpen(true)} />}
      </main>

      <nav className="bottom-nav">
        {NAV.map((n) => (
          <button
            key={n.id}
            type="button"
            className={`nav-item ${view === n.id ? 'active' : ''}`}
            onClick={() => go(n.id)}
          >
            {n.icon}
            <span>{n.label}</span>
          </button>
        ))}
      </nav>

      <InstallTip />
      {autoToast && <div className="toast toast-auto">{autoToast}</div>}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <TimerProvider>
        <Shell />
      </TimerProvider>
    </SettingsProvider>
  )
}
