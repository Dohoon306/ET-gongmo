import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../../api/client.ts'
import DDayBadge from '../../common/DDayBadge.tsx'
import { useCurrentUser } from '../../common/useCurrentUser.ts'
import BookmarkButton from '../bookmark/BookmarkButton.tsx'

type ContestTag = { axis: string; name: string; matched: boolean }

type Contest = {
  id: number
  title: string
  host: string | null
  endDate: string
  prize: string | null
  benefit: string | null
  overlap: number
  tags: ContestTag[]
}

type SortOrder = 'recommended' | 'deadline'

const ALL = '전체'
const PAGE_SIZE = 12

export default function ContestRecommendationPage() {
  const { userId } = useCurrentUser()
  return (
    <section className="-mx-4 -my-8 min-h-[calc(100vh-73px)] bg-[#f7f9fd] px-4 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <p className="text-sm font-bold text-brand">추천 공모전</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#102a5e] sm:text-4xl">나에게 맞는 공모전 찾기</h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">관심 분야와 난이도를 걸러보고, 마음에 드는 공모전은 북마크해 두세요.</p>
        </div>
        {userId === null
          ? <Notice>추천 공모전을 보려면 오른쪽 위에서 현재 사용자를 선택해 주세요.</Notice>
          : <Recommendations key={userId} userId={userId} />}
      </div>
    </section>
  )
}

