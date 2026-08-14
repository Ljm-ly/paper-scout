import { XMLParser } from 'fast-xml-parser'
import { Paper, SearchResult } from '../types'
import { fetchWithProxy } from '../utils/storage'
import type { Settings } from '../types'

const ARXIV_API = 'http://export.arxiv.org/api/query'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
})

function parseArxivEntry(entry: any): Paper {
  const id = entry.id?.split('/abs/').pop() || entry.id || ''
  const pdfUrl = entry.link?.find?.((l: any) => l['@_title'] === 'pdf')?.['@_href']
    || (typeof entry.link === 'object' && !Array.isArray(entry.link) ? entry.link['@_href'] : null)

  // Extract categories
  const categories = Array.isArray(entry.category)
    ? entry.category.map((c: any) => c['@_term']).filter(Boolean)
    : entry.category ? [entry.category['@_term']] : []

  return {
    id: `arxiv:${id}`,
    title: (entry.title || '').replace(/\s+/g, ' ').trim(),
    authors: Array.isArray(entry.author)
      ? entry.author.map((a: any) => a.name || '').filter(Boolean)
      : entry.author ? [entry.author.name || ''] : [],
    abstract: (entry.summary || '').replace(/\s+/g, ' ').trim(),
    year: entry.published ? new Date(entry.published).getFullYear() : null,
    venue: categories[0] || 'arXiv',
    url: entry.id || '',
    pdfUrl: pdfUrl || (id ? `https://arxiv.org/pdf/${id}` : null),
    doi: entry['arxiv:doi'] || entry.doi || null,
    citationCount: 0,
    source: 'arxiv' as const,
    sourceId: id,
    categories,
  }
}

export async function searchArxiv(
  query: string,
  start: number = 0,
  maxResults: number = 20,
  settings: Settings
): Promise<SearchResult> {
  const params = new URLSearchParams({
    search_query: `all:${query}`,
    start: String(start),
    max_results: String(maxResults),
    sortBy: 'relevance',
    sortOrder: 'descending',
  })

  const url = `${ARXIV_API}?${params}`
  const res = await fetchWithProxy(url, settings)
  const text = await res.text()
  const xml = parser.parse(text)

  const feed = xml.feed || {}
  const entries = Array.isArray(feed.entry) ? feed.entry : feed.entry ? [feed.entry] : []
  const total = parseInt(feed['opensearch:totalResults'] || '0', 10)

  return {
    papers: entries.map(parseArxivEntry),
    total,
    nextCursor: start + maxResults < total ? String(start + maxResults) : null,
  }
}
