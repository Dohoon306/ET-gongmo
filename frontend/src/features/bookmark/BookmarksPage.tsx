import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../../api/client.ts'
import { DDayBadge } from '../../common/DDayBadge.tsx'
import { getDeadline } from '../../common/deadline.ts'
import { useCurrentUser } from '../../common/useCurrentUser.ts'
import BookmarkButton from './BookmarkButton.tsx'
import { bookmarkHeaders } from './bookmarkState.ts'

type SavedContest = { id: number; title: string; host: string | null; endDate: string | null; prize: string | null }
type SortOrder = 'deadline' | 'title'

export default function BookmarksPage() {
  const { userId } = useCurrentUser()
  return <section><div><header><h1 className="text-[26px] font-bold leading-[1.3] tracking-[-0.02em] text-ink">저장한 공모전</h1><p className="mt-1.5 text-[15px] text-muted">관심 있는 공모전의 마감일과 팀 모집 정보를 한눈에 확인해 보세요.</p></header><div className="mt-7">{userId === null ? <UserRequired /> : <BookmarkList key={userId} userId={userId} />}</div></div></section>
}

function UserRequired() {
  return <div className="rounded-lg border border-line bg-white px-6 py-12 text-center text-sm text-muted">관심 공고를 보려면 오른쪽 위에서 현재 사용자를 선택해 주세요.</div>
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

  if (error !== null) return <div className="rounded-lg border border-line bg-white p-6"><p role="alert" className="text-sm text-danger">{error}</p><button type="button" className="mt-4 rounded-md border border-line-strong px-4 py-2.5 text-sm font-semibold text-brand" onClick={() => { setError(null); setAttempt((value) => value + 1) }}>다시 시도</button></div>
  if (contests === null) return <p role="status" className="rounded-lg bg-white px-6 py-12 text-center text-sm text-muted">관심 공고를 불러오는 중이에요.</p>
  if (contests.length === 0) return <EmptyBookmarks />

  const remove = (contestId: number) => setContests((current) => current?.filter((contest) => contest.id !== contestId) ?? null)
  return <><div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3.5"><p className="text-sm font-semibold text-ink">저장한 공모전 <span className="tabular-nums text-brand">{contests.length}</span>개</p><label className="flex items-center rounded-md border border-line-strong bg-white px-3 text-sm font-medium text-ink"><span className="sr-only">정렬 기준</span><select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)} className="h-10 bg-transparent pr-2 outline-none"><option value="deadline">마감 임박순</option><option value="title">가나다순</option></select></label></div>{groups.active.length > 0 && <ContestGrid contests={groups.active} now={now} onRemove={remove} />}{groups.expired.length > 0 && <section className="mt-9"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold tracking-[-0.01em] text-ink">마감된 공고</h2><span className="inline-flex h-[22px] items-center rounded-sm bg-subtle px-[7px] text-xs font-semibold tabular-nums text-muted">{groups.expired.length}개</span><p className="text-[13px] text-muted">마감된 공고는 한 달 동안 보관돼요.</p></div><ContestGrid contests={groups.expired} now={now} muted onRemove={remove} /></section>}<p className="mt-7 text-xs text-muted">공고 정보 출처: 공모아뷰 · 지원과 접수는 각 공고의 주최 측 원문에서 해요.</p></>
}

function ContestGrid({ contests, now, muted = false, onRemove }: { contests: SavedContest[]; now: Date; muted?: boolean; onRemove: (contestId: number) => void }) {
  return <ul className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{contests.map((contest) => <SavedContestCard key={contest.id} contest={contest} now={now} muted={muted} onRemove={onRemove} />)}</ul>
}

function SavedContestCard({ contest, now, muted, onRemove }: { contest: SavedContest; now: Date; muted: boolean; onRemove: (contestId: number) => void }) {
  const deadline = getDeadline(contest.endDate, now)
  const status = deadline.expired ? '마감' : deadline.urgent ? '마감 임박' : '진행 중'
  return <li className={`flex min-h-[200px] flex-col rounded-lg border border-line p-[18px] ${muted ? 'bg-page' : 'bg-white'}`}><div className="flex items-start justify-between gap-3"><div className="flex flex-wrap gap-1.5"><span className="inline-flex h-6 items-center rounded-sm border border-line px-2 text-xs font-medium text-ink-2">저장 공고</span><span className={`inline-flex h-6 items-center rounded-sm px-2 text-xs font-semibold ${deadline.expired ? 'bg-subtle text-muted' : deadline.urgent ? 'bg-accent-soft text-accent' : 'bg-brand-soft text-brand'}`}>{status}</span></div><BookmarkButton contestId={contest.id} initiallySaved onChange={(saved) => { if (!saved) onRemove(contest.id) }} /></div><Link to={`/contests/${contest.id}`} className={`mt-3.5 line-clamp-2 break-keep text-[17px] font-semibold leading-[1.45] tracking-[-0.01em] transition hover:text-brand ${muted ? 'text-ink-2' : 'text-ink'}`}>{contest.title}</Link><p className="mt-1.5 text-[13px] text-muted">{contest.host ?? '주최 정보 없음'}</p><div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4 text-[13px] text-muted"><DDayBadge endDate={contest.endDate} today={now} />{contest.prize && <span className="shrink-0">1등 {contest.prize}</span>}</div></li>
}

function EmptyBookmarks() {
  return <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line-strong px-6 py-16 text-center"><p className="text-[17px] font-bold text-ink">아직 저장한 공모전이 없어요</p><p className="mt-2 text-sm text-muted">추천 공모전에서 마음에 드는 공고의 저장 버튼을 눌러 보세요.</p><Link to="/contests" className="mt-5 inline-flex h-11 items-center rounded-md bg-brand px-4 text-[15px] font-semibold text-white transition hover:bg-brand-strong">추천 공모전 보러 가기</Link></div>
}
