import React from 'react'
import { BookOpen, Quote, ExternalLink, Star, FileText, Calendar, Tag } from 'lucide-react'
import { Paper } from '../types'
import { useApp } from '../context/AppContext'

interface PaperCardProps {
  paper: Paper
  onSelect: (paper: Paper) => void
}

const SOURCE_LABELS: Record<string, string> = {
  arxiv: 'arXiv',
  semantic_scholar: 'S2',
  openalex: 'OpenAlex',
  crossref: 'CrossRef',
}

const SOURCE_COLORS: Record<string, string> = {
  arxiv: 'bg-red-100 text-red-700',
  semantic_scholar: 'bg-blue-100 text-blue-700',
  openalex: 'bg-green-100 text-green-700',
  crossref: 'bg-purple-100 text-purple-700',
}

export default function PaperCard({ paper, onSelect }: PaperCardProps) {
  const { isFavorite, addFavorite, removeFavorite } = useApp()
  const fav = isFavorite(paper.id)

  const toggleFav = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (fav) removeFavorite(paper.id)
    else addFavorite(paper)
  }

  return (
    <div
      onClick={() => onSelect(paper)}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-primary-300 transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 leading-snug group-hover:text-primary-700 transition-colors line-clamp-2 flex-1">
          {paper.title}
        </h3>
        <button
          onClick={toggleFav}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
            fav ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-300 hover:text-yellow-500'
          }`}
          title={fav ? '取消收藏' : '收藏'}
        >
          <Star className="w-5 h-5" fill={fav ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Authors */}
      <p className="text-sm text-gray-600 mb-2 line-clamp-1">
        {paper.authors.slice(0, 5).join(', ')}
        {paper.authors.length > 5 && ` +${paper.authors.length - 5}`}
      </p>

      {/* Abstract preview */}
      <p className="text-sm text-gray-500 mb-3 line-clamp-3 leading-relaxed">
        {paper.abstract || '暂无摘要'}
      </p>

      {/* Meta */}
      <div className="flex items-center flex-wrap gap-2 text-xs">
        <span className={`px-2 py-0.5 rounded-full font-medium ${SOURCE_COLORS[paper.source]}`}>
          {SOURCE_LABELS[paper.source]}
        </span>

        {paper.year && (
          <span className="flex items-center gap-1 text-gray-500">
            <Calendar className="w-3 h-3" /> {paper.year}
          </span>
        )}

        {paper.citationCount > 0 && (
          <span className="flex items-center gap-1 text-gray-500">
            <Quote className="w-3 h-3" /> {paper.citationCount} 引用
          </span>
        )}

        {paper.pdfUrl && (
          <span className="flex items-center gap-1 text-green-600">
            <FileText className="w-3 h-3" /> PDF
          </span>
        )}

        {paper.categories.length > 0 && (
          <span className="flex items-center gap-1 text-gray-400">
            <Tag className="w-3 h-3" /> {paper.categories[0]}
          </span>
        )}
      </div>
    </div>
  )
}
