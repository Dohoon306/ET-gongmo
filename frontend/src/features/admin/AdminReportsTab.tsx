import { useGet } from '../team/api.ts'
import { Card, ErrorText } from '../team/ui.tsx'
import { SOURCE_LABELS, reasonLabel, type AdminReport } from './adminApi.ts'

export default function AdminReportsTab() {
  const { data, error } = useGet<AdminReport[]>('/api/admin/reports')

  return (
    <>
      <ErrorText message={error} />
      {data && data.length === 0 && <Card className="px-6 py-10 text-center text-sm text-(--color-muted)">들어온 신고가 없어요.</Card>}
      <ul className="space-y-3">
        {data?.map((r) => (
          <li key={r.id}>
            <Card className="px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[15px] font-semibold">
                  {r.reporterName} → <span className="text-red-700">{r.targetName}</span>
                </p>
                <span className="text-xs text-(--color-muted)">
                  {SOURCE_LABELS[r.source]}
                  {r.roomTitle ? ` · ${r.roomTitle}` : ''} · {r.createdAt.replace('T', ' ').slice(0, 16)}
                </span>
              </div>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {r.reasons.map((code) => (
                  <li key={code} className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                    {reasonLabel(code)}
                  </li>
                ))}
              </ul>
              {r.detail && <p className="mt-2 text-sm whitespace-pre-wrap">{r.detail}</p>}
              {r.messages.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-brand">신고 당시 대화 {r.messages.length}개 보기</summary>
                  <ul className="mt-2 max-h-72 space-y-1.5 overflow-y-auto rounded-xl bg-(--color-page) px-4 py-3 text-sm">
                    {r.messages.map((m, i) => (
                      <li key={i} className={m.senderId === r.targetId ? 'font-medium text-red-700' : ''}>
                        <span className="text-xs text-(--color-muted)">{m.sentAt.slice(5, 16).replace('T', ' ')}</span>{' '}
                        <span className="font-semibold">{m.senderName}</span>: {m.content}
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
