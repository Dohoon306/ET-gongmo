import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { api } from '../../api/client.ts'
import { useCurrentUser } from '../../common/useCurrentUser.ts'
import { idParam, timeAgo, useGet, type Person, type Room } from './api.ts'
import { Avatar, Card, EmptyState, ErrorText, MissingId, Tags, TeamPage, primaryButton, secondaryButton } from './ui.tsx'

export function MyRequestsPage() {
  const { userId } = useCurrentUser()
  const { data, error } = useGet<{ roomId: number | null }>(userId ? '/api/my/room?hostOnly=true' : null)
  if (userId && data?.roomId) return <Navigate replace to={`/rooms/${data.roomId}/requests`} />
  return (
    <TeamPage>
      <ErrorText message={error} />
      {(!userId || data) && (
        <EmptyState title={userId ? '아직 방장인 팀이 없어요' : '사용자를 먼저 골라 주세요'}>
          {userId && (
            <Link to="/contests" className={`${primaryButton} mt-5`}>
              추천 공모전 보러 가기
            </Link>
          )}
        </EmptyState>
      )}
    </TeamPage>
  )
}

export default function ReceivedRequestsPage() {
  const roomId = idParam(useParams().roomId)
  const room = useGet<Room>(roomId ? `/api/rooms/${roomId}` : null)
  const requests = useGet<Person[]>(roomId ? `/api/rooms/${roomId}/join-requests` : null)
  const members = useGet<Person[]>(roomId ? `/api/rooms/${roomId}/members` : null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  if (!roomId) return <MissingId what="방" sample="/rooms/1/requests" />

  async function decide(requestId: number, action: 'accept' | 'reject') {
    setBusyId(requestId)
    setError(null)
    try {
      await api(`/api/join-requests/${requestId}/${action}`, { method: 'POST' })
      room.reload()
      requests.reload()
      members.reload()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  const r = room.data
  const lastSeat = r ? r.memberCount + 1 >= r.capacity : false

  return (
    <TeamPage>
      <h1 className="text-[28px] font-bold">받은 참가 요청</h1>
      {r && (
        <p className="mt-2 mb-6 text-[15px] text-(--color-muted)">
          {r.title} · 지금 {r.memberCount} / {r.capacity}명
        </p>
      )}

      {r?.status === 'FULL' && (
        <div className="mb-5 flex items-center justify-between rounded-xl bg-brand px-5 py-3.5 text-sm text-white">
          <span className="font-semibold">✓ 정원이 다 차서 팀이 확정됐어요</span>
          <Link to={`/rooms/${roomId}/members`} className="font-semibold underline underline-offset-2">
            팀원 보기
          </Link>
        </div>
      )}

      <ErrorText message={requests.error ?? error} />

      <div className="grid items-start gap-5 md:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          {requests.data?.map((req) => (
            <Card key={req.id} className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={req.name} size="lg" userId={req.userId} />
                  <div>
                    <Link to={`/users/${req.userId}`} className="text-lg font-bold hover:underline">
                      {req.name}
                    </Link>
                    <p className="text-[13px] text-(--color-muted)">{timeAgo(req.createdAt)} · 답을 기다리는 중</p>
                  </div>
                </div>
                <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">
                  방과 {req.tags.filter((t) => t.matched).length}개 겹침
                </span>
              </div>
              <div className="mt-4">
                <Tags tags={req.tags} />
              </div>
              <p className="mt-4 rounded-xl bg-(--color-page) p-4 text-[15px] leading-relaxed whitespace-pre-wrap text-(--color-ink-2)">
                {req.message}
              </p>
              {lastSeat && r && (
                <p className="mt-4 flex items-center gap-1.5 text-sm text-(--color-ink-2)">
                  <span aria-hidden className="text-(--color-muted)">ⓘ</span>
                  수락하면 정원 {r.capacity}명이 모두 차서 모집이 완료돼요.
                </p>
              )}
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => decide(req.id, 'reject')} disabled={busyId !== null} className={secondaryButton}>
                  거절
                </button>
                <button onClick={() => decide(req.id, 'accept')} disabled={busyId !== null} className={primaryButton}>
                  수락
                </button>
              </div>
            </Card>
          ))}
          {requests.data?.length === 0 && <EmptyState title="대기 중인 요청이 없어요" />}
        </div>

        {r && members.data && (
          <Card className="p-5">
            <p className="mb-4 text-[15px] font-semibold">
              지금 팀원 <span className="ml-1 font-normal text-(--color-muted)">{r.memberCount} / {r.capacity}명</span>
            </p>
            <ul className="divide-y divide-line">
              {members.data.map((m) => (
                <li key={m.id} className="py-4 first:pt-0 last:pb-0">
                  <p className="mb-2 text-[15px] font-semibold">
                    {m.name}
                    {m.role === 'HOST' && <span className="ml-1.5 text-xs font-medium text-brand">방장</span>}
                  </p>
                  <Tags tags={m.tags.filter((t) => t.axis !== 'FIELD').slice(0, 3)} />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </TeamPage>
  )
}
