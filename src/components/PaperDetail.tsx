import React, { useState, useEffect } from 'react'
import { X, ExternalLink, FileText, Star, Quote, Calendar, Tag, Languages, Loader2, BookOpen, Link2 } from 'lucide-react'
import { Paper } from '../types'
import { useApp } from '../context/AppContext'
import { translateText } from '../utils/translate'
import { getRelatedPapers, getCitations, getReferences } from '../api/semanticScholar'
import PaperCard from './PaperCard'

interface PaperDetailProps {
  paper: Paper
  onClose: () => void
  onSelectPaper: (paper: Paper) => void
}

export default function PaperDetail({ paper, onClose, onSelectPaper }: PaperDetailProps) {
  const { settings, isFavorite, addFavorite, removeFavorite } = useApp()
  const fav = isFavorite(paper.id)

  const [translating, setTranslating] = useState(false)
  const [translatedAbstract, setTranslatedAbstract] = useState(paper.translatedAbstract || '')
  const [translatedTitle, setTranslatedTitle] = useState(paper.translatedTitle || '')
  const [related, setRelated] = useState<Paper[]>([])
  const [citations, setCitations] = useState<Paper[]>([])
  const [references, setReferences] = useState<Paper[]>([])
  const [loadingRelated, setLoadingRelated] = useState(false)
  const [activeTab, setActiveTab] = useState<'abstract' | 'related' | 'citations' | 'references' | 'pdf'>('abstract')

  // Load related papers for semantic scholar papers
  useEffect(() => {
    if (paper.source === 'semantic_scholar') {
      setLoadingRelated(true)
      Promise.all([
        getRelatedPapers(paper.sourceId, 8, settings),
        getCitations(paper.sourceId, 8, settings),
        getReferences(paper.sourceId, 8, settings),
      ]).then(([rel, cit, ref]) => {
        setRelated(rel)
        setCitations(cit)
        setReferences(ref)
      }).finally(() => setLoadingRelated(false))
    }
  }, [paper.sourceId])

  const handleTranslate = async () => {
    if (translatedAbstract || translatedTitle) return
    setTranslating(true)
    try {
      const [title, abs] = await Promise.all([
        paper.title ? translateText(paper.title, settings) : Promise.resolve(''),
        paper.abstract ? translateText(paper.abstract, settings) : Promise.resolve(''),
      ])
      setTranslatedTitle(title)
      setTranslatedAbstract(abs)
    } finally {
      setTranslating(false)
    }
  }

  const toggleFav = () => {
    if (fav) removeFavorite(paper.id)
    else addFavorite(paper)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto p-4 pt-8 pb-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative animate-in fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-500 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 pr-10 leading-snug">
            {translatedTitle || paper.title}
          </h2>
          {translatedTitle && paper.title && (
            <p className="text-sm text-gray-500 mt-1 italic">{paper.title}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-600">
            <span>{paper.authors.join(', ')}</span>
          </div>

          <div className="flex items-center flex-wrap gap-2 mt-3">
            {paper.year && (
              <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                <Calendar className="w-3 h-3" /> {paper.year}
              </span>
            )}
            {paper.venue && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {paper.venue}
              </span>
            )}
            {paper.citationCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                <Quote className="w-3 h-3" /> {paper.citationCount} 引用
              </span>
            )}
            {paper.categories.slice(0, 3).map(c => (
              <span key={c} className="text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                {c}
              </span>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={toggleFav}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                fav ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Star className="w-4 h-4" fill={fav ? 'currentColor' : 'none'} />
              {fav ? '已收藏' : '收藏'}
            </button>

            {settings.translateEnabled && (
              <button
                onClick={handleTranslate}
                disabled={translating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 transition-colors"
              >
                {translating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                {translating ? '翻译中...' : (translatedAbstract ? '已翻译' : '翻译摘要')}
              </button>
            )}

            {paper.pdfUrl && (
              <button
                onClick={() => setActiveTab('pdf')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
              >
                <FileText className="w-4 h-4" /> 阅读 PDF
              </button>
            )}

            {paper.url && (
              <a
                href={paper.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> 原文链接
              </a>
            )}

            {paper.doi && (
              <a
                href={`https://doi.org/${paper.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <Link2 className="w-4 h-4" /> DOI
              </a>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {[
            { key: 'abstract', label: '摘要' },
            ...(related.length > 0 || paper.source === 'semantic_scholar' ? [{ key: 'related', label: '相关推荐' }] : []),
            ...(citations.length > 0 ? [{ key: 'citations', label: `被引用 (${citations.length})` }] : []),
            ...(references.length > 0 ? [{ key: 'references', label: `参考文献 (${references.length})` }] : []),
            ...(paper.pdfUrl ? [{ key: 'pdf', label: 'PDF 阅读' }] : []),
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'abstract' && (
            <div>
              {translatedAbstract ? (
                <div>
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{translatedAbstract}</p>
                  {paper.abstract && (
                    <details className="mt-4">
                      <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">查看原文</summary>
                      <p className="text-gray-600 leading-relaxed whitespace-pre-wrap mt-2">{paper.abstract}</p>
                    </details>
                  )}
                </div>
              ) : (
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {paper.abstract || '暂无摘要'}
                </p>
              )}
            </div>
          )}

          {activeTab === 'related' && (
            <div>
              {loadingRelated ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                  <span className="ml-2 text-gray-500">加载相关推荐...</span>
                </div>
              ) : related.length > 0 ? (
                <div className="grid gap-3">
                  {related.map(p => (
                    <PaperCard key={p.id} paper={p} onSelect={onSelectPaper} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">暂无相关推荐</p>
              )}
            </div>
          )}

          {activeTab === 'citations' && (
            <div className="grid gap-3">
              {citations.map(p => (
                <PaperCard key={p.id} paper={p} onSelect={onSelectPaper} />
              ))}
            </div>
          )}

          {activeTab === 'references' && (
            <div className="grid gap-3">
              {references.map(p => (
                <PaperCard key={p.id} paper={p} onSelect={onSelectPaper} />
              ))}
            </div>
          )}

          {activeTab === 'pdf' && paper.pdfUrl && (
            <div className="w-full" style={{ height: '70vh' }}>
              <iframe
                src={paper.pdfUrl}
                className="w-full h-full rounded-lg border border-gray-200"
                title={paper.title}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
