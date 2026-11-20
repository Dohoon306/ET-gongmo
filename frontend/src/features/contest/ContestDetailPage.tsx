import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'

const contest = {
  id: '1',
  title: '[한국체육산업개발(주)] 2026년 공공데이터 활용 경진대회',
  host: '한국체육산업개발(주)',
  prize: '300만원',
  people: '3~4인',
  period: '2026.11.02 ~ 12.01',
  target: '누구나',
  dday: 'D-11',
  field: '게임/소프트웨어 · 온라인 · 무료 접수',
}

export default function ContestDetailPage() {
  const { contestId } = useParams()
  const [saved, setSaved] = useState(false)
  const [notice, setNotice] = useState('')
  const [showTeams, setShowTeams] = useState(false)
  const isKnownContest = contestId === contest.id
  const heading = isKnownContest ? contest.title : '찾을 수 없는 공모전이에요'

  const actionLabel = useMemo(() => saved ? '저장됨' : '관심 공고 저장', [saved])

  const handleTeamCreation = () => {
    setNotice('팀 만들기 화면으로 이동할 수 있도록 준비했어요.')
  }

  const handleTeams = () => {
    setShowTeams(true)
    setNotice('모집 중인 팀 4개를 확인할 수 있어요.')
    document.getElementById('contest-teams')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="-mx-4 -my-8 min-h-[calc(100vh-73px)] bg-[#f7f9fd] px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <Link to="/contests" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#1d6a43]">
          <span aria-hidden="true">←</span> 추천 공모전으로
        </Link>

        {isKnownContest ? (
          <>
            <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
              <article className="rounded-[28px] border border-[#dce2da] bg-white p-6 shadow-[0_4px_12px_rgba(16,42,94,0.05)] sm:p-7">
                <div className="flex flex-wrap gap-2">
                  <Tag>IT</Tag>
                  <MatchedTag>백엔드</MatchedTag>
                  <MatchedTag>초보</MatchedTag>
                  <MatchedTag>배우고 싶음</MatchedTag>
                </div>
                <h1 className="mt-5 break-keep text-2xl font-extrabold leading-9 text-[#102a5e] sm:text-[27px]">{heading}</h1>
                <p className="mt-2 text-sm font-medium text-slate-500">{contest.host}</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <InfoCard icon="🏆" label="1등 상금" value={contest.prize} />
                  <InfoCard icon="♧" label="참가 인원" value={contest.people} />
                  <InfoCard icon="▣" label="접수 기간" value={contest.period} />
                  <InfoCard icon="◎" label="대상" value={contest.target} />
                </div>
              </article>

              <aside className="h-fit rounded-[28px] bg-[#1d6a43] p-[22px] text-white shadow-[0_8px_16px_rgba(16,42,94,0.14)]">
                <p className="text-[13px] font-medium text-[#d5eadc]">마감까지</p>
                <p className="mt-0.5 text-[38px] font-extrabold leading-none">{contest.dday}</p>
                <div className="mt-4 grid gap-2">
                  <Link to="/teams/new" onClick={handleTeamCreation} className="flex h-12 items-center justify-center rounded-xl bg-white px-4 text-sm font-bold text-[#183322] transition hover:bg-[#f0f6f1]">이 공모전으로 팀 만들기</Link>
                  <button type="button" onClick={handleTeams} className="h-12 rounded-xl border border-white/60 bg-white/10 px-4 text-sm font-bold transition hover:bg-white/20">모집 방 4개 보기</button>
                  <button type="button" onClick={() => { setSaved((value) => !value); setNotice(saved ? '관심 공고 저장을 해제했어요.' : '관심 공고에 저장했어요.') }} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/60 bg-white/10 px-4 text-sm font-bold transition hover:bg-white/20" aria-pressed={saved}>
                    <BookmarkIcon filled={saved} /> {actionLabel}
                  </button>
                </div>
              </aside>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
              <article className="rounded-[28px] border border-[#dce2da] bg-white p-6 shadow-[0_4px_12px_rgba(16,42,94,0.05)] sm:p-7">
                <h2 className="text-[19px] font-bold text-[#0f234c]">공모전 소개</h2>
                <p className="mt-4 break-keep text-sm leading-6 text-slate-700">공고의 상세 내용과 지원 방법은 주최 측 원문에서 확인하세요. 사이트마다 접수 기간이 다르게 올라와 있을 수 있으니, 지원 전 원문 공고를 꼭 확인해 주세요.</p>
                <div className="mt-6 flex items-center gap-3">
                  <span className="text-xl text-[#1d6a43]" aria-hidden="true">▦</span>
                  <div>
                    <p className="text-xs text-slate-500">분야</p>
                    <p className="mt-1 text-sm font-bold text-[#0f234c]">{contest.field}</p>
                  </div>
                </div>
              </article>

              <aside className="h-fit rounded-[22px] border border-[#dce2da] bg-white p-[22px] shadow-[0_4px_12px_rgba(16,42,94,0.05)]">
                <h2 className="text-[15px] font-bold text-[#0f234c]">나와의 적합도</h2>
                <p className="mt-3 text-[13px] leading-5 text-slate-500">내 태그와 4개가 겹쳐요. 팀원 매칭으로 부족한 역할을 채워 보세요.</p>
                <div className="mt-4"><MatchedTag>관심 분야 일치</MatchedTag></div>
              </aside>
            </div>

            <section id="contest-teams" className="mt-7 max-w-[690px] scroll-mt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[19px] font-bold text-[#0f234c]">이 공모전에 도전하는 팀 (4)</h2>
                <button type="button" onClick={handleTeams} className="h-10 rounded-xl border border-[#c9d1c6] bg-white px-4 text-sm font-semibold text-[#183322] transition hover:border-[#1d6a43]">모집 방 모두 보기</button>
              </div>
              <article className="mt-4 rounded-[24px] border border-[#dce2da] bg-white px-6 py-[22px] shadow-[0_4px_12px_rgba(16,42,94,0.05)]">
                <div className="flex flex-wrap gap-2"><MatchedTag>모집 중</MatchedTag><Tag>4개 방</Tag></div>
                <h3 className="mt-3 text-base font-bold text-[#0f234c]">함께할 팀을 찾고 있다면 모집 방을 확인해 보세요.</h3>
                <p className="mt-2 text-[13px] leading-5 text-slate-500">내 태그와 많이 겹치는 방부터 정렬해 보여 드려요. 참여 요청을 보내기 전에 필요한 역할과 소개를 확인할 수 있어요.</p>
                {showTeams && <div className="mt-5 grid gap-2 sm:grid-cols-2">{['데이터 분석가를 찾는 팀', '백엔드 역할을 구하는 팀', '기획부터 함께할 팀', '디자인 협업 팀'].map((team) => <button key={team} type="button" onClick={() => setNotice(`${team}에 참여 요청을 보낼 수 있어요.`)} className="rounded-xl bg-[#f3f6f2] px-4 py-3 text-left text-sm font-semibold text-[#183322] transition hover:bg-[#e5f0e8]">{team}</button>)}</div>}
              </article>
            </section>

            <p className="mt-5 text-xs text-slate-500">공고 정보 출처: 공모아뷰 · 지원과 접수는 각 공고의 주최 측 원문에서 해요.</p>
            {notice && <p role="status" className="fixed bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-[#183322] px-5 py-3 text-sm font-semibold text-white shadow-lg">{notice}</p>}
          </>
        ) : (
          <div className="mt-5 rounded-[28px] border border-[#dce2da] bg-white px-6 py-16 text-center shadow-[0_4px_12px_rgba(16,42,94,0.05)]"><h1 className="text-xl font-bold text-[#0f234c]">{heading}</h1><p className="mt-2 text-sm text-slate-500">추천 공모전 목록에서 다른 공고를 선택해 주세요.</p></div>
        )}
      </div>
    </section>
  )
}

function Tag({ children }: { children: string }) {
  return <span className="inline-flex h-7 items-center rounded-full bg-[#eef1ec] px-3 text-[13px] font-medium text-[#3b4840]">{children}</span>
}

function MatchedTag({ children }: { children: string }) {
  return <span className="inline-flex h-7 items-center gap-1 rounded-full bg-[#1d6a43] px-3 text-[13px] font-semibold text-white">✓ {children}</span>
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <div className="flex min-h-[80px] items-center gap-3 rounded-[18px] bg-[#f3f6f2] px-[18px] py-4"><span className="text-lg text-[#1d6a43]" aria-hidden="true">{icon}</span><div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-bold text-[#0f234c]">{value}</p></div></div>
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} aria-hidden="true"><path d="M6.5 4.5h11v15l-5.5-3.5-5.5 3.5v-15Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
}
