// 沙漏 Logo：progress 0~1 控制沙子位置（0=全部在上腔，1=全部漏到下腔）
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
  return (
    <svg
      width={size}
      height={size * 1.25}
      viewBox="0 0 120 150"
      className={className}
      role="img"
      aria-label="沙漏"
    >
      <defs>
        <clipPath id="hg-top">
          <polygon points="19,22 101,22 66,73 54,73" />
        </clipPath>
        <clipPath id="hg-bottom">
          <polygon points="54,77 66,77 101,128 19,128" />
        </clipPath>
      </defs>
      {/* 木架 */}
      <rect x="12" y="4" width="96" height="12" rx="4" className="hg-wood" />
      <rect x="12" y="134" width="96" height="12" rx="4" className="hg-wood" />
      {/* 玻璃外框 */}
      <path
        d="M25 16 h70 v10 c0 26 -30 32 -30 48 c0 16 30 22 30 48 v10 h-70 v-10 c0 -26 30 -32 30 -48 c0 -16 -30 -22 -30 -48 z"
        className="hg-glass"
      />
      {/* 上腔沙 */}
      <g clipPath="url(#hg-top)">
        <rect x="19" y={73 - topSandH} width="82" height={topSandH + 1} className="hg-sand" />
      </g>
      {/* 沙流 */}
      {p > 0 && p < 1 && <rect x="57.5" y="70" width="5" height="13" className="hg-sand hg-stream" />}
      {/* 下腔沙 */}
      <g clipPath="url(#hg-bottom)">
        <rect x="19" y={128 - bottomSandH} width="82" height={bottomSandH + 1} className="hg-sand" />
      </g>
    </svg>
  )
}
