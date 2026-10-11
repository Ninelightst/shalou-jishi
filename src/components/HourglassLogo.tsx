// 沙漏 Logo：progress 0~1 控制沙子位置（0=全部在上腔，1=全部漏到下腔）
// 玻璃轮廓是三次贝塞尔曲线；沙堆多边形按同一条曲线采样生成，与玻璃精确嵌合。
// 不用任何浏览器裁剪功能（部分手机浏览器对 clipPath + 动画有渲染 bug），纯多边形渲染。

const SEG = 20 // 每条曲线采样段数（误差 <0.1 单位，显示时 <0.1px）

type Pt = [number, number]

// 三次贝塞尔曲线采样
function bez(t: number, p0: Pt, p1: Pt, p2: Pt, p3: Pt): Pt {
  const u = 1 - t
  const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0]
  const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
  return [x, y]
}

// 玻璃描边宽 3（半宽 1.5），沙堆水平内缩 1.2，藏在描边内侧、绝不超出玻璃外缘
function curve(p0: Pt, p1: Pt, p2: Pt, p3: Pt, inset: number): Pt[] {
  const pts: Pt[] = []
  for (let i = 0; i <= SEG; i++) {
    const [x, y] = bez(i / SEG, p0, p1, p2, p3)
    pts.push([x + inset, y])
  }
  return pts
}

// 玻璃轮廓（描边中心线，与 path 的 d 完全一致）的四条曲线，内缩后即沙腔边界
const rightTop = curve([95, 26], [95, 52], [65, 58], [65, 74], -1.2) // (93.8,26) → (63.8,74)
const leftTop = curve([25, 26], [25, 52], [55, 58], [55, 74], 1.2) // (26.2,26) → (56.2,74)
const rightBottom = curve([65, 74], [65, 90], [95, 96], [95, 122], -1.2) // (63.8,74) → (93.8,122)
const leftBottom = curve([55, 74], [55, 90], [25, 96], [25, 122], 1.2) // (56.2,74) → (26.2,122)

// 完整沙腔多边形（顺时针闭合）
const TOP: Pt[] = [
  [25, 17],
  [95, 17],
  ...rightTop,
  [56.2, 74],
  ...[...leftTop].reverse(),
]
const BOTTOM: Pt[] = [
  [56.2, 74],
  [63.8, 74],
  ...rightBottom,
  [95, 131],
  [25, 131],
  ...[...leftBottom].reverse(),
]

// 用水平线把沙腔裁剪到当前沙量（Sutherland–Hodgman 半平面裁剪）
function clipByY(poly: Pt[], yCut: number, keepAbove: boolean): Pt[] {
  const out: Pt[] = []
  const inside = (y: number) => (keepAbove ? y >= yCut : y <= yCut)
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    const aIn = inside(a[1])
    const bIn = inside(b[1])
    if (aIn && bIn) out.push(b)
    else if (aIn && !bIn) {
      const t = (yCut - a[1]) / (b[1] - a[1])
      out.push([a[0] + (b[0] - a[0]) * t, yCut])
    } else if (!aIn && bIn) {
      const t = (yCut - a[1]) / (b[1] - a[1])
      out.push([a[0] + (b[0] - a[0]) * t, yCut], b)
    }
  }
  return out
}

const ptsStr = (pts: Pt[]) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

export function HourglassLogo({
  size = 120,
  progress = 0.5,
  className,
}: {
  size?: number
  progress?: number
  className?: string
}) {
  const p = Math.min(1, Math.max(0, progress))
  // 上腔沙面 17→74，下腔沙面 74→131，行程同为 57
  const yTop = 74 - 57 * (1 - p)
  const yBot = 74 + 57 * p
  const topSand = clipByY(TOP, yTop, true)
  const bottomSand = clipByY(BOTTOM, yBot, false)

  return (
    <svg
      width={size}
      height={size * 1.25}
      viewBox="0 0 120 150"
      className={className}
      role="img"
      aria-label="沙漏"
    >
      {/* 木架 */}
      <rect x="12" y="4" width="96" height="12" rx="4" className="hg-wood" />
      <rect x="12" y="134" width="96" height="12" rx="4" className="hg-wood" />
      {/* 玻璃外框（与沙腔曲线同源） */}
      <path
        d="M25 16 h70 v10 c0 26 -30 32 -30 48 c0 16 30 22 30 48 v10 h-70 v-10 c0 -26 30 -32 30 -48 c0 -16 -30 -22 -30 -48 z"
        className="hg-glass"
      />
      {/* 沙流（瓶颈处，0<p<1 时可见） */}
      {p > 0 && p < 1 && <rect x="57" y="70" width="6" height="14" className="hg-sand hg-stream" />}
      {/* 上腔沙 / 下腔沙：与玻璃曲线精确嵌合的多边形 */}
      {p < 0.995 && topSand.length >= 3 && <polygon points={ptsStr(topSand)} className="hg-sand" />}
      {p > 0.005 && bottomSand.length >= 3 && <polygon points={ptsStr(bottomSand)} className="hg-sand" />}
    </svg>
  )
}
