import { useState } from 'react'
import { api } from '../../api/client.ts'
import { useGet } from '../team/api.ts'
import { Card, ErrorText, secondaryButton } from '../team/ui.tsx'
import type { AdminEvaluation, AdminUser } from './adminApi.ts'

export default function AdminEvaluationsTab() {
  const [userFilter, setUserFilter] = useState('')
  const users = useGet<AdminUser[]>('/api/admin/users')
  const { data, error, reload } = useGet<AdminEvaluation[]>(
    `/api/admin/evaluations${userFilter ? `?userFilter=${userFilter}` : ''}`,
  )
  const [actionError, setActionError] = useState<string | null>(null)

  async function remove(id: number) {
    if (!window.confirm('이 평가를 지울까요? 되돌릴 수 없어요.')) return
    setActionError(null)
    try {
      await api(`/api/admin/evaluations/${id}`, { method: 'DELETE' })
      reload()
    } catch (e) {
      setActionError((e as Error).message)
    }
  }

  return (
    <>
      <ErrorText message={error ?? actionError} />
      <label className="mb-4 flex items-center gap-2 text-sm">
        <span className="font-semibold">사람별로 보기</span>
        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="h-10 rounded-xl border border-(--color-line-strong) bg-white px-3"
        >
          <option value="">전체</option>
          {users.data?.map((u) => (
            <option key={u.id} value={u.id}>
              #{u.id} {u.name}
            </option>
          ))}
        </select>
      </label>
      {data && data.length === 0 && <Card className="px-6 py-10 text-center text-sm text-(--color-muted)">평가가 없어요.</Card>}
      <ul className="space-y-3">
        {data?.map((e) => (
          <li key={e.id}>
            <Card className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1 text-sm">
                <p className="text-[15px] font-semibold">
                  {e.evaluatorName} → {e.targetName}
                  <span className="ml-2 text-(--color-accent)">★ {e.score}</span>
                </p>
                <p className="mt-1">{e.comment ?? '(코멘트 없음)'}</p>
                <p className="mt-1 text-xs text-(--color-muted)">
                  팀 {e.roomTitle} · {e.createdAt.replace('T', ' ').slice(0, 16)}
                </p>
              </div>
              <button onClick={() => remove(e.id)} className={`${secondaryButton} text-red-700`}>
                제거
              </button>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
