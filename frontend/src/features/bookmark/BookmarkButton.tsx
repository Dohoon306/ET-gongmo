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
        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-3.5 py-2.5 text-sm font-semibold focus-visible:outline-[#1D6A43] disabled:cursor-not-allowed disabled:opacity-50 ${saved ? 'border-[#1D6A43] bg-[#E5F0E8] text-[#1D6A43]' : 'border-[#C9D1C6] bg-white text-[#18211B] hover:bg-[#E5F0E8]'}`}
      >
        <span aria-hidden="true" className="grid size-3.5 place-items-center bg-current [clip-path:polygon(8%_0,92%_0,92%_100%,50%_73%,8%_100%)]">
          {!saved && <span className="mb-0.5 size-2 bg-white [clip-path:polygon(0_0,100%_0,100%_100%,50%_68%,0_100%)]" />}
        </span>
        {state.error && saved === undefined ? '다시 시도' : saved ? '저장됨' : '저장'}
      </button>
      {(error || (saved === undefined && state.error)) &&
        <p className="mt-1 text-xs text-red-700" role="alert">{error ?? state.error}</p>}
    </div>
  )
}

export default BookmarkButton
