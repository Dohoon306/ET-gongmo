import { useMemo, useState } from 'react'
import { Link } from 'react-router'

type Contest = {
  id: number
  title: string
  host: string
  prize: string
  field: string
  level: '초급' | '중급' | '고급'
  people: string
  deadline: string
  dday: string
  recommended: boolean
}

const contests: Contest[] = [
  { id: 1, title: '[한국체육산업개발(주)] 2026년 공공데이터 활용 경진대회', host: '한국체육산업개발(주)', prize: '1등 300만원', field: 'IT', level: '고급', people: '3~4인', deadline: '12.01', dday: 'D-11', recommended: true },
  { id: 2, title: '2026 saaskr 게임 어워드 — AI로 만든 웹게임 공모', host: 'saaskr', prize: '상금 정보 없음', field: 'IT', level: '중급', people: '3~5인', deadline: '12.20', dday: 'D-30', recommended: true },
  { id: 3, title: '제3회 스마트그리드 아이디어 공모전', host: '한국스마트그리드협회', prize: '1등 50만원', field: '기획·아이디어', level: '초급', people: '2~4인', deadline: '12.24', dday: 'D-34', recommended: true },
  { id: 4, title: '[2026 서울관광 프롬프톤] 참가자모집', host: '서울관광재단', prize: '1등 500만원', field: 'IT', level: '중급', people: '2~4인', deadline: '11.29', dday: 'D-9', recommended: false },
  { id: 5, title: '2026 내가 소개하는 서울 숏폼 공모전', host: '서울특별시', prize: '1등 300만원', field: '영상·사진', level: '초급', people: '1~3인', deadline: '11.22', dday: 'D-2', recommended: false },
  { id: 6, title: '2027 영암왕인문화축제 홍보물 디자인 공모전', host: '영암문화관광재단', prize: '1등 200만원', field: '디자인', level: '중급', people: '2~4인', deadline: '12.07', dday: 'D-17', recommended: false },
]

const fields = ['전체', 'IT', '기획·아이디어', '디자인', '영상·사진', '마케팅']
const levels = ['전체', '초급', '중급', '고급']

export default function ContestRecommendationPage() {
  const [query, setQuery] = useState('')
  const [field, setField] = useState('전체')
  const [level, setLevel] = useState('전체')
  const [interestOnly, setInterestOnly] = useState(false)
  const [bookmarksOnly, setBookmarksOnly] = useState(false)
  const [bookmarks, setBookmarks] = useState<number[]>([3])

  const visibleContests = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase()
    return contests.filter((contest) => {
      const searchable = `${contest.title} ${contest.host} ${contest.field}`.toLocaleLowerCase()
      const matchesQuery = !keyword || searchable.includes(keyword)
      const matchesField = field === '전체' || contest.field === field
      const matchesLevel = level === '전체' || contest.level === level
      const matchesInterest = !interestOnly || contest.recommended
      const matchesBookmark = !bookmarksOnly || bookmarks.includes(contest.id)
      return matchesQuery && matchesField && matchesLevel && matchesInterest && matchesBookmark
    })
  }, [bookmarks, bookmarksOnly, field, interestOnly, level, query])

  const toggleBookmark = (contestId: number) => {
    setBookmarks((current) => current.includes(contestId) ? current.filter((id) => id !== contestId) : [...current, contestId])
  }

  return (
    <section className="-mx-4 -my-8 min-h-[calc(100vh-73px)] bg-[#f7f9fd] px-4 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <p className="text-sm font-bold text-brand">추천 공모전</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#102a5e] sm:text-4xl">나에게 맞는 공모전 찾기</h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">관심 분야와 난이도를 걸러보고, 마음에 드는 공모전은 북마크해 두세요.</p>
        </div>

        <div className="rounded-3xl border border-[#d9e2f0] bg-white p-5 shadow-[0_4px_12px_rgba(16,42,94,0.05)]">
          <div className="flex flex-col gap-3 md:flex-row">
            <label className="flex h-12 flex-1 items-center gap-3 rounded-xl border border-[#d9e2f0] px-4 text-slate-500">
              <SearchIcon />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="공모전명, 주최, 키워드 검색" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
            </label>
            <select className="h-12 rounded-xl border border-[#d9e2f0] bg-white px-4 text-sm font-medium text-[#0f234c] outline-none md:w-52">
              <option>맞춤 추천순</option>
              <option>마감 임박순</option>
              <option>최신순</option>
            </select>
          </div>
          <FilterRow label="분야" values={fields} selected={field} onSelect={setField} />
          <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <FilterRow label="난이도" values={levels} selected={level} onSelect={setLevel} compact />
            <div className="flex flex-wrap gap-2 xl:justify-end">
              <ToggleButton active={interestOnly} onClick={() => setInterestOnly((value) => !value)}>내 관심 분야만</ToggleButton>
              <ToggleButton active={bookmarksOnly} onClick={() => setBookmarksOnly((value) => !value)}>북마크만</ToggleButton>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-700">총 <span className="text-brand">{visibleContests.length}</span>개의 공모전</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-[#1d6a43] px-3 py-1.5 font-semibold text-white">✓ 나와 겹치는 태그</span>
            <span className="rounded-full bg-[#eef1ec] px-3 py-1.5 font-medium text-slate-600">그 외 태그</span>
          </div>
        </div>

        {visibleContests.length ? (
          <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleContests.map((contest) => <ContestCard key={contest.id} contest={contest} saved={bookmarks.includes(contest.id)} onBookmark={() => toggleBookmark(contest.id)} />)}
          </div>
        ) : (
          <div className="mt-4 rounded-3xl border border-dashed border-[#d9e2f0] bg-white px-6 py-16 text-center text-slate-500">조건에 맞는 공모전이 없어요. 필터를 바꿔 보세요.</div>
        )}

        <p className="mt-7 text-xs text-slate-500">공고 정보 출처: 공모아뷰 · 지원과 접수는 각 공고의 주최 측 원문에서 해요.</p>
      </div>
    </section>
  )
}

