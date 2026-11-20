import ProfileAvatar from '../../common/ProfileAvatar.tsx'
import { useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../../api/client.ts'
import { REPORT_REASONS, type ReportSource } from './adminApi.ts'

export type ReportContext = { source: ReportSource; roomId?: number }

type Props = { targetId: number; targetName: string; context: ReportContext; onClose: () => void }

export default function ReportDialog({ targetId, targetName, context, onClose }: Props) {
  const [reasons, setReasons] = useState<string[]>([])
  const [detail, setDetail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  const toggle = (code: string) =>
    setReasons((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))
  const needsDetail = reasons.includes('ETC') && !detail.trim()

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      await api('/api/reports', {
        method: 'POST',
        body: { targetId, reasons, detail: detail.trim(), source: context.source, roomId: context.roomId ?? null },
      })
      setDone(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSending(false)
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg bg-white p-6 text-ink shadow-[0_12px_32px_rgba(24,33,27,0.28)]"
      >
        <h2 id="report-title" className="flex items-center gap-2 text-lg font-bold tracking-[-0.01em]">
          <ProfileAvatar userId={targetId} name={targetName} className="size-8 rounded-md text-sm" />
          <span>{targetName} 님 신고하기</span>
        </h2>
        {done ? (
          <>
            <p className="mt-3 text-sm text-ink-2">신고가 접수됐어요. 관리자가 확인할게요.</p>
            {context.source !== 'PROFILE' && (
              <p className="mt-1 text-xs text-muted">최근 대화 내용도 함께 관리자에게 전달됐어요.</p>
            )}
            <div className="mt-5 flex justify-end">
              <button autoFocus onClick={onClose} className="h-11 rounded-md bg-brand px-4 text-[15px] font-semibold text-white hover:bg-brand-strong">
                닫기
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submit}>
            <fieldset className="mt-4">
              <legend className="text-sm font-semibold">무엇 때문에 신고하나요? (여러 개 고를 수 있어요)</legend>
              <div className="mt-2 space-y-2">
                {REPORT_REASONS.map((r) => (
                  <label key={r.code} className="flex items-center gap-2 text-[15px]">
                    <input type="checkbox" checked={reasons.includes(r.code)} onChange={() => toggle(r.code)} className="h-4 w-4 accent-brand" />
                    {r.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="mt-4 block">
              <span className="text-sm font-semibold">신고 이유{reasons.includes('ETC') ? ' (필수)' : ''}</span>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="어떤 일이 있었는지 적어 주세요"
                className="mt-2 w-full rounded-md border border-line-strong px-3 py-2 text-[15px]"
              />
            </label>
            {context.source !== 'PROFILE' && (
              <p className="mt-1 text-xs text-muted">이 대화의 최근 메시지가 관리자에게 함께 전달돼요.</p>
            )}
            {error && <p className="mt-2 text-sm text-danger">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="h-11 rounded-md border border-line-strong bg-white px-4 text-[15px] font-semibold hover:bg-subtle">
                취소
              </button>
              <button
                type="submit"
                disabled={reasons.length === 0 || needsDetail || sending}
                className="h-11 rounded-md bg-danger px-4 text-[15px] font-semibold text-white disabled:opacity-40"
              >
                신고하기
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}
