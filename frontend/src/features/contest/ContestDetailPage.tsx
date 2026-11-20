import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { api } from '../../api/client.ts'
import { getDeadline } from '../../common/deadline.ts'
import { ChevronLeftIcon } from '../../common/icons.tsx'
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
    <section>
      <div>
        <Link to="/contests" className="inline-flex min-h-8 items-center gap-1.5 text-sm font-medium text-muted transition hover:text-ink"><ChevronLeftIcon />추천 공모전으로</Link>
        {!contest && !error && <StatusCard title="공모전 정보를 불러오는 중이에요." />}
        {error && <StatusCard title={error} />}
        {contest && <ContestContent contest={contest} />}
      </div>
    </section>
  )
}

function getOrganizerUrl(value: string | null): string | null {
  if (!value) return null

  try {
    const url = new URL(value)
    const hostname = url.hostname.replace(/\.$/, '')
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    if (hostname === 'gongmoaview.com' || hostname.endsWith('.gongmoaview.com')) return null
    return url.href
  } catch {
    return null
  }
}

function ContestContent({ contest }: { contest: ContestDetail }) {
  const primaryReward = contest.prize || contest.benefit
  const supportUrl = getOrganizerUrl(contest.sourceUrl)
  const period = formatPeriod(contest.startDate, contest.endDate)
  const deadline = getDeadline(contest.endDate)
  const optionalDetails = [
    ['활동 기간', contest.activityPeriod],
    ['장소·방식', contest.locationMethod],
    ['비용', contest.cost],
  ].filter((detail): detail is [string, string] => Boolean(detail[1]))

  return <>
    <div className="mt-4 grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <article className="rounded-lg border border-line bg-white p-6 sm:p-7">
        <div className="flex flex-wrap gap-1.5">
          {contest.type && <Tag>{contest.type}</Tag>}
          {contest.categories.map((category) => <Tag key={category}>{category}</Tag>)}
        </div>
        <h1 className="mt-[18px] break-keep text-[26px] font-bold leading-[1.4] tracking-[-0.02em] text-ink">{contest.title}</h1>
        <p className="mt-2 text-sm font-medium text-muted">{contest.host || '주최 정보 없음'}</p>
        <dl className="mt-6 grid gap-x-7 border-t border-line sm:grid-cols-2">
          <InfoItem label={contest.prize ? '1등 상금' : '혜택'} value={primaryReward || '상세 공고 확인'} />
          <InfoItem label="접수 기간" value={period || '상시 모집'} />
          <InfoItem label="대상" value={contest.target || '상세 공고 확인'} />
          <InfoItem label="분야" value={contest.categories.length ? contest.categories.join(' · ') : '분류 준비 중'} />
        </dl>
      </article>

      <aside className="rounded-lg border border-line bg-page p-[22px]">
        <p className="text-[13px] font-medium text-muted">마감까지</p>
        <p className="mt-0.5 flex flex-wrap items-baseline gap-2.5 tabular-nums">
          <strong className={`text-[40px] font-bold leading-[1.2] tracking-[-0.02em] ${deadline.urgent ? 'text-accent' : deadline.expired ? 'text-muted' : 'text-ink'}`}>{deadline.label}</strong>
          {deadline.date && <time dateTime={contest.endDate ?? undefined} className="text-sm text-muted">{deadline.date}</time>}
        </p>
        <div className="mt-[18px] grid gap-2">
          {supportUrl ? (
            <a href={supportUrl} target="_blank" rel="noreferrer" className="flex h-12 items-center justify-center rounded-md bg-brand px-4 text-[15px] font-semibold text-white transition hover:bg-brand-strong">주최 측 원문에서 지원하기</a>
          ) : (
            <p className="rounded-md bg-subtle px-4 py-3 text-center text-sm text-muted">주최 측 지원 링크를 확인할 수 없어요.</p>
          )}
          <Link to={`/contests/${contest.id}/rooms`} className="flex h-11 items-center justify-center rounded-md border border-line-strong bg-white px-4 text-sm font-semibold text-ink transition hover:bg-subtle">이 공모전의 모집 방 보기</Link>
          <Link to={`/contests/${contest.id}/rooms/new`} className="flex h-11 items-center justify-center rounded-md border border-line-strong bg-white px-4 text-sm font-semibold text-ink transition hover:bg-subtle">이 공모전에 방 만들기</Link>
          <div className="[&_button]:h-11 [&_button]:w-full [&_button]:text-sm"><BookmarkButton contestId={contest.id} /></div>
        </div>
      </aside>
    </div>

    <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <article className="rounded-lg border border-line bg-white p-6 sm:p-7">
        <h2 className="text-lg font-bold tracking-[-0.01em] text-ink">공모전 안내</h2>
        <p className="mt-3 break-keep text-sm leading-[1.7] text-ink-2">공모아뷰는 공고 본문 설명을 제공하지 않아요. 지원 조건과 상세 내용은 주최 측 원문에서 확인해 주세요.</p>
        {contest.periodMismatch && <p role="alert" className="mt-4 rounded-md bg-accent-soft px-4 py-3 text-sm font-medium text-accent">출처마다 접수 기간이 다를 수 있어요. 지원 전 원문 공고를 꼭 확인해 주세요.</p>}
        {optionalDetails.length > 0 && <dl className="mt-6 grid gap-3 border-t border-line pt-5 sm:grid-cols-3">{optionalDetails.map(([label, value]) => <div key={label}><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 text-sm font-semibold text-ink">{value}</dd></div>)}</dl>}
      </article>

      <aside className="rounded-lg border border-line bg-white p-[22px]">
        <h2 className="text-[15px] font-bold text-ink">공고 출처</h2>
        <p className="mt-3 text-[13px] leading-5 text-muted">공모아뷰에서 수집한 공고예요. 원문 공고에서 최신 정보와 지원 방법을 확인할 수 있어요.</p>
        <a href={contest.gongmoaUrl} target="_blank" rel="noreferrer" className="mt-2.5 inline-flex min-h-8 items-center text-sm font-semibold text-brand underline underline-offset-4 hover:text-brand-strong">공모아뷰 공고 보기</a>
      </aside>
    </div>
  </>
}

function StatusCard({ title }: { title: string }) {
  return <div className="mt-4 rounded-lg border border-line bg-white px-6 py-16 text-center"><h1 className="text-xl font-bold text-ink">{title}</h1><p className="mt-2 text-sm text-muted">추천 공모전 목록에서 다른 공고를 선택해 주세요.</p></div>
}

function Tag({ children }: { children: string }) {
  return <span className="inline-flex h-[26px] items-center rounded-sm border border-line px-2 text-[13px] font-medium text-ink-2">{children}</span>
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-line py-4"><dt className="text-xs font-medium text-muted">{label}</dt><dd className="mt-1 break-keep text-base font-semibold text-ink">{value}</dd></div>
}

function formatPeriod(startDate: string | null, endDate: string | null) {
  const format = (date: string | null) => date ? date.replaceAll('-', '.') : null
  if (!startDate && !endDate) return null
  return [format(startDate), format(endDate)].filter(Boolean).join(' ~ ')
}
