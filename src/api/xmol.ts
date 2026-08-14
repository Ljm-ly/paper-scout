import { Paper, SearchResult, Settings } from '../types'
import { fetchWithProxy } from '../utils/storage'

// X-Mol search endpoint
const XMOL_SEARCH_URL = 'https://www.x-mol.com/paper/search'

function parseXMolHtml(html: string): Paper[] {
  const papers: Paper[] = []

  // Parse paper items from HTML
  const itemRegex = /<div\s+class="magazine-senior-search-results-list-right"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g
  let match

  while ((match = itemRegex.exec(html)) !== null) {
    const itemHtml = match[1]

    // Extract title
    const titleMatch = itemHtml.match(/class="it-bold[^"]*"[^>]*>([^<]+)</)
    const title = titleMatch ? titleMatch[1].trim() : ''

    // Extract journal/venue
    const journalMatch = itemHtml.match(/class="it-blue"[^>]*>([^<]+)</)
    const journal = journalMatch ? journalMatch[1].trim() : ''

    // Extract impact factor
    const ifMatch = itemHtml.match(/style="color:\s*#FF7010[^"]*"[^>]*>([^<]+)</)
    const impactFactor = ifMatch ? ifMatch[1].trim() : ''

    // Extract authors
    const authorMatches = itemHtml.match(/class="div-text-line-one[^"]*"[^>]*>([^<]+)</g)
    const authors = authorMatches
      ? authorMatches.map(a => {
          const m = a.match(/>([^<]+)</)
          return m ? m[1].trim() : ''
        }).filter(Boolean)
      : []

    // Extract year
    const yearMatch = itemHtml.match(/(\d{4})/)
    const year = yearMatch ? parseInt(yearMatch[1], 10) : null

    // Extract DOI
    const doiMatch = itemHtml.match(/doi\.org\/([^\s"'<>]+)/)
    const doi = doiMatch ? doiMatch[1] : null

    // Extract URL
    const urlMatch = itemHtml.match(/href="([^"]*paper\/\d+[^"]*)"/)
    const url = urlMatch ? `https://www.x-mol.com${urlMatch[1]}` : ''

    if (title) {
      papers.push({
        id: `xmol:${doi || title}`,
        title,
        authors: authors.length > 0 ? authors : ['Unknown'],
        abstract: '',
        year,
        venue: journal,
        url,
        pdfUrl: null,
        doi,
        citationCount: 0,
        source: 'xmol' as const,
        sourceId: doi || title,
        categories: impactFactor ? [`IF: ${impactFactor}`] : [],
      })
    }
  }

  return papers
}

export async function searchXMol(
  query: string,
  page: number = 0,
  settings: Settings
): Promise<SearchResult> {
  const params = new URLSearchParams({
    option: query,
    pageIndex: String(page),
  })

  const url = `${XMOL_SEARCH_URL}?${params}`
  const res = await fetchWithProxy(url, settings, {
    headers: {
      'Accept': 'text/html,application/xhtml+xml',
      'Referer': 'https://www.x-mol.com/',
    },
  })

  const html = await res.text()
  const papers = parseXMolHtml(html)

  return {
    papers,
    total: papers.length,
    nextCursor: papers.length > 0 ? String(page + 1) : null,
  }
}
