import type { Tree } from '../types'

// 沙漠景观随倒沙量演进的阶段
export function desertStage(sandPoured: number) {
  if (sandPoured >= 60)
    return { name: '绿洲', sky: ['#DCEFE4', '#F2E9C8'], duneFar: '#9FBE83', duneNear: '#8AB072', grass: 14, pond: true }
  if (sandPoured >= 30)
    return { name: '初见绿意', sky: ['#E2EEDC', '#F5E7C0'], duneFar: '#C2C78D', duneNear: '#A9B878', grass: 8, pond: true }
  if (sandPoured >= 10)
    return { name: '半荒漠', sky: ['#EFE7CB', '#F8E3B8'], duneFar: '#DFC27E', duneNear: '#CFB06C', grass: 4, pond: false }
  return { name: '荒漠', sky: ['#F7E8C9', '#F2D9A4'], duneFar: '#E9C87E', duneNear: '#DDB46A', grass: 0, pond: false }
}

function SaplingShape() {
  return (
    <>
      <rect x="-3" y="-24" width="6" height="26" rx="2" fill="#8B6B4A" />
      <ellipse cx="-10" cy="-26" rx="9" ry="5" fill="#5C9E63" transform="rotate(-30 -10 -26)" />
      <ellipse cx="10" cy="-28" rx="9" ry="5" fill="#6DB375" transform="rotate(30 10 -28)" />
    </>
  )
}

function TreeShape() {
  return (
    <>
      <rect x="-5" y="-30" width="10" height="32" rx="3" fill="#8B6B4A" />
      <circle cx="0" cy="-52" r="22" fill="#3E7C46" />
      <circle cx="-16" cy="-38" r="14" fill="#4C8F52" />
      <circle cx="16" cy="-38" r="14" fill="#5C9E63" />
    </>
  )
}

export function DesertScene({
  sandPoured,
  moisture,
  trees,
}: {
  sandPoured: number
  moisture: number
  trees: Tree[]
}) {
  const st = desertStage(sandPoured)
  const grown = trees.filter((t) => t.stage === 'tree').length
  const isForest = grown >= 3

  const positions = trees.map((_, i) => 130 + (i * 460) / Math.max(1, trees.length - 1))
  if (trees.length === 1) positions[0] = 360

  return (
    <svg viewBox="0 0 720 400" preserveAspectRatio="xMidYMid slice" className="desert-svg" role="img" aria-label="沙漠景观">
      <defs>
        <linearGradient id="ds-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={st.sky[0]} />
          <stop offset="1" stopColor={st.sky[1]} />
        </linearGradient>
      </defs>
      <rect width="720" height="400" fill="url(#ds-sky)" />
      <circle cx="600" cy="70" r="38" fill="#F5C860" opacity="0.9" />
      {/* 远景沙丘 */}
      <path d="M0 260 Q 180 200 380 250 T 720 245 L720 400 L0 400 Z" fill={st.duneFar} />
      {/* 近景沙丘 */}
      <path d="M0 320 Q 240 255 480 310 T 720 300 L720 400 L0 400 Z" fill={st.duneNear} />
      {/* 水塘（湿润度越高越大） */}
      {st.pond && moisture > 0 && (
        <ellipse cx="120" cy="342" rx={40 + moisture * 0.5} ry={10 + moisture * 0.14} fill="#7FB8D8" opacity="0.85" />
      )}
      {/* 草丛 */}
      {Array.from({ length: st.grass }).map((_, i) => {
        const x = 60 + ((i * 97) % 620)
        const y = 300 + ((i * 53) % 60)
        return (
          <path
            key={i}
            d={`M${x} ${y + 12} q 3 -12 0 -18 q -3 12 0 18 M${x + 6} ${y + 10} q 3 -10 0 -15 q -3 10 0 15`}
            stroke="#5C9E63"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        )
      })}
      {/* 森林状态：远景背景树 */}
      {isForest &&
        [110, 620, 660].map((x, i) => (
          <g key={i} opacity="0.45" transform={`translate(${x}, 268) scale(0.7)`}>
            <TreeShape />
          </g>
        ))}
      {/* 用户的树：树苗种在沙丘上，大树更高大 */}
      {trees.map((t, i) => (
        <g key={t.id} transform={`translate(${positions[i]}, ${t.stage === 'tree' ? 238 : 296})`}>
          <g className="desert-tree">{t.stage === 'sapling' ? <SaplingShape /> : <TreeShape />}</g>
        </g>
      ))}
    </svg>
  )
}
