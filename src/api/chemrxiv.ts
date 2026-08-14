import { Paper, SearchResult, Settings } from '../types'
import { fetchWithProxy } from '../utils/storage'

// ChemRxiv API - chemistry preprint server
const CHEMRXIV_API = 'https://chemrxiv.org/engage/chemrxiv/public-api/v1/search'

function parseChemRxivItem(item: any): Paper {
  const title = item.title || ''
  const authors = (item.authors || []).map((a: any) => a.author?.name || a.name || '').filter(Boolean)
  const year = item.publishedDate ? new Date(item.publishedDate).getFullYear() : null
  const doi = item.doi || null
  const categories = (item.categories || []).map((c: any) => c.name || c).filter(Boolean)

  return {
    id: `chemrxiv:${item.id || doi || title}`,
    title,
    authors,
    abstract: item.abstract || '',
    year,
    venue: 'ChemRxiv',
    url: doi ? `https://doi.org/${doi}` : `https://chemrxiv.org/engage/chemrxiv/article-details/${item.id}`,
    pdfUrl: item.assets?.find?.((a: any) => a.kind === 'preprint')?.url || null,
    doi,
    citationCount: 0,
    source: 'chemrxiv' as const,
    sourceId: item.id || '',
    categories,
  }
}

export async function searchChemRxiv(
  query: string,
  skip: number = 0,
  limit: number = 20,
  settings: Settings
): Promise<SearchResult> {
  const body = {
    term: query,
    skip,
    limit,
    sort: 'relevance',
  }

  const res = await fetchWithProxy(CHEMRXIV_API, settings, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  const items = data.itemHits || data.items || []
  const total = data.total || items.length

  return {
    papers: items.map((item: any) => parseChemRxivItem(item.item || item)),
    total: typeof total === 'number' ? total : parseInt(total, 10) || 0,
    nextCursor: skip + limit < (typeof total === 'number' ? total : parseInt(total, 10) || 0)
      ? String(skip + limit) : null,
  }
}