function Recommendations({ userId }: { userId: number }) {
  const [contests, setContests] = useState<Contest[] | null>(null)
  const [bookmarkIds, setBookmarkIds] = useState<ReadonlySet<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('recommended')
  const [field, setField] = useState(ALL)
  const [level, setLevel] = useState(ALL)
  const [interestOnly, setInterestOnly] = useState(false)
  const [bookmarksOnly, setBookmarksOnly] = useState(false)
  const [requestedPage, setRequestedPage] = useState(1)
  const resultsTop = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const request = new AbortController()
    const headers = { 'X-User-Id': String(userId) }
    api<Contest[]>('/api/contests/recommendations', { signal: request.signal, headers })
      .then(setContests)
      .catch((failure: Error) => { if (!request.signal.aborted) setError(failure.message) })
    api<number[]>('/api/bookmarks/ids', { signal: request.signal, headers })
      .then((ids) => setBookmarkIds(new Set(ids)))
      .catch(() => {})
    return () => request.abort()
  }, [userId, attempt])

  const fields = useMemo(() => tagNames(contests, 'FIELD'), [contests])
  const levels = useMemo(() => tagNames(contests, 'LEVEL'), [contests])

  const visibleContests = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase()
    const filtered = (contests ?? []).filter((contest) => {
      const searchable = `${contest.title} ${contest.host ?? ''} ${contest.tags.map((tag) => tag.name).join(' ')}`.toLocaleLowerCase()
      const matchesQuery = !keyword || searchable.includes(keyword)
      const matchesField = field === ALL || hasTag(contest, 'FIELD', field)
      const matchesLevel = level === ALL || hasTag(contest, 'LEVEL', level)
      const matchesInterest = !interestOnly || contest.overlap > 0
      const matchesBookmark = !bookmarksOnly || bookmarkIds.has(contest.id)
      return matchesQuery && matchesField && matchesLevel && matchesInterest && matchesBookmark
    })
    return sortOrder === 'deadline' ? [...filtered].sort((left, right) => left.endDate.localeCompare(right.endDate)) : filtered
  }, [bookmarkIds, bookmarksOnly, contests, field, interestOnly, level, query, sortOrder])

  const pageCount = Math.max(1, Math.ceil(visibleContests.length / PAGE_SIZE))
  const page = Math.min(requestedPage, pageCount)
  const pageContests = visibleContests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const fromFirstPage = <Value,>(apply: (value: Value) => void) => (value: Value) => {
    apply(value)
    setRequestedPage(1)
  }

  const goToPage = (next: number) => {
    setRequestedPage(next)
    resultsTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const markBookmark = (contestId: number, saved: boolean) => {
    setBookmarkIds((current) => {
      const next = new Set(current)
      if (saved) next.add(contestId)
      else next.delete(contestId)
      return next
    })
  }

  if (error !== null) {
    return (
      <div className="rounded-3xl border border-[#d9e2f0] bg-white p-6">
        <p role="alert" className="text-sm text-red-700">{error}</p>
        <button type="button" className="mt-4 rounded-xl border border-[#c9d1c6] px-4 py-2.5 text-sm font-semibold text-[#1d6a43]" onClick={() => { setError(null); setAttempt((value) => value + 1) }}>다시 시도</button>
      </div>
    )
  }
  if (contests === null) return <Notice>추천 공모전을 불러오는 중이에요.</Notice>

  return (
    <>
      <div className="rounded-3xl border border-[#d9e2f0] bg-white p-5 shadow-[0_4px_12px_rgba(16,42,94,0.05)]">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="flex h-12 flex-1 items-center gap-3 rounded-xl border border-[#d9e2f0] px-4 text-slate-500">
            <SearchIcon />
            <input value={query} onChange={(event) => fromFirstPage(setQuery)(event.target.value)} placeholder="공모전명, 주최, 키워드 검색" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
          </label>
          <select aria-label="정렬 기준" value={sortOrder} onChange={(event) => fromFirstPage(setSortOrder)(event.target.value as SortOrder)} className="h-12 rounded-xl border border-[#d9e2f0] bg-white px-4 text-sm font-medium text-[#0f234c] outline-none md:w-52">
            <option value="recommended">맞춤 추천순</option>
            <option value="deadline">마감 임박순</option>
          </select>
        </div>
        {fields.length > 0 && <FilterRow label="분야" values={[ALL, ...fields]} selected={field} onSelect={fromFirstPage(setField)} />}
        <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          {levels.length > 0 ? <FilterRow label="난이도" values={[ALL, ...levels]} selected={level} onSelect={fromFirstPage(setLevel)} compact /> : <span />}
          <div className="flex flex-wrap gap-2 xl:justify-end">
            <ToggleButton active={interestOnly} onClick={() => fromFirstPage(setInterestOnly)(!interestOnly)}>내 관심 분야만</ToggleButton>
            <ToggleButton active={bookmarksOnly} onClick={() => fromFirstPage(setBookmarksOnly)(!bookmarksOnly)}>북마크만</ToggleButton>
          </div>
        </div>
      </div>

      <div ref={resultsTop} className="mt-7 flex scroll-mt-24 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-700">총 <span className="text-brand">{visibleContests.length}</span>개의 공모전</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-[#1d6a43] px-3 py-1.5 font-semibold text-white">✓ 나와 겹치는 태그</span>
          <span className="rounded-full bg-[#eef1ec] px-3 py-1.5 font-medium text-slate-600">그 외 태그</span>
        </div>
      </div>

      {visibleContests.length ? (
        <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {pageContests.map((contest) => <ContestCard key={contest.id} contest={contest} onBookmark={(saved) => markBookmark(contest.id, saved)} />)}
        </div>
      ) : (
        <div className="mt-4 rounded-3xl border border-dashed border-[#d9e2f0] bg-white px-6 py-16 text-center text-slate-500">조건에 맞는 공모전이 없어요. 필터를 바꿔 보세요.</div>
      )}

      {pageCount > 1 && <PageNumbers page={page} pageCount={pageCount} onSelect={goToPage} />}

      <p className="mt-7 text-xs text-slate-500">공고 정보 출처: 공모아뷰 · 지원과 접수는 각 공고의 주최 측 원문에서 해요.</p>
    </>
  )
}

function tagNames(contests: Contest[] | null, axis: string) {
  return [...new Set((contests ?? []).flatMap((contest) => contest.tags.filter((tag) => tag.axis === axis).map((tag) => tag.name)))]
}

function hasTag(contest: Contest, axis: string, name: string) {
  return contest.tags.some((tag) => tag.axis === axis && tag.name === name)
}

function Notice({ children }: { children: string }) {
  return <p role="status" className="rounded-3xl border border-[#d9e2f0] bg-white px-6 py-12 text-center text-sm text-slate-500">{children}</p>
}

function FilterRow({ label, values, selected, onSelect, compact = false }: { label: string; values: string[]; selected: string; onSelect: (value: string) => void; compact?: boolean }) {
  return (
    <div className={`mt-4 flex flex-wrap items-center gap-2 ${compact ? 'mt-0' : ''}`}>
      <span className="mr-2 text-xs font-medium text-slate-500">{label}</span>
      {values.map((value) => <button key={value} type="button" onClick={() => onSelect(value)} className={`h-10 rounded-full border px-4 text-sm font-medium transition ${selected === value ? 'border-[#1d6a43] bg-[#1d6a43] text-white' : 'border-[#c9d1c6] bg-white text-slate-700 hover:border-[#1d6a43]'}`}>{selected === value ? '✓ ' : ''}{value}</button>)}
    </div>
  )
}

function PageNumbers({ page, pageCount, onSelect }: { page: number; pageCount: number; onSelect: (page: number) => void }) {
  const stepClass = 'h-10 rounded-xl border border-[#c9d1c6] bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-[#1d6a43] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#c9d1c6]'
  return (
    <nav aria-label="공모전 목록 페이지" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <button type="button" disabled={page === 1} onClick={() => onSelect(page - 1)} className={stepClass}>이전</button>
      {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
        <button key={number} type="button" aria-label={`${number}페이지`} aria-current={number === page ? 'page' : undefined} onClick={() => onSelect(number)} className={`h-10 min-w-10 rounded-xl border px-3 text-sm font-semibold transition ${number === page ? 'border-[#1d6a43] bg-[#1d6a43] text-white' : 'border-[#c9d1c6] bg-white text-slate-700 hover:border-[#1d6a43]'}`}>{number}</button>
      ))}
      <button type="button" disabled={page === pageCount} onClick={() => onSelect(page + 1)} className={stepClass}>다음</button>
    </nav>
  )
}

