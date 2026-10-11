import Dexie, { type EntityTable } from 'dexie'
import type { AppSettings, DailyReport, ScheduleEvent, TimerSession } from './types'

export const DEFAULT_CATEGORIES = [
  { id: 'work', name: '工作', color: '#4F6BED' },
  { id: 'life', name: '生活', color: '#2FA36B' },
  { id: 'study', name: '学习', color: '#E8A13C' },
  { id: 'fun', name: '娱乐', color: '#E05C5C' },
]

export const DEFAULT_PRESETS = [5 * 60, 15 * 60, 25 * 60, 45 * 60, 60 * 60]

// 新增自定义分类时循环取用的颜色
export const CATEGORY_PALETTE = ['#8E6FC8', '#4FB3C9', '#E07A9B', '#7A9E5A', '#C9822B', '#5A7D9E']

class HourglassDB extends Dexie {
  events!: EntityTable<ScheduleEvent, 'id'>
  sessions!: EntityTable<TimerSession, 'id'>
  reports!: EntityTable<DailyReport, 'date'>
  settings!: EntityTable<{ key: string; value: unknown }, 'key'>
  game!: EntityTable<{ key: string; value: unknown }, 'key'>

  constructor() {
    super('hourglass-journal')
    this.version(1).stores({
      events: '++id, date, categoryId, [date+startMin]',
      sessions: '++id, date, categoryId, startedAt',
      reports: 'date',
      settings: 'key',
    })
    this.version(2).stores({
      game: 'key',
    })
  }
}

export const db = new HourglassDB()

export async function loadSettings(): Promise<AppSettings> {
  const row = await db.settings.get('app')
  if (row) return row.value as AppSettings
  const def: AppSettings = {
    categories: DEFAULT_CATEGORIES,
    timerPresets: DEFAULT_PRESETS,
    theme: 'light',
  }
  await db.settings.put({ key: 'app', value: def })
  return def
}

export async function saveSettings(s: AppSettings): Promise<void> {
  await db.settings.put({ key: 'app', value: s })
}
