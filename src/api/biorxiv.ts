import { Paper, SearchResult, Settings } from '../types'
import { fetchWithProxy } from '../utils/storage'

// bioRxiv API - biology/medicine preprint server
const BIORXIV_API = 'https://api.biorxiv.org/details/biorxiv'

function parseBioRxivItem(item: any): Paper {
  const title = item.title || ''
  const authors = (item.authors || '')
    .split(';')
    .map((a: string) => a.trim())
    .filter(Boolean)
  const year = item.date ? new Date(item.date).getFullYear() : null
  const doi = item.doi || null
  const jatsxml = item.jatsxml || ''

  return {
    id: `biorxiv:${item.doi || item.jatsxml || title}`,
    title,
    authors,
    abstract: item.abstract || '',
    year,
    venue: 'bioRxiv',
    url: doi ? `https://doi.org/${doi}` : '',
    pdfUrl: null,
    doi,
    citationCount: 0,
    source: 'biorxiv' as const,
    sourceId: item.doi || '',
    categories: item.category ? [item.category] : [],
  }
}

export async function searchBioRxiv(
  query: string,
  page: number = 0,
  perPage: number = 20,
  settings: Settings
): Promise<SearchResult> {
  // bioRxiv doesn't have a direct search endpoint, use the details endpoint
  // with a query filter. We search recent papers.
  const url = `${BIORXIV_API}/${page * perPage}/${perPage}`
  
  try {
    const res = await fetchWithProxy(url, settings)
    const data = await res.json()
    const items = data.collection || []
    
    // Filter by query in title/abstract (client-side since API doesn't support search)
    const queryLower = query.toLowerCase()
    const filtered = items.filter((item: any) => {
      const text = `${item.title || ''} ${item.abstract || ''}`.toLowerCase()
      return queryLower.split(/\s+/).some(word => text.includes(word))
    })

    return {
      papers: filtered.map(parseBioRxivItem),
      total: filtered.length,
      nextCursor: items.length === perPage ? String(page + 1) : null,
    }
  } catch {
    return { papers: [], total: 0, nextCursor: null }
  }
}
