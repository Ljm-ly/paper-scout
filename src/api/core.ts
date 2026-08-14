import { Paper, SearchResult, Settings } from '../types'
import { fetchWithProxy } from '../utils/storage'

// CORE API - world's largest open access research aggregator
const CORE_API = 'https://api.core.ac.uk/v3/search/works'

function parseCoreItem(item: any): Paper {
  const title = item.title || ''
  const authors = (item.authors || []).map((a: any) => a.name || '').filter(Boolean)
  const year = item.yearPublished || (item.datePublished ? new Date(item.datePublished).getFullYear() : null)
  const doi = item.doi || null

  return {
    id: `core:${item.id || doi || title}`,
    title,
    authors,
    abstract: item.description || item.abstract || '',
    year,
    venue: item.publisher || item.sourceFulltextUrls?.[0] || '',
    url: item.sourceFulltextUrls?.[0] || (doi ? `https://doi.org/${doi}` : ''),
    pdfUrl: item.downloadUrl || null,
    doi,
    citationCount: item.citationCount || 0,
    source: 'core' as const,
    sourceId: String(item.id || ''),
    categories: item.subjects?.slice(0, 5) || [],
  }
}

export async function searchCore(
  query: string,
  page: number = 1,
  perPage: number = 20,
  settings: Settings
): Promise<SearchResult> {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    limit: String(perPage),
    sortBy: 'relevance',
  })

  const url = `${CORE_API}?${params}`
  
  try {
    const res = await fetchWithProxy(url, settings, {
      headers: {
        'Accept': 'application/json',
      },
    })
    const data = await res.json()
    const items = data.results || []
    const total = data.totalHits || items.length

    return {
      papers: items.map(parseCoreItem),
      total,
      nextCursor: page * perPage < total ? String(page + 1) : null,
    }
  } catch {
    return { papers: [], total: 0, nextCursor: null }
  }
}
