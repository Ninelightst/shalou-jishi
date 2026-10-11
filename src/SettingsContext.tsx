import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { loadSettings, saveSettings } from './db'
import type { AppSettings } from './types'

interface SettingsCtxValue {
  settings: AppSettings | null
  update: (patch: Partial<AppSettings>) => void
}

const Ctx = createContext<SettingsCtxValue>({ settings: null, update: () => {} })

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    void loadSettings().then(setSettings)
  }, [])

  const update = (patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...patch }
      void saveSettings(next)
      return next
    })
  }

  return <Ctx.Provider value={{ settings, update }}>{children}</Ctx.Provider>
}

export function useSettings(): SettingsCtxValue {
  return useContext(Ctx)
}
