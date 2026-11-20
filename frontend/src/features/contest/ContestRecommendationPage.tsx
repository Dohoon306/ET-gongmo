import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../../api/client.ts'
import DDayBadge from '../../common/DDayBadge.tsx'
import { CheckIcon } from '../../common/icons.tsx'
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
    <section>
      <div>
        <div className="mb-6">
          <h1 className="text-[26px] font-bold leading-[1.3] tracking-[-0.02em] text-ink">나에게 맞는 공모전 찾기</h1>
          <p className="mt-1.5 text-[15px] text-muted">관심 분야와 난이도를 걸러보고, 마음에 드는 공모전은 북마크해 두세요.</p>
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
  const [selectedFields, setSelectedFields] = useState<ReadonlySet<string>>(() => new Set())
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

  const fields = useMemo(() => tagNames(contests, 'FIELD').sort(
    (left, right) => Number(left === '기타') - Number(right === '기타'),
  ), [contests])
  const levels = useMemo(() => tagNames(contests, 'LEVEL'), [contests])

  const visibleContests = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase()
    const filtered = (contests ?? []).filter((contest) => {
      const searchable = `${contest.title} ${contest.host ?? ''} ${contest.tags.map((tag) => tag.name).join(' ')}`.toLocaleLowerCase()
      const matchesQuery = !keyword || searchable.includes(keyword)
      const matchesField = selectedFields.size === 0 || contest.tags.some((tag) => tag.axis === 'FIELD' && selectedFields.has(tag.name))
      const matchesLevel = level === ALL || hasTag(contest, 'LEVEL', level)
      const matchesInterest = !interestOnly || contest.overlap > 0
      const matchesBookmark = !bookmarksOnly || bookmarkIds.has(contest.id)
      return matchesQuery && matchesField && matchesLevel && matchesInterest && matchesBookmark
    })
    return sortOrder === 'deadline' ? [...filtered].sort((left, right) => left.endDate.localeCompare(right.endDate)) : filtered
  }, [bookmarkIds, bookmarksOnly, contests, interestOnly, level, query, selectedFields, sortOrder])

  const pageCount = Math.max(1, Math.ceil(visibleContests.length / PAGE_SIZE))
  const page = Math.min(requestedPage, pageCount)
  const pageContests = visibleContests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const fromFirstPage = <Value,>(apply: (value: Value) => void) => (value: Value) => {
    apply(value)
    setRequestedPage(1)
  }

  const selectField = (field: string) => {
    setSelectedFields((current) => {
      if (field === ALL) return new Set()
      const next = new Set(current)
      if (next.has(field)) next.delete(field)
      else next.add(field)
      return next
    })
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
      <div className="rounded-lg border border-line bg-white p-6">
        <p role="alert" className="text-sm text-danger">{error}</p>
        <button type="button" className="mt-4 rounded-md border border-line-strong px-4 py-2.5 text-sm font-semibold text-brand" onClick={() => { setError(null); setAttempt((value) => value + 1) }}>다시 시도</button>
      </div>
    )
  }
  if (contests === null) return <Notice>추천 공모전을 불러오는 중이에요.</Notice>

  return (
    <>
      <div className="rounded-lg border border-line bg-page p-4">
        <div className="flex flex-col gap-2.5 md:flex-row">
          <label className="flex h-11 shrink-0 items-center gap-2.5 rounded-md border border-line-strong bg-white px-3.5 text-muted md:flex-1">
            <SearchIcon />
            <input value={query} onChange={(event) => fromFirstPage(setQuery)(event.target.value)} placeholder="공모전명, 주최, 키워드 검색" className="w-full bg-transparent text-sm outline-none placeholder:text-muted" />
          </label>
          <select aria-label="정렬 기준" value={sortOrder} onChange={(event) => fromFirstPage(setSortOrder)(event.target.value as SortOrder)} className="h-11 rounded-md border border-line-strong bg-white px-3 text-sm font-medium text-ink outline-none md:w-52">
            <option value="recommended">맞춤 추천순</option>
            <option value="deadline">마감 임박순</option>
          </select>
        </div>
        {fields.length > 0 && <FilterRow label="분야" values={[ALL, ...fields]} isSelected={(field) => field === ALL ? selectedFields.size === 0 : selectedFields.has(field)} onSelect={fromFirstPage(selectField)} />}
        <div className="mt-3.5 flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
          {levels.length > 0 ? <FilterRow label="난이도" values={[ALL, ...levels]} isSelected={(value) => value === level} onSelect={fromFirstPage(setLevel)} compact /> : <span />}
          <div className="flex flex-wrap gap-2 xl:justify-end">
            <ToggleButton active={interestOnly} onClick={() => fromFirstPage(setInterestOnly)(!interestOnly)}>내 관심 분야만</ToggleButton>
            <ToggleButton active={bookmarksOnly} onClick={() => fromFirstPage(setBookmarksOnly)(!bookmarksOnly)}>북마크만</ToggleButton>
          </div>
        </div>
      </div>

      <div ref={resultsTop} className="mt-7 flex scroll-mt-24 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-ink">총 <span className="tabular-nums text-brand">{visibleContests.length}</span>개의 공모전</p>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="inline-flex h-6 items-center gap-1 rounded-sm bg-brand-soft px-2 font-semibold text-brand"><CheckIcon className="size-[11px]" />나와 겹치는 태그</span>
          <span className="inline-flex h-6 items-center rounded-sm border border-line bg-white px-2 font-medium text-ink-2">그 외 태그</span>
        </div>
      </div>

      {visibleContests.length ? (
        <div className="mt-3.5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pageContests.map((contest) => <ContestCard key={contest.id} contest={contest} onBookmark={(saved) => markBookmark(contest.id, saved)} />)}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed border-line bg-white px-6 py-16 text-center text-muted">조건에 맞는 공모전이 없어요. 필터를 바꿔 보세요.</div>
      )}

      {pageCount > 1 && <PageNumbers page={page} pageCount={pageCount} onSelect={goToPage} />}

      <p className="mt-7 text-xs text-muted">공고 정보 출처: 공모아뷰 · 지원과 접수는 각 공고의 주최 측 원문에서 해요.</p>
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
  return <p role="status" className="rounded-lg border border-line bg-white px-6 py-12 text-center text-sm text-muted">{children}</p>
}

