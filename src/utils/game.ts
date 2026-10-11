import { db } from '../db'
import type { GameState, ScheduleEvent } from '../types'
import { toDateStr } from './date'

export const TREE_PRICE = 10 // 树苗价格（金币）
export const GROW_FERTILITY = 60 // 树苗长成大树所需肥沃度
export const GROW_MOISTURE = 60 // 树苗长成大树所需湿润度
export const FERTILIZER_AMOUNT = 20 // 每袋化肥提升的肥沃度
export const WATER_AMOUNT = 20 // 每壶水提升的湿润度

export function defaultGame(): GameState {
  return {
    coins: 0,
    sandPoured: 0,
    sandToPour: 0,
    fertility: 0,
    moisture: 0,
    fertilizer: 0,
    wateringCans: 0,
    trees: [],
    grantedEventIds: [],
  }
}

export async function loadGame(): Promise<GameState> {
  const row = await db.game.get('state')
  return row ? (row.value as GameState) : defaultGame()
}

export async function saveGame(g: GameState): Promise<void> {
  await db.game.put({ key: 'state', value: g })
}

// 树苗在肥沃度与湿润度达标时长成大树，返回是否有变化
export function applyGrowth(g: GameState): boolean {
  if (g.fertility < GROW_FERTILITY || g.moisture < GROW_MOISTURE) return false
  let changed = false
  for (const t of g.trees) {
    if (t.stage === 'sapling') {
      t.stage = 'tree'
      changed = true
    }
  }
  return changed
}

export interface RewardResult {
  label: string
  coins: number
  fertilizer: number
  wateringCans: number
}

// 按分类发放道具：学习→金币、工作→化肥、娱乐→水壶、生活及自定义→随机三选一
function applyCategoryReward(
  g: GameState,
  categoryId: string,
  parts: string[],
): { coins: number; fertilizer: number; wateringCans: number } {
  const items = { coins: 0, fertilizer: 0, wateringCans: 0 }
  if (categoryId === 'study') {
    g.coins += 1
    items.coins = 1
    parts.push('金币×1')
  } else if (categoryId === 'work') {
    g.fertilizer += 1
    items.fertilizer = 1
    parts.push('化肥×1')
  } else if (categoryId === 'fun') {
    g.wateringCans += 1
    items.wateringCans = 1
    parts.push('水壶×1')
  } else {
    const r = Math.floor(Math.random() * 3)
    if (r === 0) {
      g.coins += 1
      items.coins = 1
      parts.push('金币×1')
    } else if (r === 1) {
      g.fertilizer += 1
      items.fertilizer = 1
      parts.push('化肥×1')
    } else {
      g.wateringCans += 1
      items.wateringCans = 1
      parts.push('水壶×1')
    }
  }
  return items
}

// 勾选完成日程发放奖励：沙漏×1 + 分类道具（幂等：同一日程只发放一次）
export async function grantEventReward(ev: ScheduleEvent): Promise<RewardResult | null> {
  if (!ev.id) return null
  const g = await loadGame()
  if (g.grantedEventIds.includes(ev.id)) return null
  g.sandToPour += 1
  g.grantedEventIds.push(ev.id)
  if (g.grantedEventIds.length > 500) g.grantedEventIds = g.grantedEventIds.slice(-500)
  const parts = ['沙漏×1']
  const items = applyCategoryReward(g, ev.categoryId, parts)
  await saveGame(g)
  return { label: parts.join(' · '), ...items }
}

// 计时会话结束发放奖励：实际计时 ≥1 分钟才发（每次会话记录时调用一次）
export async function grantTimerReward(opts: {
  categoryId: string
  actualSeconds: number
}): Promise<RewardResult | null> {
  if (opts.actualSeconds < 60) return null
  const g = await loadGame()
  g.sandToPour += 1
  const parts = ['沙漏×1']
  const items = applyCategoryReward(g, opts.categoryId, parts)
  await saveGame(g)
  return { label: parts.join(' · '), ...items }
}

export interface AutoCompleteResult {
  count: number
  label: string
}

// 日程到点自动完成：结束时间已过的未完成日程自动标记完成并发放奖励（幂等）
export async function autoCompleteEvents(): Promise<AutoCompleteResult | null> {
  const now = new Date()
  const today = toDateStr(now)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const due = await db.events
    .filter((e) => !e.done && (e.date < today || (e.date === today && e.endMin <= nowMin)))
    .toArray()
  if (due.length === 0) return null
  const totals = { coins: 0, fertilizer: 0, wateringCans: 0 }
  let sand = 0
  for (const e of due) {
    const r = await grantEventReward(e)
    if (r) {
      sand += 1
      totals.coins += r.coins
      totals.fertilizer += r.fertilizer
      totals.wateringCans += r.wateringCans
    }
    await db.events.update(e.id as number, { done: true, updatedAt: Date.now() })
  }
  const parts = [`沙漏×${sand}`]
  if (totals.coins > 0) parts.push(`金币×${totals.coins}`)
  if (totals.fertilizer > 0) parts.push(`化肥×${totals.fertilizer}`)
  if (totals.wateringCans > 0) parts.push(`水壶×${totals.wateringCans}`)
  return { count: due.length, label: parts.join(' · ') }
}
