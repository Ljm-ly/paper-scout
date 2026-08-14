import React, { useState, useCallback } from 'react'
import { Loader2, AlertCircle, ChevronDown, Filter } from 'lucide-react'
import { Paper, SearchFilters } from '../types'
import { useApp } from '../context/AppContext'
import { searchArxiv } from '../api/arxiv'
import { searchSemanticScholar } from '../api/semanticScholar'
import { searchOpenAlex } from '../api/openalex'
import { searchCrossref } from '../api/crossref'
import SearchBar from '../components/SearchBar'
import PaperCard from '../components/PaperCard'
import PaperDetail from '../components/PaperDetail'

export default function SearchPage() {
  const { settings } = useApp()
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)
  const [currentQuery, setCurrentQuery] = useState('')
  const [totalResults, setTotalResults] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    yearFrom: null,
    yearTo: null,
    source: null,
    minCitations: null,
  })

  const search = useCallback(async (query: string) => {
    setLoading(true)
    setError(null)
    setCurrentQuery(query)
    setPapers([])
    setTotalResults(0)

    try {
      // Search all 4 sources in parallel
      const results = await Promise.allSettled([
        searchSemanticScholar(query, 0, 20, settings),
        searchArxiv(query, 0, 20, settings),
        searchOpenAlex(query, 1, 20, settings),
        searchCrossref(query, 0, 20, settings),
      ])

      const allPapers: Paper[] = []
      let total = 0

      for (const result of results) {
        if (result.status === 'fulfilled') {
          allPapers.push(...result.value.papers)
          total += result.value.total
        }
      }

      // Deduplicate by title similarity
      const seen = new Set<string>()
      const unique = allPapers.filter(p => {
        const key = p.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      // Sort by citation count (descending)
      unique.sort((a, b) => b.citationCount - a.citationCount)

      setPapers(unique)
      setTotalResults(total)
    } catch (e: any) {
      setError(e.message || '搜索失败')
    } finally {
      setLoading(false)
    }
  }, [settings])

  // Apply filters
  const filteredPapers = papers.filter(p => {
    if (filters.source && p.source !== filters.source) return false
    if (filters.yearFrom && p.year && p.year < filters.yearFrom) return false
    if (filters.yearTo && p.year && p.year > filters.yearTo) return false
    if (filters.minCitations && p.citationCount < filters.minCitations) return false
    return true
  })

  return (
    <div>
      {/* Search bar */}
      <SearchBar onSearch={search} onRelatedSearch={search} loading={loading} />

      {/* Filters toggle */}
      {papers.length > 0 && (
        <div className="max-w-3xl mx-auto mt-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mx-auto"
          >
            <Filter className="w-4 h-4" />
            筛选条件
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 mt-3 bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">来源:</label>
                <select
                  value={filters.source || ''}
                  onChange={e => setFilters({ ...filters, source: e.target.value || null })}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-xs outline-none"
                >
                  <option value="">全部</option>
                  <option value="semantic_scholar">Semantic Scholar</option>
                  <option value="arxiv">arXiv</option>
                  <option value="openalex">OpenAlex</option>
                  <option value="crossref">CrossRef</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">年份:</label>
                <input
                  type="number"
                  placeholder="从"
                  value={filters.yearFrom || ''}
                  onChange={e => setFilters({ ...filters, yearFrom: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-xs outline-none"
                />
                <span className="text-xs text-gray-400">-</span>
                <input
                  type="number"
                  placeholder="到"
                  value={filters.yearTo || ''}
                  onChange={e => setFilters({ ...filters, yearTo: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">最少引用:</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minCitations || ''}
                  onChange={e => setFilters({ ...filters, minCitations: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-xs outline-none"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results info */}
      {currentQuery && !loading && (
        <div className="max-w-3xl mx-auto mt-4 mb-2">
          <p className="text-sm text-gray-500 text-center">
            找到 <span className="font-medium text-gray-700">{filteredPapers.length}</span> 篇相关论文
            {totalResults > 0 && <span className="text-gray-400"> (总计约 {totalResults.toLocaleString()} 篇)</span>}
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-3" />
          <p className="text-gray-500">正在从多个数据库搜索论文...</p>
          <p className="text-xs text-gray-400 mt-1">arXiv / Semantic Scholar / OpenAlex / CrossRef</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="max-w-3xl mx-auto mt-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 font-medium">搜索出错</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <p className="text-xs text-red-500 mt-2">
                提示：请检查网络连接，或在设置中调整 CORS 代理地址。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Paper grid */}
      {!loading && filteredPapers.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
          {filteredPapers.map(paper => (
            <PaperCard key={paper.id} paper={paper} onSelect={setSelectedPaper} />
          ))}
        </div>
      )}

      {/* No results */}
      {!loading && currentQuery && papers.length === 0 && !error && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">未找到相关论文</p>
          <p className="text-gray-400 text-sm mt-2">尝试使用不同的关键词或调整筛选条件</p>
        </div>
      )}

      {/* Paper detail modal */}
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
