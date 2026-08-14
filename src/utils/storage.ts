import { Settings, DEFAULT_SETTINGS } from '../types'

const SETTINGS_KEY = 'paperscout_settings'
const FAVORITES_KEY = 'paperscout_favorites'

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS }
}

export function saveSettings(settings: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

// Multiple CORS proxy options for fallback
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
]

export async function fetchWithProxy(url: string, settings: Settings, options?: RequestInit): Promise<Response> {
  // Try direct first (works for APIs with CORS headers)
  try {
    const res = await fetch(url, options)
    if (res.ok) return res
  } catch {
    // Direct failed, will try proxies
  }

  // Try each proxy in order
  const proxies = settings.corsProxy
    ? [(url: string) => `${settings.corsProxy}${encodeURIComponent(url)}`]
    : CORS_PROXIES

  for (const proxyFn of proxies) {
    try {
      const proxiedUrl = proxyFn(url)
      const res = await fetch(proxiedUrl, options)
      if (res.ok) return res
    } catch {
      continue
    }
  }

  throw new Error(`无法访问: ${url}（直接访问和所有代理均失败）`)
}
