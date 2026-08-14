import { Paper, Settings } from '../types'

const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions'

export async function scoreRelevance(
  query: string,
  papers: Paper[],
  settings: Settings
): Promise<Map<string, number>> {
  if (!settings.apiKey || papers.length === 0) {
    return new Map()
  }

  // Batch papers into groups of 10 to avoid token limits
  const batchSize = 10
  const scores = new Map<string, number>()

  for (let i = 0; i < papers.length; i += batchSize) {
    const batch = papers.slice(i, i + batchSize)

    const papersText = batch.map((p, idx) => {
      return `${idx + 1}. Title: ${p.title}\n   Authors: ${p.authors.slice(0, 3).join(', ')}\n   Abstract: ${p.abstract.slice(0, 500)}\n   Year: ${p.year || 'Unknown'}\n   Venue: ${p.venue || 'Unknown'}`
    }).join('\n\n')

    try {
      const res = await fetch(DEEPSEEK_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.model || 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `你是一个学术论文相关性评估专家。用户会提供一个搜索查询和一批论文列表。你需要评估每篇论文与查询的相关度，给出0-100的分数。100表示完全相关，0表示完全不相关。

评估标准：
- 标题和摘要与查询主题的直接匹配度
- 研究方法和领域的相关性
- 关键词覆盖程度

请只输出JSON数组，格式为：[{"index": 1, "score": 85}, {"index": 2, "score": 60}, ...]
不要输出任何其他文字。`,
            },
            {
              role: 'user',
              content: `Search query: "${query}"\n\nPapers:\n${papersText}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || '评分请求失败')
      }

      const data = await res.json()
      const content = data.choices[0]?.message?.content || ''

      // Parse JSON response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const results = JSON.parse(jsonMatch[0])
        for (const result of results) {
          if (result.index && typeof result.score === 'number') {
            const paperIndex = i + result.index - 1
            if (batch[paperIndex]) {
              scores.set(batch[paperIndex].id, Math.max(0, Math.min(100, result.score)))
            }
          }
        }
      }
    } catch (e) {
      console.error('AI scoring error:', e)
      // Assign default scores based on keyword matching
      for (const paper of batch) {
        scores.set(paper.id, calculateKeywordScore(query, paper))
      }
    }
  }

  return scores
}

function calculateKeywordScore(query: string, paper: Paper): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  const text = `${paper.title} ${paper.abstract} ${paper.categories.join(' ')}`.toLowerCase()

  let matches = 0
  for (const word of queryWords) {
    if (text.includes(word)) matches++
  }

  return Math.round((matches / queryWords.length) * 100)
}
