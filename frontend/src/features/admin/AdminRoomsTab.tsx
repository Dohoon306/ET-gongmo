import { useState } from 'react'
import { Link } from 'react-router'
import { api } from '../../api/client.ts'
import { useGet } from '../team/api.ts'
import { Card, ErrorText, dangerButton, secondaryButton } from '../team/ui.tsx'
import type { AdminRoom } from './adminApi.ts'

const STATUS_LABELS: Record<AdminRoom['status'], string> = {
  RECRUITING: '모집 중',
  FULL: '모집 완료',
  CLOSED: '마감(종료)',
}

const STATUS_STYLES: Record<AdminRoom['status'], string> = {
  RECRUITING: 'bg-brand-soft text-brand',
  FULL: 'bg-subtle text-muted',
  CLOSED: 'bg-accent-soft text-accent',
}

export default function AdminRoomsTab() {
  const { data, error, reload } = useGet<AdminRoom[]>('/api/admin/rooms')
  const [query, setQuery] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  async function act(room: AdminRoom, action: 'close' | 'delete') {
    const message =
      action === 'close'
        ? `"${room.title}" 방을 마감할까요? 공모전이 끝난 팀으로 바뀌어 모집이 멈추고, 대기 중인 참가 요청은 거절돼요. 팀원끼리 서로 평가할 수 있게 돼요.`
        : `"${room.title}" 방을 지울까요? 팀원, 참가 요청, 팀 채팅, 이 팀에서 남긴 평가가 모두 지워지고 되돌릴 수 없어요.`
    if (!window.confirm(message)) return
    setActionError(null)
    try {
      await api(action === 'close' ? `/api/admin/rooms/${room.id}/close` : `/api/admin/rooms/${room.id}`, {
        method: action === 'close' ? 'POST' : 'DELETE',
      })
      reload()
    } catch (e) {
      setActionError((e as Error).message)
    }
  }

  const q = query.trim().toLowerCase()
  const shown =
    data?.filter((r) =>
      [r.title, r.hostName, r.contestTitle ?? ''].some((text) => text.toLowerCase().includes(q)),
    ) ?? []

  return (
    <>
      <ErrorText message={error ?? actionError} />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="방 제목, 방장, 공모전으로 검색"
        aria-label="모집 방 검색"
        className="mb-4 h-10 w-full rounded-md border border-line-strong bg-white px-3 text-[15px]"
      />
      <p className="mb-3 text-[13px] text-muted">모집 방 {shown.length}개</p>
      {data && shown.length === 0 && <Card className="px-6 py-10 text-center text-sm text-muted">방이 없어요.</Card>}
      <ul className="space-y-3">
        {shown.map((r) => (
          <li key={r.id}>
            <Card className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold">
                  <Link to={`/rooms/${r.id}/members`} className="hover:underline">
                    #{r.id} {r.title}
                  </Link>
                  <span className={`rounded-sm px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                    {STATUS_LABELS[r.status]}
                  </span>
                </p>
                <p className="mt-1 truncate text-sm text-ink-2">
                  {r.contestId ? (
                    <Link to={`/contests/${r.contestId}`} className="hover:underline">
                      {r.contestTitle}
                    </Link>
                  ) : (
                    '연결된 공모전 없음'
                  )}
                  {r.contestEndDate ? ` · ${r.contestEndDate} 마감` : ''}
                </p>
                <p className="mt-1 text-xs text-muted">
                  방장 {r.hostName} · {r.memberCount} / {r.capacity}명
                  {r.pendingRequests > 0 ? ` · 대기 요청 ${r.pendingRequests}건` : ''} · 만든 날 {r.createdAt.slice(0, 10)}
                </p>
              </div>
              {r.status !== 'CLOSED' && (
                <button onClick={() => act(r, 'close')} className={secondaryButton}>
                  공모전 마감 처리
                </button>
              )}
              <button onClick={() => act(r, 'delete')} className={dangerButton}>
                방 삭제
              </button>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
