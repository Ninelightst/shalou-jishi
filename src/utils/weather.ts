// 天气：Open-Meteo 免费接口（无需密钥）。离线/失败时回退到本地缓存，不影响应用其他功能。

export interface WeatherNow {
  temp: number
  code: number
  isDay: boolean
  city: string
  updatedAt: number
}

// WMO 天气代码 → 显示与场景效果
export const WMO_LABEL: Record<number, string> = {
  0: '晴',
  1: '大部晴朗',
  2: '多云',
  3: '阴',
  45: '雾', 48: '雾凇',
  51: '毛毛雨', 53: '毛毛雨', 55: '毛毛雨', 56: '冻雨', 57: '冻雨',
  61: '小雨', 63: '中雨', 65: '大雨', 66: '冻雨', 67: '冻雨',
  71: '小雪', 73: '中雪', 75: '大雪', 77: '雪粒', 85: '阵雪', 86: '阵雪',
  80: '阵雨', 81: '阵雨', 82: '强阵雨',
  95: '雷暴', 96: '雷暴伴冰雹', 99: '雷暴伴冰雹',
}

export function weatherKind(code: number): 'sunny' | 'partly' | 'overcast' | 'fog' | 'rain' | 'snow' | 'storm' {
  if (code === 0) return 'sunny'
  if (code === 1 || code === 2) return 'partly'
  if (code === 3) return 'overcast'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 71 && code <= 77) return 'snow'
  if (code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'storm'
  return 'rain'
}

const CACHE_KEY = 'hourglass-weather'

export function loadWeatherCache(): WeatherNow | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const d = JSON.parse(raw) as WeatherNow
    // 缓存超过 3 小时视为过期（仍可显示）
    return d
  } catch {
    return null
  }
}

function saveWeatherCache(d: WeatherNow) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(d))
  } catch {
    /* 忽略 */
  }
}

export async function fetchWeather(city: { name: string; lat: number; lon: number }): Promise<WeatherNow> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}` +
    `&current=temperature_2m,weather_code,is_day&timezone=auto`
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const j = await res.json()
    const cur = j?.current
    if (!cur) throw new Error('无数据')
    const d: WeatherNow = {
      temp: Math.round(cur.temperature_2m),
      code: cur.weather_code,
      isDay: cur.is_day === 1,
      city: city.name,
      updatedAt: Date.now(),
    }
    saveWeatherCache(d)
    return d
  } finally {
    clearTimeout(timer)
  }
}

export interface GeoCity {
  name: string
  lat: number
  lon: number
}

export async function geocodeCity(name: string): Promise<GeoCity | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=zh`
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) return null
    const j = await res.json()
    const r = j?.results?.[0]
    if (!r) return null
    return { name: r.name, lat: r.latitude, lon: r.longitude }
  } finally {
    clearTimeout(timer)
  }
}
