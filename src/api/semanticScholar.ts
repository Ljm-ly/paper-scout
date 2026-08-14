import { Paper, SearchResult } from '../types'
import { fetchWithProxy } from '../utils/storage'
import type { Settings } from '../types'

const S2_API = 'https://api.semanticscholar.org/graph/v1'
const FIELDS = 'paperId,title,abstract,year,venue,citationCount,authors,url,openAccessPdf,externalIds,fieldsOfStudy'

function parseS2Paper(item: any): Paper {
  const pdfUrl = item.openAccessPdf?.url || null
  const doi = item.externalIds?.DOI || null

  return {
    id: `s2:${item.paperId}`,
    title: item.title || '',
    authors: (item.authors || []).map((a: any) => a.name || '').filter(Boolean),
    abstract: item.abstract || '',
    year: item.year || null,
    venue: item.venue || '',
    url: item.url || (doi ? `https://doi.org/${doi}` : ''),
    pdfUrl,
    doi,
    citationCount: item.citationCount || 0,
    source: 'semantic_scholar' as const,
    sourceId: item.paperId,
    categories: item.fieldsOfStudy || [],
  }
}

export async function searchSemanticScholar(
  query: string,
  offset: number = 0,
  limit: number = 20,
  settings: Settings
): Promise<SearchResult> {
  // Use bulk search endpoint (less restrictive rate limits)
  const params = new URLSearchParams({
    query,
    offset: String(offset),
    limit: String(limit),
    fields: FIELDS,
  })

  const url = `${S2_API}/paper/search/bulk?${params}`
  
  // Retry up to 3 times with increasing delay (S2 has rate limits)
  let lastError: Error | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(r => setTimeout(r, 2000 * attempt))
      }
      const res = await fetchWithProxy(url, settings)
      
      if (res.status === 429) {
        lastError = new Error('Semantic Scholar rate limited')
        continue
      }
      
      if (!res.ok) {
        lastError = new Error(`Semantic Scholar returned ${res.status}`)
        continue
      }
      
      const data = await res.json()
      const papers = (data.data || []).map(parseS2Paper)
      const total = data.total || papers.length

      return {
        papers,
        total,
        nextCursor: offset + limit < total ? String(offset + limit) : null,
      }
    } catch (e: any) {
      lastError = e
    }
  }
  
  throw lastError || new Error('Semantic Scholar search failed')
}

export async function getRelatedPapers(
  paperId: string,
  limit: number = 10,
  settings: Settings
): Promise<Paper[]> {
  const url = `${S2_API}/paper/${paperId}/recommendations?limit=${limit}&fields=${FIELDS}`
  try {
    const res = await fetchWithProxy(url, settings)
    const data = await res.json()
    return (data.recommendedPapers || []).map(parseS2Paper)
  } catch {
    return []
  }
}

export async function getCitations(
  paperId: string,
  limit: number = 10,
  settings: Settings
): Promise<Paper[]> {
  const url = `${S2_API}/paper/${paperId}/citations?limit=${limit}&fields=${FIELDS}`
  try {
    const res = await fetchWithProxy(url, settings)
    const data = await res.json()
    return (data.data || []).map((item: any) => parseS2Paper(item.citingPaper))
  } catch {
    return []
  }
}

export async function getReferences(
  paperId: string,
  limit: number = 10,
  settings: Settings
): Promise<Paper[]> {
  const url = `${S2_API}/paper/${paperId}/references?limit=${limit}&fields=${FIELDS}`
  try {
    const res = await fetchWithProxy(url, settings)
    const data = await res.json()
    return (data.data || []).map((item: any) => parseS2Paper(item.citedPaper))
  } catch {
    return []
  }
}
