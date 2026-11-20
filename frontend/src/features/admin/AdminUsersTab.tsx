import { useState } from 'react'
import { Link } from 'react-router'
import { api } from '../../api/client.ts'
import { useGet } from '../team/api.ts'
import { Card, ErrorText, primaryButton, secondaryButton } from '../team/ui.tsx'
import type { AdminUser } from './adminApi.ts'

export default function AdminUsersTab() {
  const { data, error, reload } = useGet<AdminUser[]>('/api/admin/users')
  const [actionError, setActionError] = useState<string | null>(null)

  async function act(path: string, method: 'POST' | 'DELETE', body?: unknown) {
    setActionError(null)
    try {
      await api(path, { method, body })
      reload()
    } catch (e) {
      setActionError((e as Error).message)
    }
  }

  const suspend = (u: AdminUser) => {
    const reason = window.prompt(`${u.name} 님을 정지하는 이유를 적어 주세요 (비워 둬도 돼요)`, '')
    if (reason === null) return
    act(`/api/admin/users/${u.id}/suspension`, 'POST', { reason })
  }

  return (
    <>
      <ErrorText message={error ?? actionError} />
      <p className="mb-3 text-[13px] text-(--color-muted)">가입 계정 {data?.length ?? 0}개 · 정지된 계정은 모든 기능을 쓸 수 없어요</p>
      <ul className="space-y-3">
        {data?.map((u) => (
          <li key={u.id}>
            <Card className={`flex flex-wrap items-center gap-4 px-5 py-4 ${u.suspended ? 'border-red-300' : ''}`}>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold">
                  <Link to={`/users/${u.id}`} className="hover:underline">
                    #{u.id} {u.name}
                  </Link>
                  {u.admin && <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-xs text-brand">관리자</span>}
                  {u.suspended && <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-xs text-red-700">정지됨</span>}
                  {u.reportCount > 0 && (
                    <span className="rounded-md bg-(--color-accent-soft) px-1.5 py-0.5 text-xs text-(--color-accent)">
                      신고 {u.reportCount}건
                    </span>
                  )}
                </p>
                <p className="mt-1 truncate text-sm text-(--color-muted)">{u.intro ?? '자기소개 없음'}</p>
                {u.categories.length > 0 && <p className="mt-1 text-xs text-(--color-ink-2)">{u.categories.join(' · ')}</p>}
                {u.suspended && u.suspendReason && <p className="mt-1 text-xs text-red-700">정지 이유: {u.suspendReason}</p>}
                <p className="mt-1 text-xs text-(--color-muted)">가입 {u.createdAt.slice(0, 10)}</p>
              </div>
              {!u.admin && (
                <Link to={`/messages/${u.id}`} className={secondaryButton}>
                  쪽지
                </Link>
              )}
              {!u.admin &&
                (u.suspended ? (
                  <button onClick={() => act(`/api/admin/users/${u.id}/suspension`, 'DELETE')} className={primaryButton}>
                    정지 풀기
                  </button>
                ) : (
                  <button onClick={() => suspend(u)} className={`${secondaryButton} text-red-700`}>
                    정지
                  </button>
                ))}
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
