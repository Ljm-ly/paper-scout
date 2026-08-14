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

export function proxyUrl(url: string, settings: Settings): string {
  if (!settings.corsProxy) return url
  return settings.corsProxy + encodeURIComponent(url)
}

export async function fetchWithProxy(url: string, settings: Settings, options?: RequestInit): Promise<Response> {
  // Try direct first
  try {
    const res = await fetch(url, options)
    if (res.ok) return res
  } catch { /* fallback to proxy */ }

  // Try with proxy
  if (settings.corsProxy) {
    const proxied = proxyUrl(url, settings)
    return fetch(proxied, options)
  }

  throw new Error(`无法访问: ${url}`)
}
