import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { FavoritePaper, Paper, Settings, DEFAULT_SETTINGS } from '../types'
import { loadSettings, saveSettings as saveSettingsToStorage } from '../utils/storage'

const FAVORITES_KEY = 'paperscout_favorites'

function loadFavorites(): FavoritePaper[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function saveFavorites(favs: FavoritePaper[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs))
}

interface AppContextType {
  favorites: FavoritePaper[]
  settings: Settings
  addFavorite: (paper: Paper) => void
  removeFavorite: (paperId: string) => void
  isFavorite: (paperId: string) => boolean
  updateNote: (paperId: string, note: string) => void
  updateTags: (paperId: string, tags: string[]) => void
  updateSettings: (settings: Settings) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoritePaper[]>(loadFavorites)
  const [settings, setSettings] = useState<Settings>(loadSettings)

  useEffect(() => { saveFavorites(favorites) }, [favorites])
  useEffect(() => { saveSettingsToStorage(settings) }, [settings])

  const addFavorite = useCallback((paper: Paper) => {
    setFavorites(prev => {
      if (prev.some(f => f.paper.id === paper.id)) return prev
      return [{ paper, note: '', tags: [], addedAt: Date.now() }, ...prev]
    })
  }, [])

  const removeFavorite = useCallback((paperId: string) => {
    setFavorites(prev => prev.filter(f => f.paper.id !== paperId))
  }, [])

  const isFavorite = useCallback((paperId: string) => {
    return favorites.some(f => f.paper.id === paperId)
  }, [favorites])

  const updateNote = useCallback((paperId: string, note: string) => {
    setFavorites(prev => prev.map(f =>
      f.paper.id === paperId ? { ...f, note } : f
    ))
  }, [])

  const updateTags = useCallback((paperId: string, tags: string[]) => {
    setFavorites(prev => prev.map(f =>
      f.paper.id === paperId ? { ...f, tags } : f
    ))
  }, [])

  const updateSettings = useCallback((s: Settings) => {
    setSettings(s)
  }, [])

  return (
    <AppContext.Provider value={{
      favorites, settings,
      addFavorite, removeFavorite, isFavorite,
      updateNote, updateTags, updateSettings,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
