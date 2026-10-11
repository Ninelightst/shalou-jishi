import { useEffect, useRef, useState } from 'react'
import type { GameState } from '../types'
import {
  FERTILIZER_AMOUNT,
  GROW_FERTILITY,
  GROW_MOISTURE,
  TREE_PRICE,
  WATER_AMOUNT,
  applyGrowth,
  loadGame,
  saveGame,
} from '../utils/game'
import { DesertScene, desertStage } from '../components/DesertScene'
import { HourglassLogo } from '../components/HourglassLogo'
import { CloseIcon } from '../components/Icons'

export function DesertView() {
  const [game, setGame] = useState<GameState | null>(null)
  const gameRef = useRef<GameState | null>(null)
  const [pour, setPour] = useState(-1) // -1 空闲，0~1 倒沙动画进度
  const [shopOpen, setShopOpen] = useState(false)

  useEffect(() => {
    void loadGame().then((g) => {
      gameRef.current = g
      setGame(g)
    })
  }, [])

  async function mutate(fn: (g: GameState) => void) {
    const cur = gameRef.current
    if (!cur) return
    const next = structuredClone(cur)
    fn(next)
    applyGrowth(next) // 条件达标时树苗自动长成大树
    gameRef.current = next // 立即同步，避免连续操作丢失更新
    await saveGame(next)
    setGame(next)
  }

  function pourSand() {
    if (!game || game.sandToPour <= 0 || pour >= 0) return
    const start = Date.now()
    const dur = 1200
    setPour(0)
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / dur)
      setPour(p)
      if (p >= 1) {
        clearInterval(id)
        setPour(-1)
        void mutate((g) => {
          g.sandToPour -= 1
          g.sandPoured += 1
        })
      }
    }, 50)
  }

  function useFertilizer() {
    if (!game || game.fertilizer <= 0 || game.fertility >= 100) return
    void mutate((g) => {
      g.fertilizer -= 1
      g.fertility = Math.min(100, g.fertility + FERTILIZER_AMOUNT)
    })
  }

  function useWater() {
    if (!game || game.wateringCans <= 0 || game.moisture >= 100) return
    void mutate((g) => {
      g.wateringCans -= 1
      g.moisture = Math.min(100, g.moisture + WATER_AMOUNT)
    })
  }

  function buyTree() {
    if (!game || game.coins < TREE_PRICE) return
    void mutate((g) => {
      g.coins -= TREE_PRICE
      g.trees.push({ id: Date.now(), stage: 'sapling', plantedAt: Date.now() })
    })
  }

  if (!game) return <div className="empty">加载中…</div>

  const grown = game.trees.filter((t) => t.stage === 'tree').length
  const isForest = grown >= 3
  const stageName = isForest ? '森林' : desertStage(game.sandPoured).name

  return (
    <div>
      <div className="page-head">
        <div className="page-title-row">
          <h1 className="page-title">沙漠</h1>
          <span className="tag tag-live">{stageName}</span>
        </div>
        <p className="page-sub">完成日程可获得沙漏与道具，让沙漠慢慢变成森林</p>
      </div>

      <div className="card scene-card">
        <DesertScene sandPoured={game.sandPoured} moisture={game.moisture} trees={game.trees} />
      </div>

      <div className="desert-stats">
        <span className="stat-chip">🪙 金币 {game.coins}</span>
        <span className="stat-chip">⏳ 沙 {game.sandPoured}</span>
        <span className="stat-chip">🧺 化肥 {game.fertilizer}</span>
        <span className="stat-chip">🚿 水壶 {game.wateringCans}</span>
        <span className="stat-chip">🌱 树 {game.trees.length} 棵</span>
      </div>

      <div className="desert-bars">
        <div className="bar-label">
          <span className="dot" style={{ background: '#8B6B4A' }} />
          肥沃度 {game.fertility}/100
          <span className="bar-time">{game.fertility >= GROW_FERTILITY ? '已达树苗成长线' : `还差 ${GROW_FERTILITY - game.fertility}`}</span>
        </div>
        <div className="bar-track">
          <div className="bar-fill" style={{ width: `${game.fertility}%`, background: '#8B6B4A' }} />
        </div>
        <div className="bar-label">
          <span className="dot" style={{ background: '#4FB3C9' }} />
          湿润度 {game.moisture}/100
          <span className="bar-time">{game.moisture >= GROW_MOISTURE ? '已达树苗成长线' : `还差 ${GROW_MOISTURE - game.moisture}`}</span>
        </div>
        <div className="bar-track">
          <div className="bar-fill" style={{ width: `${game.moisture}%`, background: '#4FB3C9' }} />
        </div>
      </div>

      <div className="desert-actions">
        <button
          type="button"
          className={`pour-btn ${game.sandToPour > 0 ? 'ready' : ''}`}
          onClick={pourSand}
          disabled={game.sandToPour <= 0 || pour >= 0}
        >
          <HourglassLogo
            size={72}
            progress={pour >= 0 ? pour : game.sandToPour > 0 ? 0 : 1}
          />
          <span>{game.sandToPour > 0 ? `倒沙（待倒 ${game.sandToPour}）` : '暂无沙可倒'}</span>
        </button>
        <button type="button" className="btn" onClick={useFertilizer} disabled={game.fertilizer <= 0 || game.fertility >= 100}>
          🧺 施肥（+{FERTILIZER_AMOUNT} 肥沃）
        </button>
        <button type="button" className="btn" onClick={useWater} disabled={game.wateringCans <= 0 || game.moisture >= 100}>
          🚿 浇水（+{WATER_AMOUNT} 湿润）
        </button>
        <button type="button" className="btn btn-primary" onClick={() => setShopOpen(true)}>
          🛒 商城
        </button>
      </div>

      {isForest && (
        <div className="forest-badge">
          🌲 恭喜！你的沙漠已经变成了一片森林（{grown} 棵大树）
        </div>
      )}

      {shopOpen && (
        <div className="modal-backdrop" onClick={() => setShopOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>沙漠商城</h3>
              <button type="button" className="icon-btn" onClick={() => setShopOpen(false)} aria-label="关闭">
                <CloseIcon />
              </button>
            </div>
            <div className="modal-body">
              <div className="shop-balance">
                当前金币：<b>{game.coins}</b>（完成学习日程或生活日程可获得）
              </div>
              <div className="shop-item">
                <div className="shop-item-icon">🌱</div>
                <div className="shop-item-info">
                  <div className="shop-item-name">树苗</div>
                  <div className="shop-item-desc">
                    购买后种在沙漠中。肥沃度和湿润度均达到 {GROW_FERTILITY} 时长成大树，多棵大树连成森林。
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  disabled={game.coins < TREE_PRICE}
                  onClick={buyTree}
                >
                  {TREE_PRICE} 金币购买
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
