import { useState } from 'react'
import { useCurrentUser } from '../../common/useCurrentUser.ts'
import { loadBookmarkIds, setBookmark, useBookmarkIds } from './bookmarkState.ts'

type BookmarkButtonProps = {
  contestId: number
  onChange?: (saved: boolean) => void
  initiallySaved?: boolean
}

export function BookmarkButton(props: BookmarkButtonProps) {
  const { userId } = useCurrentUser()
  return <BookmarkControl key={`${userId}:${props.contestId}`} userId={userId} {...props} />
}

function BookmarkControl({ userId, contestId, onChange, initiallySaved }: BookmarkButtonProps & { userId: number | null }) {
  const state = useBookmarkIds(userId)
  const [error, setError] = useState<string | null>(null)
  const saved = state.ids?.has(contestId) ?? initiallySaved
  const pending = state.pending.has(contestId)

  async function toggle() {
    if (userId === null || pending) return
    setError(null)
    if (saved === undefined) {
      await loadBookmarkIds(userId)
      return
    }
    try {
      if (await setBookmark(userId, contestId, !saved)) onChange?.(!saved)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : '관심 공고를 변경하지 못했어요.')
    }
  }

  const loading = saved === undefined && !state.error
  return (
    <div>
      <button
        type="button"
        aria-pressed={saved ?? false}
        disabled={userId === null || pending || loading}
        title={userId === null ? '현재 사용자를 선택해 주세요.' : saved ? '관심 공고에서 해제' : '관심 공고에 저장'}
        onClick={() => { void toggle() }}
        className={`inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border px-3 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${saved ? 'border-brand bg-brand-soft text-brand' : 'border-line-strong bg-white text-ink-2 hover:border-brand'}`}
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 shrink-0" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
          <path d="M4 2.5h8v11l-4-2.8-4 2.8z" />
        </svg>
        {state.error && saved === undefined ? '다시 시도' : saved ? '저장됨' : '저장'}
      </button>
      {(error || (saved === undefined && state.error)) &&
        <p className="mt-1 text-xs text-danger" role="alert">{error ?? state.error}</p>}
    </div>
  )
}

export default BookmarkButton
