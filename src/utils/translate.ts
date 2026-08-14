import { Settings } from '../types'

const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions'

export async function translateText(text: string, settings: Settings): Promise<string> {
  if (!settings.apiKey) {
    return '[请设置 DeepSeek API Key]'
  }

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
            content: '你是一个学术论文翻译助手。将用户提供的英文学术文本翻译成流畅、准确的中文。保持学术术语的准确性，必要时在括号中保留原文。只输出翻译结果，不要添加任何解释。',
          },
          { role: 'user', content: text },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error?.message || '翻译请求失败')
    }

    const data = await res.json()
    return data.choices[0]?.message?.content || '[翻译失败]'
  } catch (e: any) {
    return `[翻译错误] ${e.message}`
  }
}

export async function generateRelatedKeywords(query: string, settings: Settings): Promise<string[]> {
  if (!settings.apiKey) return []

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
            content: '你是一个学术研究助手。根据用户输入的研究主题或关键词，生成5-8个相关的英文学术搜索关键词。这些关键词应该涵盖该主题的不同方面和相关领域。只输出关键词列表，每行一个关键词，不要编号和其他文字。',
          },
          { role: 'user', content: query },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    })

    if (!res.ok) throw new Error('请求失败')

    const data = await res.json()
    const content = data.choices[0]?.message?.content || ''
    return content.split('\n').map((l: string) => l.trim()).filter(Boolean)
  } catch {
    return []
  }
}