function FilterRow({ label, values, selected, onSelect, compact = false }: { label: string; values: string[]; selected: string; onSelect: (value: string) => void; compact?: boolean }) {
  return (
    <div className={`mt-4 flex flex-wrap items-center gap-2 ${compact ? 'mt-0' : ''}`}>
      <span className="mr-2 text-xs font-medium text-slate-500">{label}</span>
      {values.map((value) => <button key={value} type="button" onClick={() => onSelect(value)} className={`h-10 rounded-full border px-4 text-sm font-medium transition ${selected === value ? 'border-[#1d6a43] bg-[#1d6a43] text-white' : 'border-[#c9d1c6] bg-white text-slate-700 hover:border-[#1d6a43]'}`}>{selected === value ? '✓ ' : ''}{value}</button>)}
    </div>
  )
}

function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return <button type="button" onClick={onClick} className={`h-12 rounded-xl border px-5 text-sm font-semibold transition ${active ? 'border-[#1d6a43] bg-[#e5f0e8] text-[#1d6a43]' : 'border-[#c9d1c6] bg-white text-slate-800 hover:border-[#1d6a43]'}`}>{active ? '✓ ' : ''}{children}</button>
}

function ContestCard({ contest, saved, onBookmark }: { contest: Contest; saved: boolean; onBookmark: () => void }) {
  return (
    <article className="flex min-h-56 flex-col rounded-3xl border border-[#d9e2f0] bg-white p-5 shadow-[0_4px_12px_rgba(16,42,94,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-brand">{contest.field}</span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">{contest.level}</span>
          {contest.recommended && <span className="rounded-full bg-[#102a5e] px-2.5 py-1 text-[11px] font-bold text-white">맞춤 추천</span>}
        </div>
        <button type="button" onClick={onBookmark} aria-label={`${contest.title} ${saved ? '저장 해제' : '저장'}`} className={`flex h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold ${saved ? 'border-[#1d6a43] bg-[#e5f0e8] text-[#1d6a43]' : 'border-[#c9d1c6] text-slate-800'}`}>
          <BookmarkIcon filled={saved} /> {saved ? '저장됨' : '저장'}
        </button>
      </div>
      <Link to={`/contests/${contest.id}`} className="mt-4 line-clamp-2 text-lg font-extrabold leading-7 text-[#0f234c] hover:text-brand">{contest.title}</Link>
      <p className="mt-2 text-xs text-slate-500">{contest.host} · {contest.prize}</p>
      <div className="mt-auto flex items-center justify-between pt-4 text-xs text-slate-500">
        <span>{contest.people} · {contest.deadline} 마감</span>
        <span className="font-bold text-[#102a5e]">{contest.dday}</span>
      </div>
    </article>
  )
}

function SearchIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" /><path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} aria-hidden="true"><path d="M6.5 4.5h11v15l-5.5-3.5-5.5 3.5v-15Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
}