function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return <button type="button" onClick={onClick} className={`h-12 rounded-xl border px-5 text-sm font-semibold transition ${active ? 'border-[#1d6a43] bg-[#e5f0e8] text-[#1d6a43]' : 'border-[#c9d1c6] bg-white text-slate-800 hover:border-[#1d6a43]'}`}>{active ? '✓ ' : ''}{children}</button>
}

function ContestCard({ contest, onBookmark }: { contest: Contest; onBookmark: (saved: boolean) => void }) {
  const reward = contest.prize ? `1등 ${contest.prize}` : contest.benefit ?? '상금 정보 없음'
  return (
    <article className="flex min-h-56 flex-col rounded-3xl border border-[#d9e2f0] bg-white p-5 shadow-[0_4px_12px_rgba(16,42,94,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {contest.overlap > 0 && <span className="rounded-full bg-[#102a5e] px-2.5 py-1 text-[11px] font-bold text-white">맞춤 추천 · {contest.overlap}개 겹침</span>}
          {contest.tags.map((tag) => (
            <span key={`${tag.axis}:${tag.name}`} className={`rounded-full px-2.5 py-1 text-[11px] ${tag.matched ? 'bg-[#1d6a43] font-semibold text-white' : 'bg-[#eef1ec] font-medium text-slate-600'}`}>{tag.matched ? '✓ ' : ''}{tag.name}</span>
          ))}
        </div>
        <div className="shrink-0"><BookmarkButton contestId={contest.id} onChange={onBookmark} /></div>
      </div>
      <Link to={`/contests/${contest.id}`} className="mt-4 line-clamp-2 text-lg font-extrabold leading-7 text-[#0f234c] hover:text-brand">{contest.title}</Link>
      <p className="mt-2 text-xs text-slate-500">{contest.host ?? '주최 정보 없음'} · {reward}</p>
      <div className="mt-auto pt-4"><DDayBadge endDate={contest.endDate} /></div>
    </article>
  )
}

function SearchIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" /><path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
}
