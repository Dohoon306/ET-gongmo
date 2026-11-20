import { StarIcon } from '../../common/icons.tsx'
import { useState } from 'react'
import { api } from '../../api/client.ts'
import { useGet } from '../team/api.ts'
import { Card, ErrorText, primaryButton, secondaryButton } from '../team/ui.tsx'
import { APPEAL_LABELS, type AdminAppeal } from './adminApi.ts'

export default function AdminAppealsTab() {
  const { data, error, reload } = useGet<AdminAppeal[]>('/api/admin/appeals')
  const [actionError, setActionError] = useState<string | null>(null)

  async function decide(id: number, action: 'remove' | 'reject') {
    if (action === 'remove' && !window.confirm('이 평가를 지울까요? 되돌릴 수 없어요.')) return
    setActionError(null)
    try {
      await api(`/api/admin/appeals/${id}/${action}`, { method: 'POST' })
      reload()
    } catch (e) {
      setActionError((e as Error).message)
    }
  }

  return (
    <>
      <ErrorText message={error ?? actionError} />
      {data && data.length === 0 && <Card className="px-6 py-10 text-center text-sm text-muted">들어온 항의가 없어요.</Card>}
      <ul className="space-y-3">
        {data?.map((a) => (
          <li key={a.id}>
            <Card className="px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[15px] font-semibold">
                  {a.targetName ?? `#${a.targetId}`} 님의 항의
                  <span className="ml-2 text-xs font-medium text-muted">{a.createdAt.replace('T', ' ').slice(0, 16)}</span>
                </p>
                <span
                  className={`rounded-sm px-1.5 py-0.5 text-xs font-medium ${a.status === 'PENDING' ? 'bg-accent-soft text-accent' : 'bg-subtle text-muted'}`}
                >
                  {APPEAL_LABELS[a.status]}
                </span>
              </div>
              <div className="mt-3 rounded-md bg-page px-4 py-3 text-sm">
                <p>
                  <span className="inline-flex items-center gap-1 align-[-2px] font-semibold tabular-nums text-accent"><StarIcon className="size-[13px]" />{a.score}</span> {a.comment ?? '(코멘트 없음)'}
                </p>
                <p className="mt-1 text-xs text-muted">
                  평가한 사람 {a.evaluatorName ?? `#${a.evaluatorId}`} · 팀 {a.roomTitle ?? '-'}
                </p>
              </div>
              <p className="mt-3 text-sm">
                <span className="font-semibold">항의 이유</span> {a.reason}
              </p>
              {a.status === 'PENDING' && (
                <div className="mt-3 flex justify-end gap-2">
                  <button onClick={() => decide(a.id, 'reject')} className={secondaryButton}>
                    기각
                  </button>
                  <button onClick={() => decide(a.id, 'remove')} className={primaryButton}>
                    평가 제거
                  </button>
                </div>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
