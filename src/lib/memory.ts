import type { MemoryAdoption, MemoryEntry, Segment } from './types'

/** 低于该相似度的旧译文不出现在建议里 */
export const MEMORY_SIMILARITY_THRESHOLD = 0.3
/** 建议列表最多保留的条目数 */
export const MEMORY_MAX_SUGGESTIONS = 5
/** 建议中展示的命中关键词上限 */
export const MEMORY_KEYWORD_LIMIT = 6

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'before', 'begin', 'but', 'by',
  'can', 'cannot', 'could', 'did', 'do', 'does', 'during', 'final', 'finally', 'first',
  'for', 'from', 'had', 'has', 'have', 'he', 'how', 'if', 'in', 'into', 'is', 'it',
  'its', 'last', 'may', 'might', 'must', 'my', 'next', 'no', 'not', 'of', 'on', 'once',
  'or', 'other', 'our', 'out', 'over', 'please', 'previous', 'second', 'shall', 'she',
  'should', 'so', 'start', 'step', 'than', 'that', 'the', 'their', 'them', 'then',
  'third', 'this', 'those', 'through', 'to', 'up', 'use', 'used', 'uses', 'using',
  'was', 'we', 'were', 'when', 'where', 'which', 'while', 'will', 'with', 'you', 'your',
])

/** 轻量词干还原，去掉常见英文后缀以便 privileges/privilege 等词命中 */
const stem = (word: string): string => {
  if (word.length > 5 && word.endsWith('ies')) return word.slice(0, -3) + 'y'
  if (word.length > 4 && /(ss|i|s|x|z|ch|sh)es$/.test(word)) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('es')) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('s')) return word.slice(0, -1)
  if (word.length > 6 && word.endsWith('ing')) return word.slice(0, -3)
  if (word.length > 5 && word.endsWith('ed')) return word.slice(0, -2)
  return word
}

const placeholderPattern = /\{\{[^{}]+\}\}|\{[A-Za-z_][\w.-]*\}|%\([^)]+\)[sd]|%[sd]/g
const wordPattern = /[a-z0-9][a-z0-9'-]*/g

export interface TokenInfo {
  /** 参与相似度计算的词干（占位符整体保留） */
  stem: string
  /** 用于展示的原文词 */
  raw: string
}

/** 切分源文：Markdown 噪声去掉，占位符整体保留，连字符词拆开以扩大命中 */
export const tokenizeSource = (text: string): TokenInfo[] => {
  const normalized = ` ${text.toLowerCase().replace(placeholderPattern, ' $& ')} `
  const tokens: TokenInfo[] = []
  for (const rawMatch of normalized.matchAll(wordPattern)) {
    const raw = rawMatch[0]
    const parts = raw.split('-')
    for (const part of parts) {
      const clean = part.replace(/^'+|'+$/g, '')
      if (clean.length < 2) continue
      tokens.push({ stem: stem(clean), raw: clean })
    }
  }
  for (const placeholder of normalized.matchAll(placeholderPattern)) {
    tokens.push({ stem: placeholder[0], raw: placeholder[0] })
  }
  return tokens
}

/** 去掉停用词后的关键词（保留占位符），stem -> 展示词 */
const keywordSet = (text: string): Map<string, string> => {
  const keywords = new Map<string, string>()
  for (const token of tokenizeSource(text)) {
    if (!STOPWORDS.has(token.raw) || token.stem.startsWith('{')) keywords.set(token.stem, token.raw)
  }
  return keywords
}

const fullStemSet = (text: string): Set<string> => new Set(tokenizeSource(text).map((token) => token.stem))

/** Sørensen–Dice 系数：2|A∩B| / (|A|+|B|) */
const dice = (a: Set<string>, b: Set<string>): number => {
  if (!a.size || !b.size) return 0
  let overlap = 0
  for (const value of a) if (b.has(value)) overlap += 1
  return (2 * overlap) / (a.size + b.size)
}

export interface MemorySuggestion {
  entry: MemoryEntry
  /** 0-1 的综合相似度 */
  score: number
  /** 0-100，用于展示 */
  percent: number
  level: 'high' | 'medium' | 'low'
  matchedKeywords: string[]
  matchedPlaceholders: string[]
}

export const scoreMemoryEntry = (sourceText: string, entry: MemoryEntry): MemorySuggestion | null => {
  const queryKeywords = keywordSet(sourceText)
  const entryKeywords = keywordSet(entry.sourceText)
  if (!queryKeywords.size || !entryKeywords.size) return null

  const sharedStems: string[] = []
  for (const stemValue of queryKeywords.keys()) {
    if (entryKeywords.has(stemValue)) sharedStems.push(stemValue)
  }
  const keywordScore = dice(new Set(queryKeywords.keys()), new Set(entryKeywords.keys()))
  const fullScore = dice(fullStemSet(sourceText), fullStemSet(entry.sourceText))
  // 关键词决定语义相似度，全部词（含停用词）抑制“只剩虚词一致”的误报
  const score = keywordScore * 0.7 + fullScore * 0.3
  if (score < MEMORY_SIMILARITY_THRESHOLD) return null

  const matchedPlaceholders = sharedStems.filter((stemValue) => stemValue.startsWith('{'))
  const matchedKeywords = sharedStems
    .filter((stemValue) => !stemValue.startsWith('{'))
    .map((stemValue) => queryKeywords.get(stemValue) ?? entryKeywords.get(stemValue) ?? stemValue)
    .slice(0, MEMORY_KEYWORD_LIMIT)

  const percent = sourceText.trim() === entry.sourceText.trim() ? 100 : Math.round(score * 100)
  const level: MemorySuggestion['level'] = score >= 0.65 ? 'high' : score >= 0.4 ? 'medium' : 'low'
  return { entry, score, percent, level, matchedKeywords, matchedPlaceholders }
}

/** 列出与片段源文相似的可复用旧译文，按相似度降序；停用的条目不参与 */
export const suggestMemoryEntries = (segment: Segment, entries: MemoryEntry[]): MemorySuggestion[] =>
  entries
    .filter((entry) => !entry.disabled)
    .map((entry) => scoreMemoryEntry(segment.sourceText, entry))
    .filter((suggestion): suggestion is MemorySuggestion => suggestion !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, MEMORY_MAX_SUGGESTIONS)

/** 判断采用记录是否对不上当前源文（源文后来被改动） */
export const isAdoptionStale = (segment: Segment): boolean => {
  const adoption = segment.memoryAdoption
  return !!adoption && adoption.sourceSnapshot.trim() !== segment.sourceText.trim()
}

/** 重新基于当前源文计算建议，并标出先前采用的那条 */
export const suggestionsForSegment = (
  segment: Segment,
  entries: MemoryEntry[],
): { suggestions: MemorySuggestion[]; stale: boolean; adoptedEntry?: MemoryEntry } => {
  const stale = isAdoptionStale(segment)
  const adoptedEntry = segment.memoryAdoption
    ? entries.find((entry) => entry.id === segment.memoryAdoption?.memoryId)
    : undefined
  return { suggestions: suggestMemoryEntries(segment, entries), stale, adoptedEntry }
}
