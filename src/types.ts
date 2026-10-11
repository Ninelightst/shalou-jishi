export interface Category {
  id: string
  name: string
  color: string
}

export interface ScheduleEvent {
  id?: number
  title: string
  categoryId: string
  date: string // 'YYYY-MM-DD'
  startMin: number // 当天 0:00 起算的分钟数
  endMin: number
  note?: string
  done?: boolean // 是否已完成（完成时发放沙漠奖励）
  createdAt: number
  updatedAt: number
}

export interface TimerSession {
  id?: number
  categoryId: string
  plannedSeconds: number // 用户设定的时长
  actualSeconds: number // 实际计时时长
  startedAt: number // epoch ms，归属日期按此换算
  endedAt: number
  completed: boolean // true=自然到点 false=手动停止
  date: string
}

export interface DailyReport {
  date: string // 主键
  totalByCategory: Record<string, number> // categoryId → 秒
  totalSeconds: number
  completedSessions: number
  stoppedSessions: number
  eventCount: number
  eventIds: number[]
  sessionIds: number[]
  generatedAt: number
  auto: boolean
}

export interface AppSettings {
  categories: Category[]
  timerPresets: number[] // 秒
  theme: 'light' | 'dark'
  weatherCity?: { name: string; lat: number; lon: number } | null
}

export interface Tree {
  id: number
  stage: 'sapling' | 'tree'
  plantedAt: number
}

export interface GameState {
  coins: number // 金币，商城购买树苗
  sandPoured: number // 已倒入沙漠的沙（景观进度）
  sandToPour: number // 待倒沙次数（完成日程获得）
  fertility: number // 肥沃度 0-100（化肥提升）
  moisture: number // 湿润度 0-100（浇水提升）
  fertilizer: number // 化肥袋数
  wateringCans: number // 水壶数
  trees: Tree[]
  grantedEventIds: number[] // 已发放过奖励的日程 id
}

export type ViewId = 'home' | 'pagoda' | 'report' | 'desert'