function FilterRow({ label, values, isSelected, onSelect, compact = false }: { label: string; values: string[]; isSelected: (value: string) => boolean; onSelect: (value: string) => void; compact?: boolean }) {
  return (
    <div role="group" aria-label={label} className={`flex flex-wrap items-center gap-1.5 ${compact ? '' : 'mt-3.5'}`}>
      <span className="w-[52px] text-[13px] font-medium text-muted">{label}</span>
      {values.map((value) => {
        const selected = isSelected(value)
        return (
          <button key={value} type="button" aria-pressed={selected} onClick={() => onSelect(value)} className={`inline-flex h-10 items-center gap-1.5 rounded-md border px-3.5 text-sm font-medium transition ${selected ? 'border-brand bg-brand text-white' : 'border-line-strong bg-white text-ink-2 hover:border-brand'}`}>
            {selected && <CheckIcon />}{value}
          </button>
        )
      })}
    </div>
  )
}

function PageNumbers({ page, pageCount, onSelect }: { page: number; pageCount: number; onSelect: (page: number) => void }) {
  const stepClass = 'h-10 rounded-md border border-line-strong bg-white px-3 text-sm font-medium text-ink-2 transition hover:border-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line-strong'
  return (
    <nav aria-label="공모전 목록 페이지" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <button type="button" disabled={page === 1} onClick={() => onSelect(page - 1)} className={stepClass}>이전</button>
      {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
        <button key={number} type="button" aria-label={`${number}페이지`} aria-current={number === page ? 'page' : undefined} onClick={() => onSelect(number)} className={`h-10 min-w-10 rounded-md border px-3 text-sm font-semibold transition ${number === page ? 'border-brand bg-brand text-white' : 'border-line-strong bg-white text-ink-2 hover:border-brand'}`}>{number}</button>
      ))}
      <button type="button" disabled={page === pageCount} onClick={() => onSelect(page + 1)} className={stepClass}>다음</button>
    </nav>
  )
}

function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return <button type="button" onClick={onClick} className={`inline-flex h-10 items-center gap-1.5 rounded-md border px-3.5 text-sm font-semibold transition ${active ? 'border-brand bg-brand-soft text-brand' : 'border-line-strong bg-white text-ink hover:border-brand'}`}>{active && <CheckIcon />}{children}</button>
}

function ContestCard({ contest, onBookmark }: { contest: Contest; onBookmark: (saved: boolean) => void }) {
  const reward = contest.prize ? `1등 ${contest.prize}` : contest.benefit ?? '상금 정보 없음'
  return (
    <article className="flex min-h-52 flex-col rounded-lg border border-line bg-white p-[18px]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {contest.overlap > 0 && <span className="inline-flex h-6 items-center whitespace-nowrap rounded-sm bg-ink px-2 text-xs font-semibold text-white">맞춤 추천 · {contest.overlap}개 겹침</span>}
          {contest.tags.map((tag) => (
            <span key={`${tag.axis}:${tag.name}`} className={`inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-sm border px-2 text-xs ${tag.matched ? 'border-brand-soft bg-brand-soft font-semibold text-brand' : 'border-line bg-white font-medium text-ink-2'}`}>{tag.matched && <CheckIcon className="size-[11px]" />}{tag.name}</span>
          ))}
        </div>
        <div className="shrink-0"><BookmarkButton contestId={contest.id} onChange={onBookmark} /></div>
      </div>
      <Link to={`/contests/${contest.id}`} className="mt-3.5 line-clamp-2 break-keep text-[17px] font-semibold leading-[1.45] tracking-[-0.01em] text-ink hover:text-brand">{contest.title}</Link>
      <p className="mt-1.5 text-[13px] text-muted">{contest.host ?? '주최 정보 없음'} · {reward}</p>
      <div className="mt-auto pt-4"><DDayBadge endDate={contest.endDate} /></div>
    </article>
  )
}

function SearchIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" /><path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
}
