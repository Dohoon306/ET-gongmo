import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { api } from '../../api/client.ts'
import DDayBadge from '../../common/DDayBadge.tsx'
import BookmarkButton from '../bookmark/BookmarkButton.tsx'

type ContestDetail = {
  id: number
  title: string
  type: string | null
  host: string | null
  startDate: string | null
  endDate: string | null
  target: string | null
  prize: string | null
  benefit: string | null
  periodMismatch: boolean
  gongmoaUrl: string
  sourceUrl: string | null
  categories: string[]
  activityPeriod: string | null
  locationMethod: string | null
  cost: string | null
}

export default function ContestDetailPage() {
  const { contestId } = useParams()
  return <ContestDetailLoader key={contestId} contestId={contestId} />
}

function ContestDetailLoader({ contestId }: { contestId?: string }) {
  const [contest, setContest] = useState<ContestDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!contestId) return
    let active = true
    void api<ContestDetail>(`/api/contests/${contestId}`)
      .then((result) => { if (active) setContest(result) })
      .catch((failure: unknown) => { if (active) setError(failure instanceof Error ? failure.message : '공모전 정보를 불러오지 못했어요.') })
    return () => { active = false }
  }, [contestId])

  return (
    <section className="-mx-4 -my-8 min-h-[calc(100vh-73px)] bg-[#f7f9fd] px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <Link to="/contests" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#1d6a43]"><span aria-hidden="true">←</span> 추천 공모전으로</Link>
        {!contest && !error && <StatusCard title="공모전 정보를 불러오는 중이에요." />}
        {error && <StatusCard title={error} />}
        {contest && <ContestContent contest={contest} />}
      </div>
    </section>
  )
}

function ContestContent({ contest }: { contest: ContestDetail }) {
  const primaryReward = contest.prize || contest.benefit
  const supportUrl = contest.sourceUrl || contest.gongmoaUrl
  const period = formatPeriod(contest.startDate, contest.endDate)
  const optionalDetails = [
    ['활동 기간', contest.activityPeriod],
    ['장소·방식', contest.locationMethod],
    ['비용', contest.cost],
  ].filter((detail): detail is [string, string] => Boolean(detail[1]))

  return <>
    <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <article className="rounded-[28px] border border-[#dce2da] bg-white p-6 shadow-[0_4px_12px_rgba(16,42,94,0.05)] sm:p-7">
        <div className="flex flex-wrap gap-2">
          {contest.type && <Tag>{contest.type}</Tag>}
          {contest.categories.map((category) => <Tag key={category}>{category}</Tag>)}
        </div>
        <h1 className="mt-5 break-keep text-2xl font-extrabold leading-9 text-[#102a5e] sm:text-[27px]">{contest.title}</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">{contest.host || '주최 정보 없음'}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <InfoCard icon="🏆" label={contest.prize ? '1등 상금' : '혜택'} value={primaryReward || '상세 공고 확인'} />
          <InfoCard icon="▣" label="접수 기간" value={period || '상시 모집'} />
          <InfoCard icon="◎" label="대상" value={contest.target || '상세 공고 확인'} />
          <InfoCard icon="◈" label="분야" value={contest.categories.length ? contest.categories.join(' · ') : '분류 준비 중'} />
        </div>
      </article>

      <aside className="h-fit rounded-[28px] bg-[#1d6a43] p-[22px] text-white shadow-[0_8px_16px_rgba(16,42,94,0.14)]">
        <p className="text-[13px] font-medium text-[#d5eadc]">마감까지</p>
        <div className="mt-1"><DDayBadge endDate={contest.endDate} /></div>
        <div className="mt-4 grid gap-2">
          <a href={supportUrl} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center rounded-xl bg-white px-4 text-sm font-bold text-[#183322] transition hover:bg-[#f0f6f1]">주최 측 원문에서 지원하기</a>
          <Link to={`/contests/${contest.id}/rooms`} className="flex h-12 items-center justify-center rounded-xl border border-white/60 bg-white/10 px-4 text-sm font-bold transition hover:bg-white/20">이 공모전의 모집 방 보기</Link>
          <Link to={`/contests/${contest.id}/rooms/new`} className="flex h-12 items-center justify-center rounded-xl border border-white/60 bg-white/10 px-4 text-sm font-bold transition hover:bg-white/20">이 공모전에 방 만들기</Link>
          <div className="flex justify-center rounded-xl border border-white/60 bg-white/10 py-1 [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-white [&_button]:hover:bg-white/10"><BookmarkButton contestId={contest.id} /></div>
        </div>
      </aside>
    </div>

    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <article className="rounded-[28px] border border-[#dce2da] bg-white p-6 shadow-[0_4px_12px_rgba(16,42,94,0.05)] sm:p-7">
        <h2 className="text-[19px] font-bold text-[#0f234c]">공모전 안내</h2>
        <p className="mt-4 break-keep text-sm leading-6 text-slate-700">공모아뷰는 공고 본문 설명을 제공하지 않아요. 지원 조건과 상세 내용은 주최 측 원문에서 확인해 주세요.</p>
        {contest.periodMismatch && <p role="alert" className="mt-4 rounded-xl bg-[#fff4e5] px-4 py-3 text-sm font-medium text-[#9a4508]">출처마다 접수 기간이 다를 수 있어요. 지원 전 원문 공고를 꼭 확인해 주세요.</p>}
        {optionalDetails.length > 0 && <dl className="mt-6 grid gap-3 border-t border-[#e6ebe3] pt-5 sm:grid-cols-3">{optionalDetails.map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 text-sm font-bold text-[#0f234c]">{value}</dd></div>)}</dl>}
      </article>

      <aside className="h-fit rounded-[22px] border border-[#dce2da] bg-white p-[22px] shadow-[0_4px_12px_rgba(16,42,94,0.05)]">
        <h2 className="text-[15px] font-bold text-[#0f234c]">공고 출처</h2>
        <p className="mt-3 text-[13px] leading-5 text-slate-500">공모아뷰에서 수집한 공고예요. 원문 공고에서 최신 정보와 지원 방법을 확인할 수 있어요.</p>
        <a href={contest.gongmoaUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-bold text-[#1d6a43] underline underline-offset-4">공모아뷰 공고 보기</a>
      </aside>
    </div>
  </>
}

function StatusCard({ title }: { title: string }) {
  return <div className="mt-5 rounded-[28px] border border-[#dce2da] bg-white px-6 py-16 text-center shadow-[0_4px_12px_rgba(16,42,94,0.05)]"><h1 className="text-xl font-bold text-[#0f234c]">{title}</h1><p className="mt-2 text-sm text-slate-500">추천 공모전 목록에서 다른 공고를 선택해 주세요.</p></div>
}

function Tag({ children }: { children: string }) {
  return <span className="inline-flex h-7 items-center rounded-full bg-[#eef1ec] px-3 text-[13px] font-medium text-[#3b4840]">{children}</span>
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <div className="flex min-h-[80px] items-center gap-3 rounded-[18px] bg-[#f3f6f2] px-[18px] py-4"><span className="text-lg text-[#1d6a43]" aria-hidden="true">{icon}</span><div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 break-keep text-sm font-bold text-[#0f234c]">{value}</p></div></div>
}

function formatPeriod(startDate: string | null, endDate: string | null) {
  const format = (date: string | null) => date ? date.replaceAll('-', '.') : null
  if (!startDate && !endDate) return null
  return [format(startDate), format(endDate)].filter(Boolean).join(' ~ ')
}
