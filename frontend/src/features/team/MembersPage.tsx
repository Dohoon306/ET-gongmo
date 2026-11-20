import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { getDeadline } from '../../common/deadline.ts'
import { ChevronLeftIcon, ChevronRightIcon } from '../../common/icons.tsx'
import { idParam, teamComposition, useGet, type Person, type Room } from './api.ts'
import { MemberActions, RoomActions } from './RoomManage.tsx'
import { Avatar, Card, ErrorText, MissingId, StatusChip, Tags, TeamPage, secondaryButton } from './ui.tsx'

export default function MembersPage() {
  const roomId = idParam(useParams().roomId)
  const room = useGet<Room>(roomId ? `/api/rooms/${roomId}` : null)
  const members = useGet<Person[]>(roomId ? `/api/rooms/${roomId}/members` : null)
  const [manageError, setManageError] = useState<string | null>(null)
  const refresh = () => {
    setManageError(null)
    room.reload()
    members.reload()
  }

  if (!roomId) return <MissingId what="방" sample="/rooms/1/members" />

  const r = room.data
  const full = r?.status === 'FULL'
  const newest = full ? members.data?.filter((m) => m.role !== 'HOST').at(-1) : undefined
  const roleLabel = (m: Person) => (m.role === 'HOST' ? '방장' : m.id === newest?.id ? '새 팀원' : '팀원')

  return (
    <TeamPage>
      <Link to="/my/team" className="mb-3.5 inline-flex min-h-8 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeftIcon />내 팀 목록
      </Link>

      {full && r && (
        <div role="status" className="mb-7 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-brand-soft px-4 py-3 text-brand">
          <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m3 8.5 3.2 3L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[15px] font-semibold">팀이 확정됐어요</span>
          <span className="text-sm">
            {newest ? `${newest.name} 님이 합류해서 ` : ''}정원 {r.capacity}명이 모두 찼어요.
          </span>
        </div>
      )}

      {r && (
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[26px] font-bold leading-[1.3] tracking-[-0.02em]">{r.title}</h1>
              <StatusChip full={r.status !== 'RECRUITING'} />
            </div>
            {r.contest && (
              <Link to={`/contests/${r.contest.id}`} className="mt-1 inline-block break-keep text-[15px] text-brand hover:text-brand-strong hover:underline">
                {r.contest.title} · {getDeadline(r.contest.endDate).date}
              </Link>
            )}
          </div>
          {r.contest?.applyUrl && (
            <a href={r.contest.applyUrl} target="_blank" rel="noreferrer" className={secondaryButton}>
              원문에서 팀으로 지원하기
              <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M9 3h4v4M13 3 7 9M11 9.5V13H3V5h3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          )}
        </div>
      )}
      <ErrorText message={room.error ?? members.error ?? manageError} />

      {members.data && (
        <div className="grid items-start gap-5 md:grid-cols-[1fr_300px]">
          <Card className="px-6 pt-[22px] pb-1.5">
            <p className="mb-1.5 text-lg font-bold tracking-[-0.01em]">팀원 <span className="tabular-nums">{members.data.length}</span>명</p>
            <ul className="divide-y divide-line border-t border-line">
              {members.data.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-3.5 py-[18px]">
                  <Avatar name={m.name} size="lg" userId={m.userId} />
                  <div className="min-w-0 flex-1">
                    <p className="mb-2 text-[15px] font-semibold">
                      <Link to={`/users/${m.userId}`} className="hover:underline">
                        {m.name}
                      </Link>
                      <span className="ml-1.5 text-xs font-semibold text-brand">{roleLabel(m)}</span>
                    </p>
                    <Tags tags={m.tags} />
                  </div>
                  <Link to={`/users/${m.userId}`} className="inline-flex min-h-11 shrink-0 items-center gap-0.5 text-sm font-semibold text-brand hover:text-brand-strong">
                    프로필<ChevronRightIcon className="size-[13px]" />
                  </Link>
                  {r && <MemberActions room={r} member={m} onChanged={refresh} onError={setManageError} />}
                </li>
              ))}
            </ul>
            {r && <RoomActions room={r} memberCount={members.data.length} />}
          </Card>

          <Card muted className="p-5">
            <p className="mb-3 text-[15px] font-semibold">우리 팀 구성</p>
            <ul className="divide-y divide-line border-y border-line">
              {teamComposition(members.data).map(({ tag, count }) => (
                <li key={tag.id} className="flex justify-between gap-3 py-[9px] text-sm">
                  <span className="text-ink-2">{tag.name}</span>
                  <span className="font-semibold tabular-nums">{count}명</span>
                </li>
              ))}
            </ul>
            <p className="mt-3.5 break-keep text-[13px] leading-relaxed text-muted">
              공모전이 끝나면 프로필의 ‘함께한 팀’에서 서로를 익명으로 평가할 수 있어요.
            </p>
          </Card>
        </div>
      )}
    </TeamPage>
  )
}
