import { StarIcon } from '../../common/icons.tsx'
import { useState } from 'react'
import { api } from '../../api/client.ts'
import { useGet } from '../team/api.ts'
import { Card, ErrorText, dangerButton } from '../team/ui.tsx'
import type { AdminEvaluation, AdminUser } from './adminApi.ts'

export default function AdminEvaluationsTab() {
  const [userFilter, setUserFilter] = useState('')
  const [query, setQuery] = useState('')
  const users = useGet<AdminUser[]>('/api/admin/users')
  const q = query.trim().toLowerCase()
  const matchedUsers = users.data?.filter((u) => u.name.toLowerCase().includes(q) || String(u.id) === q) ?? []
  const { data, error, reload } = useGet<AdminEvaluation[]>(
    `/api/admin/evaluations${userFilter ? `?userFilter=${userFilter}` : ''}`,
  )
  const [actionError, setActionError] = useState<string | null>(null)
  const shown =
    userFilter || !q
      ? (data ?? [])
      : (data ?? []).filter((e) => [e.evaluatorName, e.targetName].some((n) => n.toLowerCase().includes(q)))

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
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold">사람별로 보기</span>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            const text = e.target.value.trim().toLowerCase()
            const found = users.data?.filter((u) => u.name.toLowerCase().includes(text) || String(u.id) === text) ?? []
            setUserFilter(text && found.length === 1 ? String(found[0].id) : '')
          }}
          placeholder="이름이나 번호로 검색"
          aria-label="평가를 볼 사람 검색"
          className="h-10 min-w-0 flex-1 rounded-md border border-line-strong bg-white px-3"
        />
        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          aria-label="평가를 볼 사람"
          className="h-10 rounded-md border border-line-strong bg-white px-3"
        >
          <option value="">{q ? `검색 결과 ${matchedUsers.length}명` : '전체'}</option>
          {matchedUsers.map((u) => (
            <option key={u.id} value={u.id}>
              #{u.id} {u.name}
            </option>
          ))}
        </select>
      </div>
      {data && shown.length === 0 && <Card className="px-6 py-10 text-center text-sm text-muted">평가가 없어요.</Card>}
      <ul className="space-y-3">
        {shown.map((e) => (
          <li key={e.id}>
            <Card className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1 text-sm">
                <p className="text-[15px] font-semibold">
                  {e.evaluatorName} → {e.targetName}
                  <span className="ml-2"><span className="inline-flex items-center gap-1 align-[-2px] font-semibold tabular-nums text-accent"><StarIcon className="size-[13px]" />{e.score}</span></span>
                </p>
                <p className="mt-1">{e.comment ?? '(코멘트 없음)'}</p>
                <p className="mt-1 text-xs text-muted">
                  팀 {e.roomTitle} · {e.createdAt.replace('T', ' ').slice(0, 16)}
                </p>
              </div>
              <button onClick={() => remove(e.id)} className={dangerButton}>
                제거
              </button>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
