export interface Paper {
  id: string
  title: string
  authors: string[]
  abstract: string
  year: number | null
  venue: string
  url: string
  pdfUrl: string | null
  doi: string | null
  citationCount: number
  source: 'arxiv' | 'semantic_scholar' | 'openalex' | 'crossref'
  sourceId: string
  categories: string[]
  translatedTitle?: string
  translatedAbstract?: string
}

export interface SearchFilters {
  yearFrom: number | null
  yearTo: number | null
  source: string | null
  minCitations: number | null
}

export interface FavoritePaper {
  paper: Paper
  note: string
  tags: string[]
  addedAt: number
}

export interface SearchResult {
  papers: Paper[]
  total: number
  nextCursor: string | null
}

export type TabType = 'search' | 'favorites' | 'settings'

export interface Settings {
  corsProxy: string
  openaiKey: string
  openaiModel: string
  translateEnabled: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  corsProxy: 'https://corsproxy.io/?',
  openaiKey: '',
  openaiModel: 'gpt-4o-mini',
  translateEnabled: true,
}
