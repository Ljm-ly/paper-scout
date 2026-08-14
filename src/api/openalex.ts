import { Paper, SearchResult } from '../types'
import { fetchWithProxy } from '../utils/storage'
import type { Settings } from '../types'

const OPENALEX_API = 'https://api.openalex.org/works'

function parseOpenAlexWork(item: any): Paper {
  const doi = item.doi?.replace('https://doi.org/', '') || null
  const pdfUrl = item.open_access?.oa_url || null
  const year = item.publication_year || null

  // Extract author names
  const authors = (item.authorships || []).map((a: any) => a.author?.display_name || '').filter(Boolean)

  // Extract concepts as categories
  const categories = (item.concepts || []).map((c: any) => c.display_name || '').filter(Boolean)

  // Reconstruct abstract from inverted index
  let abstract = ''
  if (item.abstract_inverted_index) {
    const words: [number, string][] = []
    for (const [word, positions] of Object.entries(item.abstract_inverted_index)) {
      for (const pos of positions as number[]) {
        words.push([pos, word])
      }
    }
    words.sort((a, b) => a[0] - b[0])
    abstract = words.map(w => w[1]).join(' ')
  }

  // Build best OA location URL
  const bestUrl = item.doi || item.id || ''

  return {
    id: `oa:${item.id?.replace('https://openalex.org/', '') || ''}`,
    title: item.display_name || item.title || '',
    authors,
    abstract,
    year,
    venue: item.primary_location?.source?.display_name || item.journal?.display_name || '',
    url: bestUrl,
    pdfUrl,
    doi,
    citationCount: item.cited_by_count || 0,
    source: 'openalex' as const,
    sourceId: item.id || '',
    categories,
  }
}

export async function searchOpenAlex(
  query: string,
  page: number = 1,
  perPage: number = 20,
  settings: Settings
): Promise<SearchResult> {
  const params = new URLSearchParams({
    search: query,
    'page': String(page),
    'per-page': String(perPage),
    'sort': 'relevance_score:desc',
    'mailto': 'paper-scout-user@example.com',
    select: 'id,doi,title,display_name,publication_year,authorships,primary_location,journal,abstract_inverted_index,cited_by_count,concepts,open_access',
  })

  const url = `${OPENALEX_API}?${params}`
  const res = await fetchWithProxy(url, settings)
  const data = await res.json()

  const papers = (data.results || []).map(parseOpenAlexWork)
  const total = data.meta?.count || papers.length

  return {
    papers,
    total,
    nextCursor: data.meta?.next_cursor || null,
  }
}
