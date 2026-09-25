import { extractProtected } from './markdown'
import type { MemoryMatch, Segment, TranslationMemoryEntry } from './types'

/** 低于该相似度的句对不进入建议列表（差得远的先不列）。 */
export const MEMORY_MIN_SCORE = 0.32
/** 达到该相似度视为高度相似。 */
export const MEMORY_HIGH_SCORE = 0.72
/** 代码块保持原样，不参与记忆建议。 */
export const MEMORY_EXCLUDED_KINDS: ReadonlySet<Segment['kind']> = new Set(['code'])
export const MEMORY_MAX_MATCHES = 6
const MAX_KEYWORDS = 6

const tokenize = (text: string): string[] =>
  text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').split(' ').filter((token) => token.length > 1)

const charBigrams = (text: string): string[] => {
  const normalized = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
  const grams: string[] = []
  for (let index = 0; index < normalized.length - 1; index += 1) grams.push(normalized.slice(index, index + 2))
  return grams
}

const dice = (left: string[], right: string[]): number => {
  if (!left.length || !right.length) return 0
  const counts = new Map<string, number>()
  for (const token of left) counts.set(token, (counts.get(token) ?? 0) + 1)
  let overlap = 0
  for (const token of right) {
    const available = counts.get(token) ?? 0
    if (available > 0) {
      overlap += 1
      counts.set(token, available - 1)
    }
  }
  return (2 * overlap) / (left.length + right.length)
}

/** 综合相似度：实义词重合为主，字符二元组兜底（容忍单复数、词序差异）。 */
export const similarityScore = (source: string, candidate: string): number => {
  const wordScore = dice(tokenize(source), tokenize(candidate))
  const charScore = dice(charBigrams(source), charBigrams(candidate))
  return Math.round((wordScore * 0.65 + charScore * 0.35) * 1000) / 1000
}

export const scoreBand = (score: number): MemoryMatch['band'] =>
  score >= MEMORY_HIGH_SCORE ? 'high' : score >= 0.5 ? 'medium' : 'low'

/** 命中的关键词：源文与记忆源文共有的实义词，外加共有的受保护占位符。 */
export const matchedKeywords = (source: string, candidate: string): string[] => {
  const sourceTokens = new Set(tokenize(source))
  const shared = new Set(tokenize(candidate).filter((token) => sourceTokens.has(token)))
  const sourceProtected = extractProtected(source)
  const candidateProtected = new Set(extractProtected(candidate))
  for (const token of sourceProtected) {
    if (candidateProtected.has(token)) shared.add(token)
  }
  return Array.from(shared).sort((a, b) => b.length - a.length).slice(0, MAX_KEYWORDS)
}

export const isMemoryEligible = (segment: Segment): boolean => !MEMORY_EXCLUDED_KINDS.has(segment.kind)

/** 按源文相似度列出可复用的记忆：仅启用条目、仅达到阈值，按分数降序。 */
export const findMemoryMatches = (segment: Segment, entries: TranslationMemoryEntry[]): MemoryMatch[] => {
  if (!isMemoryEligible(segment) || !segment.sourceText.trim()) return []
  return entries
    .filter((entry) => entry.enabled)
    .map((entry) => ({ entry, score: similarityScore(segment.sourceText, entry.sourceText) }))
    .filter(({ score }) => score >= MEMORY_MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, MEMORY_MAX_MATCHES)
    .map(({ entry, score }) => ({
      entry,
      score,
      band: scoreBand(score),
      keywords: matchedKeywords(segment.sourceText, entry.sourceText),
    }))
}

/** 采用记录是否对不上当前源文（源文后来改动）。 */
export const isAdoptionStale = (segment: Segment, memoryId: string): boolean => {
  const adoption = segment.adoptedMemories?.find((item) => item.memoryId === memoryId)
  return !!adoption && adoption.sourceAtAdoption !== segment.sourceText
}

export const staleAdoptions = (segment: Segment) =>
  (segment.adoptedMemories ?? []).filter((adoption) => adoption.sourceAtAdoption !== segment.sourceText)
