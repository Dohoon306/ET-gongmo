import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../../api/client.ts'
import { getDeadline } from '../../common/deadline.ts'
import { useCurrentUser } from '../../common/useCurrentUser.ts'
import BookmarkButton from './BookmarkButton.tsx'
import { bookmarkHeaders } from './bookmarkState.ts'
import './bookmarks.css'

type SavedContest = { id: number; title: string; host: string | null; endDate: string | null; prize: string | null }
type SortOrder = 'deadline' | 'title'

export default function BookmarksPage() {
  const { userId } = useCurrentUser()
  return <section className="bookmark-page -mx-4 -my-8 min-h-[calc(100vh-73px)] px-4 py-12 sm:px-8 lg:px-12"><div className="mx-auto max-w-6xl"><header><p className="text-sm font-bold text-[#1d6a43]">관심 공고</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#102a5e] sm:text-[32px]">저장한 공모전</h1><p className="mt-2 text-sm text-[#64748b] sm:text-base">관심 있는 공모전의 마감일과 팀 모집 정보를 한눈에 확인해 보세요.</p></header><div className="mt-8">{userId === null ? <UserRequired /> : <BookmarkList key={userId} userId={userId} />}</div></div></section>
}

function UserRequired() {
  return <div className="rounded-3xl border border-[#dce2da] bg-white px-6 py-12 text-center text-sm text-[#56635b]">관심 공고를 보려면 오른쪽 위에서 현재 사용자를 선택해 주세요.</div>
}

function BookmarkList({ userId }: { userId: number }) {
  const [contests, setContests] = useState<SavedContest[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [sortOrder, setSortOrder] = useState<SortOrder>('deadline')
  const [now] = useState(() => new Date())

  useEffect(() => {
    const request = new AbortController()
    api<SavedContest[]>('/api/bookmarks', { signal: request.signal, headers: bookmarkHeaders(userId) }).then(setContests).catch((failure: Error) => { if (!request.signal.aborted) setError(failure.message) })
    return () => request.abort()
  }, [userId, attempt])

  const groups = useMemo(() => {
    const active: SavedContest[] = []
    const expired: SavedContest[] = []
    for (const contest of contests ?? []) (getDeadline(contest.endDate, now).expired ? expired : active).push(contest)
    const sort = (items: SavedContest[]) => [...items].sort((left, right) => sortOrder === 'title' ? left.title.localeCompare(right.title, 'ko') : (left.endDate ?? '9999-12-31').localeCompare(right.endDate ?? '9999-12-31'))
    return { active: sort(active), expired: sort(expired) }
  }, [contests, now, sortOrder])

  if (error !== null) return <div className="rounded-3xl border border-[#dce2da] bg-white p-6"><p role="alert" className="text-sm text-red-700">{error}</p><button type="button" className="mt-4 rounded-xl border border-[#c9d1c6] px-4 py-2.5 text-sm font-semibold text-[#1d6a43]" onClick={() => { setError(null); setAttempt((value) => value + 1) }}>다시 시도</button></div>
  if (contests === null) return <p role="status" className="rounded-3xl bg-white px-6 py-12 text-center text-sm text-[#56635b]">관심 공고를 불러오는 중이에요.</p>
  if (contests.length === 0) return <EmptyBookmarks />

  const remove = (contestId: number) => setContests((current) => current?.filter((contest) => contest.id !== contestId) ?? null)
  return <><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold text-[#0f234c]">저장한 공모전 {contests.length}개</p><label className="flex items-center rounded-xl border border-[#dce2da] bg-white px-3 text-sm font-semibold text-[#0f234c]"><span className="sr-only">정렬 기준</span><select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)} className="h-10 bg-transparent pr-2 outline-none"><option value="deadline">마감 임박순</option><option value="title">가나다순</option></select></label></div>{groups.active.length > 0 && <ContestGrid contests={groups.active} now={now} onRemove={remove} />}{groups.expired.length > 0 && <section className="mt-8"><div className="flex flex-wrap items-center gap-2"><h2 className="text-[19px] font-bold text-[#0f234c]">마감된 공고</h2><span className="rounded-full bg-[#eef1ec] px-2.5 py-1 text-xs font-semibold text-[#56635b]">{groups.expired.length}개</span><p className="text-[13px] text-[#64748b]">마감된 공고는 한 달 동안 보관돼요.</p></div><ContestGrid contests={groups.expired} now={now} muted onRemove={remove} /></section>}<p className="mt-7 text-xs text-[#64748b]">공고 정보 출처: 공모아뷰 · 지원과 접수는 각 공고의 주최 측 원문에서 해요.</p></>
}

function ContestGrid({ contests, now, muted = false, onRemove }: { contests: SavedContest[]; now: Date; muted?: boolean; onRemove: (contestId: number) => void }) {
  return <ul className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{contests.map((contest) => <SavedContestCard key={contest.id} contest={contest} now={now} muted={muted} onRemove={onRemove} />)}</ul>
}

function SavedContestCard({ contest, now, muted, onRemove }: { contest: SavedContest; now: Date; muted: boolean; onRemove: (contestId: number) => void }) {
  const deadline = getDeadline(contest.endDate, now)
  const status = deadline.expired ? '마감' : deadline.urgent ? '마감 임박' : '진행 중'
  return <li className={`flex min-h-[220px] flex-col rounded-3xl border border-[#dce2da] p-5 shadow-[0_4px_12px_rgba(16,42,94,0.05)] ${muted ? 'bg-[#f6f7f3]' : 'bg-white'}`}><div className="flex items-start justify-between gap-3"><div className="flex flex-wrap gap-1.5"><span className="rounded-full bg-[#e8f1ff] px-2.5 py-1 text-[11px] font-semibold text-[#102a5e]">저장 공고</span><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${deadline.expired ? 'bg-[#eef1ec] text-[#56635b]' : deadline.urgent ? 'bg-[#fdebec] text-[#d94a4a]' : 'bg-[#e5f0e8] text-[#1d6a43]'}`}>{status}</span></div><BookmarkButton contestId={contest.id} initiallySaved onChange={(saved) => { if (!saved) onRemove(contest.id) }} /></div><Link to={`/contests/${contest.id}`} className={`mt-4 line-clamp-2 text-lg font-extrabold leading-7 transition hover:text-[#1d6a43] ${muted ? 'text-[#334155]' : 'text-[#0f234c]'}`}>{contest.title}</Link><p className="mt-2 text-[13px] font-medium text-[#64748b]">{contest.host ?? '주최 정보 없음'}</p><div className="mt-auto flex items-center justify-between gap-3 pt-5 text-[13px] text-[#64748b]"><span>{deadline.date ?? '상시 모집'}{contest.prize ? ` · 1등 ${contest.prize}` : ''}</span><span className={`shrink-0 font-bold ${deadline.expired ? 'text-[#56635b]' : 'text-[#102a5e]'}`}>{deadline.label}</span></div></li>
}

function EmptyBookmarks() {
  return <div className="flex min-h-[328px] flex-col items-center justify-center rounded-3xl border border-[#dce2da] bg-white p-8 text-center"><span aria-hidden="true" className="grid size-14 place-items-center rounded-full bg-[#e5f0e8] text-2xl text-[#1d6a43]">♡</span><p className="mt-4 text-lg font-bold text-[#0f234c]">아직 저장한 공모전이 없어요</p><p className="mt-2 text-sm text-[#56635b]">추천 공모전에서 마음에 드는 공고의 저장 버튼을 눌러 보세요.</p><Link to="/contests" className="mt-5 rounded-xl bg-[#1d6a43] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#175536]">추천 공모전 보러 가기</Link></div>
}
