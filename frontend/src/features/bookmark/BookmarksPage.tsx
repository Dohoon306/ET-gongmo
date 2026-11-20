import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../../api/client.ts'
import DDayBadge from '../../common/DDayBadge.tsx'
import { getDeadline } from '../../common/deadline.ts'
import { useCurrentUser } from '../../common/useCurrentUser.ts'
import BookmarkButton from './BookmarkButton.tsx'
import { bookmarkHeaders } from './bookmarkState.ts'
import './bookmarks.css'

type SavedContest = { id: number; title: string; host: string | null; endDate: string | null; prize: string | null }

export default function BookmarksPage() {
  const { userId } = useCurrentUser()
  return (
    <div className="bookmark-page mx-auto max-w-[1056px] space-y-6 text-[#18211B]">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">관심 공고</h1>
        <p className="text-sm text-[#56635B]">저장한 공모전을 마감이 가까운 순으로 보여 드려요. 마감이 지난 공고는 맨 아래에 남겨 둬요.</p>
      </header>
      {userId === null
        ? <p className="text-gray-600">관심 공고를 보려면 현재 사용자를 선택해 주세요.</p>
        : <BookmarkList key={userId} userId={userId} />}
    </div>
  )
}

function BookmarkList({ userId }: { userId: number }) {
  const [contests, setContests] = useState<SavedContest[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [now] = useState(() => new Date())

  useEffect(() => {
    const request = new AbortController()
    api<SavedContest[]>('/api/bookmarks', { signal: request.signal, headers: bookmarkHeaders(userId) })
      .then(setContests)
      .catch((failure: Error) => { if (!request.signal.aborted) setError(failure.message) })
    return () => request.abort()
  }, [userId, attempt])

  if (error !== null) return (
    <div className="space-y-3 rounded-2xl border border-[#DCE2DA] bg-white p-5">
      <p role="alert" className="text-sm text-red-700">{error}</p>
      <button type="button" className="rounded-lg border border-[#C9D1C6] px-4 py-2 text-sm font-semibold text-[#1D6A43]"
        onClick={() => { setError(null); setAttempt((value) => value + 1) }}>다시 시도</button>
    </div>
  )
  if (contests === null) return <p role="status">관심 공고를 불러오는 중이에요.</p>
  if (contests.length === 0) return (
    <div className="flex min-h-[328px] flex-col items-center justify-center gap-4 rounded-2xl border border-[#DCE2DA] bg-white p-8 text-center">
      <span aria-hidden="true" className="grid size-14 place-items-center rounded-full bg-[#E5F0E8] text-[#1D6A43]">
        <span className="grid size-5 place-items-center bg-current [clip-path:polygon(8%_0,92%_0,92%_100%,50%_73%,8%_100%)]">
          <span className="mb-1 size-3 bg-[#E5F0E8] [clip-path:polygon(0_0,100%_0,100%_100%,50%_68%,0_100%)]" />
        </span>
      </span>
      <p className="text-lg font-bold">아직 저장한 공모전이 없어요</p>
      <p className="text-sm text-[#56635B]">추천 공모전에서 마음에 드는 공고의 저장 버튼을 눌러 보세요.</p>
      <Link to="/contests" className="rounded-lg bg-[#1D6A43] px-5 py-3 text-sm font-semibold text-white hover:bg-[#175536]">추천 공모전 보러 가기</Link>
    </div>
  )

  const active: SavedContest[] = []
  const expired: SavedContest[] = []
  for (const contest of contests) {
    const group = getDeadline(contest.endDate, now).expired ? expired : active
    group.push(contest)
  }

  function cards(items: SavedContest[], muted: boolean) {
    return (
      <ul className="space-y-3">
        {items.map((contest) => (
          <li key={contest.id} className={`flex flex-col gap-4 rounded-2xl border border-[#DCE2DA] px-5 py-4 sm:min-h-[100px] sm:flex-row sm:items-center sm:justify-between ${muted ? 'bg-[#EEF1EC] text-[#56635B]' : 'bg-white'}`}>
            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="break-words font-semibold">
                <Link to={`/contests/${contest.id}`} className="hover:text-[#1D6A43] hover:underline">{contest.title}</Link>
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#56635B]">
                <DDayBadge endDate={contest.endDate} today={now} />
                {contest.host && <span>· {contest.host}</span>}
                {contest.prize && <span>· 1등 {contest.prize}</span>}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-start gap-2">
              <BookmarkButton contestId={contest.id} initiallySaved onChange={(saved) => {
                if (!saved) setContests((current) => current?.filter((item) => item.id !== contest.id) ?? null)
              }} />
              <Link to={`/contests/${contest.id}`} className="rounded-lg border border-[#DCE2DA] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#18211B] hover:border-[#1D6A43]">
                자세히 보기 <span aria-hidden="true" className="ml-1">›</span>
              </Link>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <>
      <p className="text-sm text-[#56635B]">저장한 공모전 <strong className="text-[#18211B]">{contests.length}개</strong></p>
      {active.length > 0 && cards(active, false)}
      {expired.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[#56635B]">마감된 공고</h2>
          {cards(expired, true)}
        </section>
      )}
      <p className="text-xs text-[#56635B]">저장됨 버튼을 다시 누르면 목록에서 바로 빠져요. 공고 정보 출처는 공모아뷰예요.</p>
    </>
  )
}
