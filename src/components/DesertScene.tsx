import type { Tree } from '../types'
import { weatherKind, type WeatherNow } from '../utils/weather'

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

// 时段：拂晓/白昼/黄昏/夜晚
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night'

export function timeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 7) return 'dawn'
  if (hour >= 7 && hour < 17) return 'day'
  if (hour >= 17 && hour < 19) return 'dusk'
  return 'night'
}

// 天体弧线位置：t 0~1（东→西），y 越高越接近天顶
function arcPos(t: number): { x: number; y: number } {
  return { x: 90 + 540 * t, y: 96 - 58 * Math.sin(Math.PI * t) }
}

// 太阳/月亮位置
export function sunPos(hour: number) {
  if (hour >= 6 && hour <= 18) return arcPos((hour - 6) / 12)
  return null
}
export function moonPos(hour: number) {
  if (hour >= 19 || hour < 6) return arcPos(((hour + 5) % 24) / 12)
  return null
}

// 确定性伪随机（星空与雨滴布局不随刷新跳动）
function prand(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
  return x - Math.floor(x)
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
  hour,
  weather,
}: {
  sandPoured: number
  moisture: number
  trees: Tree[]
  hour: number
  weather?: WeatherNow | null
}) {
  const st = desertStage(sandPoured)
  const grown = trees.filter((t) => t.stage === 'tree').length
  const isForest = grown >= 3

  const positions = trees.map((_, i) => 130 + (i * 460) / Math.max(1, trees.length - 1))
  if (trees.length === 1) positions[0] = 360

  const tod = timeOfDay(hour)
  const sun = sunPos(hour)
  const moon = moonPos(hour)
  const kind = weather ? weatherKind(weather.code) : 'sunny'

  // 时段色调（叠加在阶段天空之上）
  const tint =
    tod === 'night'
      ? { fill: '#141A3C', opacity: 0.55 }
      : tod === 'dawn'
        ? { fill: '#FF9A5A', opacity: 0.24 }
        : tod === 'dusk'
          ? { fill: '#C96A4A', opacity: 0.28 }
          : null

  // 天气压暗
  const dim =
    kind === 'overcast' || kind === 'rain' || kind === 'snow' || kind === 'storm' || kind === 'fog' ? 0.16 : 0

  return (
    <svg viewBox="0 0 720 400" preserveAspectRatio="xMidYMid slice" className="desert-svg" role="img" aria-label="沙漠景观">
      <defs>
        <linearGradient id="ds-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={st.sky[0]} />
          <stop offset="1" stopColor={st.sky[1]} />
        </linearGradient>
      </defs>
      <rect width="720" height="400" fill="url(#ds-sky)" />
      {/* 时段色调 */}
      {tint && <rect width="720" height="400" fill={tint.fill} opacity={tint.opacity} />}

      {/* 星空（夜晚） */}
      {tod === 'night' &&
        Array.from({ length: 26 }).map((_, i) => {
          const x = 20 + prand(i, 7) * 680
          const y = 8 + prand(i, 13) * 160
          const r = 0.8 + prand(i, 29) * 1.6
          return (
            <circle key={i} cx={x} cy={y} r={r} fill="#F5F2E8" className="star" style={{ animationDelay: `${prand(i, 31) * 3}s` }} />
          )
        })}

      {/* 太阳 / 月亮 */}
      {sun && <circle cx={sun.x} cy={sun.y} r="30" fill="#F5C860" opacity={tod === 'dawn' || tod === 'dusk' ? 0.75 : 0.92} />}
      {moon && (
        <g transform={`translate(${moon.x}, ${moon.y})`} opacity="0.92">
          <circle r="24" fill="#F0EDDA" />
          <circle cx="-9" cy="-6" r="20" fill={tint?.fill ?? '#141A3C'} />
        </g>
      )}

      {/* 云层（多云/阴/雨/雪/雷） */}
      {(kind === 'partly' || kind === 'overcast' || kind === 'rain' || kind === 'snow' || kind === 'storm') &&
        [0, 1, 2, 3].map((i) => (
          <g
            key={i}
            className="cloud"
            style={{ animationDelay: `${i * -8}s`, animationDuration: `${28 + i * 6}s` }}
            opacity={kind === 'partly' ? 0.5 : 0.75}
          >
            <ellipse cx={140 + i * 180} cy={70 + (i % 2) * 46} rx={54 + (i % 3) * 12} ry={16} fill="#FFFFFF" />
            <ellipse cx={170 + i * 180} cy={62 + (i % 2) * 46} rx={38} ry={14} fill="#FFFFFF" />
          </g>
        ))}

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

      {/* 天气压暗 */}
      {dim > 0 && <rect width="720" height="400" fill="#3D4757" opacity={dim} />}

      {/* 雨 */}
      {(kind === 'rain' || kind === 'storm') &&
        Array.from({ length: 14 }).map((_, i) => {
          const x = prand(i, 3) * 720
          const y = prand(i, 17) * 400
          return (
            <line
              key={i}
              className="rain-drop"
              style={{ animationDelay: `${prand(i, 23) * 1.1}s`, animationDuration: `${0.8 + prand(i, 41) * 0.5}s` }}
              x1={x}
              y1={y}
              x2={x - 5}
              y2={y + 16}
              stroke="#BBD3EA"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.65"
            />
          )
        })}

      {/* 雪 */}
      {kind === 'snow' &&
        Array.from({ length: 16 }).map((_, i) => (
          <circle
            key={i}
            className="snow-flake"
            style={{ animationDelay: `${prand(i, 5) * 6}s`, animationDuration: `${5 + prand(i, 11) * 3}s` }}
            cx={prand(i, 43) * 720}
            cy={prand(i, 47) * 400}
            r={2 + prand(i, 53) * 2.5}
            fill="#FFFFFF"
            opacity="0.85"
          />
        ))}

      {/* 雾 */}
      {kind === 'fog' &&
        [0, 1, 2].map((i) => (
          <ellipse
            key={i}
            className="fog-band"
            style={{ animationDelay: `${i * -14}s` }}
            cx={180 + i * 200}
            cy={180 + i * 70}
            rx={300}
            ry={46}
            fill="#E8ECF2"
            opacity="0.3"
          />
        ))}

      {/* 雷电闪光 */}
      {kind === 'storm' && <rect className="lightning" width="720" height="400" fill="#FFFFFF" />}
    </svg>
  )
}
