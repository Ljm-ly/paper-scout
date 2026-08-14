import { Paper, SearchResult, Settings } from '../types'
import { fetchWithProxy } from '../utils/storage'

// Europe PMC REST API - comprehensive biomedical literature
const EPMC_API = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search'

function parseEPMCResult(item: any): Paper {
  const title = item.title || ''
  const authors = item.authorList?.author
    ? (Array.isArray(item.authorList.author)
        ? item.authorList.author
        : [item.authorList.author]
      ).map((a: any) => {
        const parts = [a.firstName, a.lastName].filter(Boolean)
        return parts.join(' ')
      }).filter(Boolean)
    : []

  const year = item.pubYear ? parseInt(item.pubYear, 10) : null
  const journal = item.journalTitle || ''
  const pmid = item.pmid || ''
  const doi = item.doi || null
  const abstract = item.abstractText || ''

  // Categories from keywordList
  const categories = item.keywordList?.keyword
    ? (Array.isArray(item.keywordList.keyword)
        ? item.keywordList.keyword
        : [item.keywordList.keyword]
      ).slice(0, 5)
    : []

  return {
    id: `epmc:${pmid || doi || title}`,
    title,
    authors,
    abstract,
    year,
    venue: journal,
    url: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : (doi ? `https://doi.org/${doi}` : ''),
    pdfUrl: item.fullTextUrlList?.fullTextUrl?.find?.((u: any) => u.documentStyle === 'pdf')?.url || null,
    doi,
    citationCount: item.citedByCount || 0,
    source: 'europe_pmc' as const,
    sourceId: pmid || doi || '',
    categories,
  }
}

export async function searchEuropePMC(
  query: string,
  page: number = 1,
  pageSize: number = 20,
  settings: Settings
): Promise<SearchResult> {
  const params = new URLSearchParams({
    query,
    format: 'json',
    pageSize: String(pageSize),
    page: String(page),
    sort: 'RELEVANCE',
  })

  const url = `${EPMC_API}?${params}`
  const res = await fetchWithProxy(url, settings)
  const data = await res.json()

  const results = data.resultList?.result || []
  const total = parseInt(data.hitCount || '0', 10)

  return {
    papers: results.map(parseEPMCResult),
    total,
    nextCursor: page * pageSize < total ? String(page + 1) : null,
  }
}
