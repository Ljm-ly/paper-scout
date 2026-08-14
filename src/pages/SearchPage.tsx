import React, { useState, useCallback } from 'react'
import { Loader2, AlertCircle, ChevronDown, Filter, Sparkles, CheckCircle2, XCircle } from 'lucide-react'
import { Paper, SearchFilters } from '../types'
import { useApp } from '../context/AppContext'
import { searchArxiv } from '../api/arxiv'
import { searchSemanticScholar } from '../api/semanticScholar'
import { searchOpenAlex } from '../api/openalex'
import { searchCrossref } from '../api/crossref'
import { searchEuropePMC } from '../api/europePmc'
import { searchBioRxiv } from '../api/biorxiv'
import { searchCore } from '../api/core'
import { scoreRelevance } from '../utils/aiScore'
import SearchBar from '../components/SearchBar'
import PaperCard from '../components/PaperCard'
import PaperDetail from '../components/PaperDetail'

const SOURCE_NAMES: Record<string, string> = {
  semantic_scholar: 'Semantic Scholar',
  arxiv: 'arXiv',
  openalex: 'OpenAlex',
  crossref: 'CrossRef',
  biorxiv: 'bioRxiv',
  europe_pmc: 'Europe PMC',
  core: 'CORE',
}

export default function SearchPage() {
  const { settings } = useApp()
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(false)
  const [scoring, setScoring] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)
  const [currentQuery, setCurrentQuery] = useState('')
  const [totalResults, setTotalResults] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [sortByRelevance, setSortByRelevance] = useState(false)
  const [sourceStatus, setSourceStatus] = useState<Record<string, 'success' | 'error'>>({})
  const [visibleCount, setVisibleCount] = useState(12)
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
    setSortByRelevance(false)
    setVisibleCount(12)

    try {
      const sourceKeys = ['semantic_scholar', 'arxiv', 'openalex', 'crossref', 'biorxiv', 'europe_pmc', 'core'] as const
      const searchFns = [
        searchSemanticScholar(query, 0, 10, settings),
        searchArxiv(query, 0, 10, settings),
        searchOpenAlex(query, 1, 10, settings),
        searchCrossref(query, 0, 10, settings),
        searchBioRxiv(query, 0, 10, settings),
        searchEuropePMC(query, 1, 10, settings),
        searchCore(query, 1, 10, settings),
      ]

      const results = await Promise.allSettled(searchFns)
      const status: Record<string, 'success' | 'error'> = {}
      const allPapers: Paper[] = []
      let total = 0

      results.forEach((result, i) => {
        const key = sourceKeys[i]
        if (result.status === 'fulfilled') {
          status[key] = 'success'
          allPapers.push(...result.value.papers)
          total += result.value.total
        } else {
          status[key] = 'error'
          console.warn(`${key} search failed:`, result.reason)
        }
      })

      setSourceStatus(status)

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

      // AI relevance scoring
      if (settings.aiSearchEnabled && settings.apiKey) {
        setScoring(true)
        try {
          const scores = await scoreRelevance(query, unique, settings)
          const scored = unique.map(p => ({
            ...p,
            relevanceScore: scores.get(p.id) || 0,
          }))
          scored.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
          setPapers(scored)
          setSortByRelevance(true)
        } catch (e) {
          console.error('AI scoring failed:', e)
        } finally {
          setScoring(false)
        }
      }
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
                  <option value="biorxiv">bioRxiv</option>
                  <option value="europe_pmc">Europe PMC</option>
                  <option value="core">CORE</option>
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

      {/* Source status indicators */}
      {currentQuery && !loading && Object.keys(sourceStatus).length > 0 && (
        <div className="max-w-3xl mx-auto mt-4 mb-2">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {Object.entries(sourceStatus).map(([key, status]) => (
              <span
                key={key}
                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                  status === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {status === 'success' ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                {SOURCE_NAMES[key] || key}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Results info */}
      {currentQuery && !loading && (
        <div className="max-w-3xl mx-auto mt-4 mb-2">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <p className="text-sm text-gray-500">
              找到 <span className="font-medium text-gray-700">{filteredPapers.length}</span> 篇相关论文
              {totalResults > 0 && <span className="text-gray-400"> (总计约 {totalResults.toLocaleString()} 篇)</span>}
            </p>
            {sortByRelevance && (
              <span className="flex items-center gap-1 text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                <Sparkles className="w-3 h-3" /> AI 相关度排序
              </span>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-3" />
          <p className="text-gray-500">正在从多个数据库搜索论文...</p>
          <p className="text-xs text-gray-400 mt-1">arXiv / Semantic Scholar / OpenAlex / CrossRef / bioRxiv / Europe PMC / CORE</p>
        </div>
      )}

      {/* AI Scoring */}
      {scoring && (
        <div className="flex flex-col items-center justify-center py-8">
          <Sparkles className="w-6 h-6 animate-pulse text-primary-500 mb-2" />
          <p className="text-sm text-gray-600">AI 正在评估论文相关度...</p>
          <p className="text-xs text-gray-400 mt-1">使用 DeepSeek 分析每篇论文与搜索主题的相关性</p>
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

      {/* Paper grid - only show visibleCount items */}
      {!loading && filteredPapers.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
            {filteredPapers.slice(0, visibleCount).map(paper => (
              <PaperCard key={paper.id} paper={paper} onSelect={setSelectedPaper} />
            ))}
          </div>

          {/* Load more button */}
          {visibleCount < filteredPapers.length && (
            <div className="text-center mt-6">
              <button
                onClick={() => setVisibleCount(prev => prev + 12)}
                className="px-6 py-2.5 bg-primary-50 text-primary-700 rounded-xl text-sm font-medium hover:bg-primary-100 transition-colors"
              >
                加载更多 ({filteredPapers.length - visibleCount} 篇)
              </button>
            </div>
          )}
        </>
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
