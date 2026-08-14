import React, { useState } from 'react'
import { Star, Trash2, Edit3, X, Check, Tag, Search, BookOpen } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Paper } from '../types'

interface FavoritesPanelProps {
  onSelectPaper: (paper: Paper) => void
}

export default function FavoritesPanel({ onSelectPaper }: FavoritesPanelProps) {
  const { favorites, removeFavorite, updateNote, updateTags } = useApp()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNote, setEditNote] = useState('')
  const [editTags, setEditTags] = useState('')
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Get all unique tags
  const allTags = Array.from(new Set(favorites.flatMap(f => f.tags)))

  // Filter favorites
  const filtered = favorites.filter(f => {
    if (filterTag && !f.tags.includes(filterTag)) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        f.paper.title.toLowerCase().includes(q) ||
        f.paper.authors.some(a => a.toLowerCase().includes(q)) ||
        f.note.toLowerCase().includes(q) ||
        f.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    return true
  })

  const startEdit = (id: string, note: string, tags: string[]) => {
    setEditingId(id)
    setEditNote(note)
    setEditTags(tags.join(', '))
  }

  const saveEdit = (id: string) => {
    updateNote(id, editNote)
    const tags = editTags.split(',').map(t => t.trim()).filter(Boolean)
    updateTags(id, tags)
    setEditingId(null)
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-16">
        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-400 mb-2">收藏夹为空</h3>
        <p className="text-gray-400">搜索论文并点击星标按钮来收藏</p>
      </div>
    )
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center bg-white rounded-lg border border-gray-200 px-3 py-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索收藏的论文..."
            className="flex-1 outline-none text-sm bg-transparent"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-gray-500 mr-1">标签:</span>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
                  filterTag === tag
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <span className="text-sm text-gray-500">{filtered.length} 篇论文</span>
      </div>

      {/* Favorites list */}
      <div className="grid gap-4">
        {filtered.map(fav => (
          <div
            key={fav.paper.id}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3
                  onClick={() => onSelectPaper(fav.paper)}
                  className="font-semibold text-gray-900 hover:text-primary-700 cursor-pointer line-clamp-2"
                >
                  {fav.paper.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {fav.paper.authors.slice(0, 3).join(', ')}
                  {fav.paper.year && ` (${fav.paper.year})`}
                </p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {editingId === fav.paper.id ? (
                  <>
                    <button
                      onClick={() => saveEdit(fav.paper.id)}
                      className="p-1.5 rounded-lg text-green-600 hover:bg-green-50"
                      title="保存"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50"
                      title="取消"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(fav.paper.id, fav.note, fav.tags)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50"
                      title="编辑笔记"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFavorite(fav.paper.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                      title="取消收藏"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Note */}
            {editingId === fav.paper.id ? (
              <div className="mt-3 space-y-2">
                <textarea
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  placeholder="添加阅读笔记..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary-400 resize-none"
                  rows={3}
                />
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={editTags}
                    onChange={e => setEditTags(e.target.value)}
                    placeholder="标签（逗号分隔）"
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary-400"
                  />
                </div>
              </div>
            ) : (
              <>
                {fav.note && (
                  <p className="text-sm text-gray-600 mt-2 bg-yellow-50 px-3 py-2 rounded-lg border-l-2 border-yellow-300">
                    {fav.note}
                  </p>
                )}
                {fav.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {fav.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
