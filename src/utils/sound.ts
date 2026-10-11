let ctx: AudioContext | null = null

export function initAudio(): void {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (AC) ctx = new AC()
  }
  if (ctx && ctx.state === 'suspended') void ctx.resume()
}

// 在首次用户手势时解锁 AudioContext（iOS Safari 要求）
export function installAudioUnlock(): void {
  const unlock = () => {
    initAudio()
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('touchstart', unlock)
  }
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('touchstart', unlock)
}

// 计时结束铃声：三声叮咚（Web Audio 合成，无需音频文件）
export function playTimerRing(): void {
  initAudio()
  if (!ctx) return
  const c = ctx
  const t0 = c.currentTime
  ;[0, 0.35, 0.7].forEach((t, i) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = i === 2 ? 1046.5 : 880
    gain.gain.setValueAtTime(0, t0 + t)
    gain.gain.linearRampToValueAtTime(0.4, t0 + t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + t + 0.3)
    osc.connect(gain).connect(c.destination)
    osc.start(t0 + t)
    osc.stop(t0 + t + 0.35)
  })
}
