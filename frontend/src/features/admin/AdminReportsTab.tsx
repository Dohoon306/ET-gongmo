import ProfileAvatar from '../../common/ProfileAvatar.tsx'
import { useGet } from '../team/api.ts'
import { Card, ErrorText } from '../team/ui.tsx'
import { SOURCE_LABELS, reasonLabel, type AdminReport } from './adminApi.ts'

export default function AdminReportsTab() {
  const { data, error } = useGet<AdminReport[]>('/api/admin/reports')

  return (
    <>
      <ErrorText message={error} />
      {data && data.length === 0 && <Card className="px-6 py-10 text-center text-sm text-muted">들어온 신고가 없어요.</Card>}
      <ul className="space-y-3">
        {data?.map((r) => (
          <li key={r.id}>
            <Card className="px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold">
                  <span className="inline-flex items-center gap-1.5"><ProfileAvatar userId={r.reporterId} name={r.reporterName} className="size-6 rounded-sm text-xs" />{r.reporterName}</span>
                  →
                  <span className="inline-flex items-center gap-1.5 text-danger"><ProfileAvatar userId={r.targetId} name={r.targetName} className="size-6 rounded-sm text-xs" />{r.targetName}</span>
                </p>
                <span className="text-xs text-muted">
                  {SOURCE_LABELS[r.source]}
                  {r.roomTitle ? ` · ${r.roomTitle}` : ''} · {r.createdAt.replace('T', ' ').slice(0, 16)}
                </span>
              </div>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {r.reasons.map((code) => (
                  <li key={code} className="rounded-sm bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">
                    {reasonLabel(code)}
                  </li>
                ))}
              </ul>
              {r.detail && <p className="mt-2 text-sm whitespace-pre-wrap">{r.detail}</p>}
              {r.messages.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-brand hover:text-brand-strong">신고 당시 대화 {r.messages.length}개 보기</summary>
                  <ul className="mt-2 max-h-72 space-y-1.5 overflow-y-auto rounded-md bg-page px-4 py-3 text-sm">
                    {r.messages.map((m, i) => (
                      <li key={i} className={m.senderId === r.targetId ? 'font-medium text-danger' : ''}>
                        <span className="text-xs text-muted">{m.sentAt.slice(5, 16).replace('T', ' ')}</span>{' '}
                        <span className="inline-flex items-center gap-1.5 align-middle font-semibold">
                          <ProfileAvatar userId={m.senderId} name={m.senderName} className="size-5 rounded-sm text-[10px]" />
                          {m.senderName}
                        </span>: {m.content}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
