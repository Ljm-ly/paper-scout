import { Paper, SearchResult } from '../types'
import { fetchWithProxy } from '../utils/storage'
import type { Settings } from '../types'

const CROSSREF_API = 'https://api.crossref.org/works'

function parseCrossrefWork(item: any): Paper {
  const doi = item.DOI || ''
  const authors = (item.author || []).map((a: any) => {
    const parts = [a.given, a.family].filter(Boolean)
    return parts.join(' ')
  }).filter(Boolean)

  const year = item.published?.['date-parts']?.[0]?.[0]
    || item['published-print']?.['date-parts']?.[0]?.[0]
    || item['published-online']?.['date-parts']?.[0]?.[0]
    || null

  return {
    id: `cr:${doi}`,
    title: Array.isArray(item.title) ? item.title[0] || '' : item.title || '',
    authors,
    abstract: (item.abstract || '').replace(/<[^>]*>/g, '').trim(),
    year,
    venue: Array.isArray(item['container-title']) ? item['container-title'][0] || '' : '',
    url: item.URL || (doi ? `https://doi.org/${doi}` : ''),
    pdfUrl: item.link?.find?.((l: any) => l['content-type'] === 'application/pdf')?.URL || null,
    doi,
    citationCount: item['is-referenced-by-count'] || 0,
    source: 'crossref' as const,
    sourceId: doi,
    categories: item.subject || [],
  }
}

export async function searchCrossref(
  query: string,
  offset: number = 0,
  rows: number = 20,
  settings: Settings
): Promise<SearchResult> {
  const params = new URLSearchParams({
    query,
    offset: String(offset),
    rows: String(rows),
    sort: 'relevance',
    order: 'desc',
    select: 'DOI,title,author,abstract,published,container-title,URL,link,subject,is-referenced-by-count',
  })

  const url = `${CROSSREF_API}?${params}`
  const res = await fetchWithProxy(url, settings)
  const data = await res.json()

  const items = data.message?.items || []
  const total = data.message?.['total-results'] || items.length

  return {
    papers: items.map(parseCrossrefWork),
    total: typeof total === 'string' ? parseInt(total, 10) : total,
    nextCursor: offset + rows < (typeof total === 'number' ? total : parseInt(total, 10))
      ? String(offset + rows) : null,
  }
}
