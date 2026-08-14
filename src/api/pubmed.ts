import { Paper, SearchResult, Settings } from '../types'
import { fetchWithProxy } from '../utils/storage'

const PUBMED_API = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'

function parsePubMedArticle(item: any): Paper {
  const title = item.article?.title || ''
  const authors = item.article?.authorlist?.author
    ? (Array.isArray(item.article.authorlist.author)
        ? item.article.authorlist.author
        : [item.article.authorlist.author]
      ).map((a: any) => {
        const parts = [a.forename, a.lastname].filter(Boolean)
        return parts.join(' ')
      }).filter(Boolean)
    : []

  const abstract = item.article?.abstract?.abstracttext
    ? (Array.isArray(item.article.abstract.abstracttext)
        ? item.article.abstract.abstracttext
        : [item.article.abstract.abstracttext]
      ).map((t: any) => typeof t === 'string' ? t : t._).join(' ')
    : ''

  const year = item.article?.journal?.journalissue?.pubdate?.year
    ? parseInt(item.article.journal.journalissue.pubdate.year, 10)
    : null

  const journal = item.article?.journal?.title || ''
  const pmid = item.medlinecitation?.pmid?._ || item.medlinecitation?.pmid || ''
  const doi = item.article?.elocationid?.find?.((e: any) => e['@_eidtype'] === 'doi')?._
    || item.article?.elocationid?._
    || null

  return {
    id: `pubmed:${pmid}`,
    title,
    authors,
    abstract,
    year,
    venue: journal,
    url: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : '',
    pdfUrl: null,
    doi,
    citationCount: 0,
    source: 'pubmed' as const,
    sourceId: pmid,
    categories: [],
  }
}

export async function searchPubMed(
  query: string,
  retstart: number = 0,
  retmax: number = 20,
  settings: Settings
): Promise<SearchResult> {
  // Step 1: Search for IDs
  const searchParams = new URLSearchParams({
    db: 'pubmed',
    term: query,
    retmax: String(retmax),
    retstart: String(retstart),
    retmode: 'json',
    usehistory: 'n',
  })

  const searchUrl = `${PUBMED_API}/esearch.fcgi?${searchParams}`
  const searchRes = await fetchWithProxy(searchUrl, settings)
  const searchData = await searchRes.json()

  const idList = searchData.esearchresult?.idlist || []
  const total = parseInt(searchData.esearchresult?.count || '0', 10)

  if (idList.length === 0) {
    return { papers: [], total: 0, nextCursor: null }
  }

  // Step 2: Fetch article details
  const fetchParams = new URLSearchParams({
    db: 'pubmed',
    id: idList.join(','),
    retmode: 'json',
    rettype: 'abstract',
  })

  const fetchUrl = `${PUBMED_API}/efetch.fcgi?${fetchParams}`
  const fetchRes = await fetchWithProxy(fetchUrl, settings)
  const fetchData = await fetchRes.json()

  const articles = fetchData.result?.articles || []
  const papers = articles.map(parsePubMedArticle)

  return {
    papers,
    total,
    nextCursor: retstart + retmax < total ? String(retstart + retmax) : null,
  }
}
