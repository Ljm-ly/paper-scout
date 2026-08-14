import React, { useState } from 'react'
import { BookOpen, Search, Star, Settings } from 'lucide-react'
import { AppProvider } from './context/AppContext'
import SearchPage from './pages/SearchPage'
import FavoritesPanel from './components/FavoritesPanel'
import SettingsPanel from './components/SettingsPanel'
import PaperDetail from './components/PaperDetail'
import { Paper, TabType } from './types'

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('search')
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)

  const tabs = [
    { key: 'search' as TabType, label: '搜索', icon: Search },
    { key: 'favorites' as TabType, label: '收藏夹', icon: Star },
    { key: 'settings' as TabType, label: '设置', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">PaperScout</h1>
              <p className="text-xs text-gray-500 -mt-0.5">学术论文搜索阅读工具</p>
            </div>
          </div>

          {/* Navigation tabs */}
          <nav className="flex items-center gap-1">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'search' && <SearchPage />}
        {activeTab === 'favorites' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500" /> 我的收藏
            </h2>
            <FavoritesPanel onSelectPaper={setSelectedPaper} />
          </div>
        )}
        {activeTab === 'settings' && (
          <div>
            <SettingsPanel />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-xs text-gray-400">
          PaperScout - 数据来自 arXiv, Semantic Scholar, OpenAlex, CrossRef
        </div>
      </footer>

      {/* Paper detail modal (for favorites) */}
      {selectedPaper && (
        <PaperDetail
          paper={selectedPaper}
          onClose={() => setSelectedPaper(null)}
          onSelectPaper={setSelectedPaper}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
