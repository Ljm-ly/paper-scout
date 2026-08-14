import React, { useState, useRef, useEffect } from 'react'
import { Search, Sparkles, X, Loader2 } from 'lucide-react'

interface SearchBarProps {
  onSearch: (query: string) => void
  onRelatedSearch: (keyword: string) => void
  loading: boolean
}

export default function SearchBar({ onSearch, onRelatedSearch, loading }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [relatedKeywords, setRelatedKeywords] = useState<string[]>([])
  const [showRelated, setShowRelated] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
      setShowRelated(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowRelated(false)
    }
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all">
          <Search className="ml-4 w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入论文主题、关键词或研究方向..."
            className="flex-1 px-4 py-4 text-lg outline-none bg-transparent text-gray-800 placeholder-gray-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setShowRelated(false) }}
              className="p-2 mr-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-4 bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            搜索
          </button>
        </div>
      </form>

      <p className="text-center text-sm text-gray-500 mt-3">
        输入任意关键词，从 arXiv、Semantic Scholar、OpenAlex、CrossRef 搜索论文
      </p>
    </div>
  )
}
