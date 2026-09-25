'use client'

import { ArchiveRestore, Ban, BookmarkPlus, CheckCircle2, History, Lightbulb, Link2, RefreshCw, TriangleAlert, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { MemoryEntry, Segment } from '@/lib/types'
import { cn } from '@/lib/utils'
import { suggestionsForSegment, MEMORY_SIMILARITY_THRESHOLD, type MemorySuggestion } from '@/lib/memory'

interface MemoryPanelProps {
  segment?: Segment
  entries: MemoryEntry[]
  readOnly: boolean
  onApply: (entry: MemoryEntry) => void
  onToggleDisabled: (entryId: string) => void
  onSavePair: () => void
  onDismissStale: () => void
}

const levelStyle: Record<MemorySuggestion['level'], string> = {
  high: 'bg-emerald-100 text-emerald-800 border-transparent',
  medium: 'bg-amber-100 text-amber-800 border-transparent',
  low: 'bg-slate-100 text-slate-600 border-transparent',
}
const levelLabel: Record<MemorySuggestion['level'], string> = { high: '高度相似', medium: '部分相似', low: '弱相似' }

const formatTime = (timestamp: number) => new Date(timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })

export function MemoryPanel({ segment, entries, readOnly, onApply, onToggleDisabled, onSavePair, onDismissStale }: MemoryPanelProps) {
  const activeCount = entries.filter((entry) => !entry.disabled).length
  const { suggestions, stale, adoptedEntry } = segment
    ? suggestionsForSegment(segment, entries)
    : { suggestions: [], stale: false, adoptedEntry: undefined }
  const adoptedId = segment?.memoryAdoption?.memoryId
  const canSavePair = !!segment && !!segment.sourceText.trim() && !!segment.targetText.trim() && !readOnly

  return (
    <div className="space-y-3">
      {/* 当前片段的采用记录：源文改动后会标出对不上 */}
      {segment?.memoryAdoption && (
        <div className={cn('rounded-lg border p-3', stale ? 'border-amber-300 bg-amber-50' : 'border-blue-200 bg-blue-50/60')}>
          <div className="flex items-center gap-2">
            {stale ? <TriangleAlert className="h-4 w-4 shrink-0 text-amber-600" /> : <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />}
            <b className={cn('text-xs', stale ? 'text-amber-800' : 'text-blue-800')}>{stale ? '记忆源文已对不上当前源文' : '当前译文取自记忆库'}</b>
            {adoptedEntry?.disabled && <Badge variant="warning" className="ml-auto">该记忆已停用</Badge>}
          </div>
          {stale && <p className="mt-2 text-[11px] leading-5 text-amber-700">源文在采用后被修改，下方已按新源文重新给出建议，确认后可再次采用。</p>}
          <div className="mt-2 rounded-md border border-slate-200 bg-white/70 p-2">
            <p className="text-[10px] font-semibold text-slate-400">采用时的源文快照</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-600 line-clamp-3">{segment.memoryAdoption.sourceSnapshot}</p>
            {stale && <>
              <p className="mt-2 text-[10px] font-semibold text-amber-600">当前源文</p>
              <p className="mt-1 text-[11px] leading-5 text-amber-800 line-clamp-3">{segment.sourceText}</p>
            </>}
            {adoptedEntry?.source && <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-400"><History className="h-3 w-3" />{adoptedEntry.id} · {adoptedEntry.source}</p>}
          </div>
          {stale && <Button size="sm" variant="ghost" className="mt-2 h-7 w-full text-[11px] text-amber-700 hover:bg-amber-100" onClick={onDismissStale}><XCircle className="h-3.5 w-3.5" />忽略这条采用标记</Button>}
        </div>
      )}

      {/* 按源文相似度排列的可复用旧译文 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-blue-600" />
          <b className="text-xs text-slate-800">可复用旧译文</b>
          <Badge variant="secondary">{suggestions.length}</Badge>
        </div>
        <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-[11px]" disabled={!canSavePair} onClick={onSavePair} title={!segment?.targetText.trim() ? '当前片段还没有译文' : '把当前源文/译文存入记忆库'}><BookmarkPlus className="h-3.5 w-3.5" />存入当前句对</Button>
      </div>

      <div className="space-y-2">
        {suggestions.map((suggestion) => {
          const isApplied = adoptedId === suggestion.entry.id && !stale
          return (
            <div key={suggestion.entry.id} className={cn('rounded-lg border bg-white p-2.5 transition', isApplied ? 'border-blue-300 ring-1 ring-blue-200' : 'border-slate-200 hover:border-blue-300')}>
              <div className="flex items-center gap-2">
                <Badge className={cn('gap-1', levelStyle[suggestion.level])}>{stale && adoptedId === suggestion.entry.id && <RefreshCw className="h-3 w-3" />}{suggestion.percent}% · {levelLabel[suggestion.level]}</Badge>
                {isApplied && <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" />已采用</Badge>}
                {stale && adoptedId === suggestion.entry.id && <Badge variant="warning" className="gap-1"><RefreshCw className="h-3 w-3" />按新源文重算</Badge>}
                <span className="ml-auto text-[10px] text-slate-400">{suggestion.entry.source ?? '历史译文'}</span>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-slate-500 line-clamp-2">{suggestion.entry.sourceText}</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-800 line-clamp-2">{suggestion.entry.targetText}</p>
              {(suggestion.matchedKeywords.length > 0 || suggestion.matchedPlaceholders.length > 0) && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {suggestion.matchedKeywords.map((keyword) => <code key={keyword} className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700">{keyword}</code>)}
                  {suggestion.matchedPlaceholders.map((placeholder) => <code key={placeholder} className="rounded bg-violet-50 px-1.5 py-0.5 text-[10px] text-violet-700">{placeholder}</code>)}
                </div>
              )}
              <div className="mt-2 flex items-center gap-2">
                <Button size="sm" variant={isApplied ? 'secondary' : 'default'} className="h-7 px-2 text-[11px]" disabled={isApplied || readOnly} onClick={() => onApply(suggestion.entry)}><ArchiveRestore className="h-3.5 w-3.5" />{readOnly ? '审校模式不可采用' : isApplied ? '已填入当前片段' : '采用此译文'}</Button>
                <Button size="sm" variant="ghost" className="ml-auto h-7 px-2 text-[11px] text-slate-500 hover:text-red-600" onClick={() => onToggleDisabled(suggestion.entry.id)}><Ban className="h-3.5 w-3.5" />停用</Button>
              </div>
            </div>
          )
        })}
        {!suggestions.length && <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-[11px] leading-5 text-slate-400">没有相似度达到 {Math.round(MEMORY_SIMILARITY_THRESHOLD * 100)}% 的旧译文，差得远的条目不列出。</div>}
      </div>

      {/* 记忆库条目管理：可停用不想再用的条目 */}
      <div className="border-t pt-3">
        <div className="mb-2 flex items-center justify-between">
          <b className="flex items-center gap-1.5 text-xs text-slate-800"><Link2 className="h-3.5 w-3.5 text-slate-400" />共享句对记忆库</b>
          <span className="text-[10px] text-slate-400">{activeCount} 启用 / {entries.length} 条</span>
        </div>
        <div className="space-y-1.5">
          {entries.map((entry) => (
            <div key={entry.id} className={cn('flex items-start gap-2 rounded-md border px-2 py-1.5', entry.disabled ? 'border-slate-200 bg-slate-50 opacity-60' : 'border-slate-200 bg-white')}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] text-slate-500">{entry.sourceText}</p>
                <p className="truncate text-[10px] text-slate-700">{entry.targetText}</p>
                <p className="mt-0.5 text-[9px] text-slate-400">{entry.id} · {entry.source ?? '历史译文'} · {formatTime(entry.createdAt)}</p>
              </div>
              <button onClick={() => onToggleDisabled(entry.id)} className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium transition', entry.disabled ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-200 text-slate-600 hover:bg-red-100 hover:text-red-700')}>{entry.disabled ? '重新启用' : '停用'}</button>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] leading-4 text-slate-400">停用的条目不再出现在建议中；记忆库随草稿一起保存在本地。</p>
      </div>
    </div>
  )
}
