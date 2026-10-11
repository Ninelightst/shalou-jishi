import { useEffect, useState } from 'react'

// 安卓 Chrome 会触发 beforeinstallprompt，可直接一键安装
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallTip() {
  const [show, setShow] = useState(false)
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)
    const dismissed = localStorage.getItem('hg-install-tip')

    // iOS 无自动安装能力，首次访问提示手动「添加到主屏幕」
    const standalone = (navigator as Navigator & { standalone?: boolean }).standalone
    if (ios && !standalone && !dismissed) {
      setShow(true)
      return
    }

    // 安卓/桌面 Chrome：等待安装提示事件
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      if (!dismissed) setShow(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt as EventListener)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt as EventListener)
  }, [])

  if (!show) return null

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    setShow(false)
  }

  function dismiss() {
    localStorage.setItem('hg-install-tip', '1')
    setShow(false)
  }

  return (
    <div className="install-tip">
      <span>
        {isIOS
          ? '💡 提示：在 Safari 中点击「分享」→「添加到主屏幕」，即可像 App 一样安装使用（支持离线）'
          : '📱 安装到手机桌面，即可像 App 一样使用，支持完全离线'}
      </span>
      {deferred ? (
        <button type="button" className="btn btn-sm btn-primary" onClick={() => void install()}>
          安装
        </button>
      ) : (
        <button type="button" className="btn btn-sm" onClick={dismiss}>
          知道了
        </button>
      )}
    </div>
  )
}
