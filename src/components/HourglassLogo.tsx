// 沙漏 Logo：progress 0~1 控制沙子位置（0=全部在上腔，1=全部漏到下腔）
// 沙体不用 clipPath 裁剪，而是按漏斗梯形直接计算多边形顶点——
// 部分手机浏览器对「clipPath 引用 + 动画元素」组合渲染有 bug（裁剪失效导致沙子溢出玻璃），
// 纯多边形渲染在所有浏览器上都可靠。
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
  const topSandH = 51 * (1 - p)
  const bottomSandH = 51 * p

  // 上腔：梯形 (19,22)-(101,22)-(66,73)-(54,73)，沙占上部
  // 左缘 x = 19 + 35*(y-22)/51，右缘 x = 101 - 35*(y-22)/51
  const yTop = 73 - topSandH
  let topPoints: string
  if (yTop <= 22) {
    topPoints = '19,22 101,22 66,73.5 54,73.5'
  } else {
    const xL = 19 + (35 * (yTop - 22)) / 51
    const xR = 101 - (35 * (yTop - 22)) / 51
    topPoints = `${xL.toFixed(2)},${yTop.toFixed(2)} ${xR.toFixed(2)},${yTop.toFixed(2)} 66,73.5 54,73.5`
  }

  // 下腔：梯形 (54,77)-(66,77)-(101,128)-(19,128)，沙占下部
  // 左缘 x = 54 - 35*(y-77)/51，右缘 x = 66 + 35*(y-77)/51
  const yBot = 128 - bottomSandH
  let bottomPoints: string
  if (yBot <= 77) {
    bottomPoints = '54,77 66,77 101,128.5 19,128.5'
  } else {
    const xL = 54 - (35 * (yBot - 77)) / 51
    const xR = 66 + (35 * (yBot - 77)) / 51
    bottomPoints = `${xL.toFixed(2)},${yBot.toFixed(2)} ${xR.toFixed(2)},${yBot.toFixed(2)} 101,128.5 19,128.5`
  }

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
      {/* 玻璃外框 */}
      <path
        d="M25 16 h70 v10 c0 26 -30 32 -30 48 c0 16 30 22 30 48 v10 h-70 v-10 c0 -26 30 -32 30 -48 c0 -16 -30 -22 -30 -48 z"
        className="hg-glass"
      />
      {/* 上腔沙（梯形多边形，随 progress 收缩） */}
      <polygon points={topPoints} className="hg-sand" />
      {/* 沙流 */}
      {p > 0 && p < 1 && <rect x="57.5" y="70" width="5" height="13" className="hg-sand hg-stream" />}
      {/* 下腔沙（梯形多边形，随 progress 增长） */}
      <polygon points={bottomPoints} className="hg-sand" />
    </svg>
  )
}
