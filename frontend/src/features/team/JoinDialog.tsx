import { useEffect, useRef, useState } from 'react'
import { api } from '../../api/client.ts'
import type { Room } from './api.ts'
import { ErrorText, Tags, primaryButton, secondaryButton } from './ui.tsx'

export default function JoinDialog({ room, onClose, onSent }: { room: Room; onClose: () => void; onSent: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(true)
  const [sent, setSent] = useState(false)
  const draftUrl = `/api/rooms/${room.id}/join-requests/draft`
  const matched = room.tags.filter((t) => t.matched)
  const allMatched = matched.length > 0 && matched.length === room.tags.length

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const redraft = () =>
    run(async () => {
      const draft = await api<{ message: string }>(draftUrl, { method: 'POST' })
      setMessage(draft.message)
    })

  const send = () =>
    run(async () => {
      await api(`/api/rooms/${room.id}/join-requests`, { method: 'POST', body: { message } })
      setSent(true)
      onSent()
    })

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    let alive = true
    api<{ message: string }>(draftUrl, { method: 'POST' })
      .then((draft) => alive && setMessage(draft.message))
      .catch((e: Error) => alive && setError(e.message))
      .finally(() => alive && setBusy(false))
    return () => {
      alive = false
    }
  }, [draftUrl])

  const close = () => dialogRef.current?.close()

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="join-title"
      className="m-auto w-[min(640px,calc(100%-2rem))] rounded-lg p-0 text-ink shadow-[0_12px_32px_rgba(24,33,27,0.28)] backdrop:bg-ink/70"
    >
      <div className="p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold text-brand">참가 요청</p>
            <h2 id="join-title" className="mt-1 text-xl font-bold tracking-[-0.01em]">
              {room.title}
            </h2>
            <p className="mt-1 text-sm tabular-nums text-muted">
              {room.hostName} · {room.memberCount} / {room.capacity}명
            </p>
          </div>
          <button onClick={close} aria-label="닫기" className="-mt-2 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-md text-muted hover:bg-subtle">
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="m4 4 8 8M12 4l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-6 rounded-md bg-page p-4">
          <p className="mb-3 text-sm font-semibold">
            내 태그가 이 방과{' '}
            <span className="text-brand">
              {matched.length}개{allMatched ? ' 모두' : ''}
            </span>{' '}
            겹쳐요
          </p>
          <Tags tags={matched} />
        </div>

        {sent ? (
          <p role="status" className="mt-6 rounded-md bg-brand-soft px-4 py-3.5 text-sm font-semibold text-brand">
            요청을 보냈어요. 방장이 수락하면 팀이 확정돼요.
          </p>
        ) : (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="join-message" className="text-sm font-semibold">
                방장에게 보낼 메시지
              </label>
              <span className="inline-flex h-[22px] items-center rounded-sm bg-brand-soft px-[7px] text-xs font-semibold text-brand">
                AI가 쓴 초안
              </span>
            </div>
            <textarea
              id="join-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-md border border-brand p-3.5 text-[15px] leading-relaxed focus:outline-2 focus:outline-offset-1 focus:outline-brand"
              placeholder={busy ? 'AI가 초안을 쓰는 중이에요' : '방장에게 보낼 메시지를 써 주세요'}
            />
            <p className="mt-2 text-[13px] text-muted">내 태그와 방 소개를 보고 썼어요. 내 말투로 고쳐서 보내도 돼요.</p>
            <ErrorText message={error} />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          {sent ? (
            <button onClick={close} className={secondaryButton}>
              닫기
            </button>
          ) : (
            <>
              <button onClick={redraft} disabled={busy} className={secondaryButton}>
                <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M13 8a5 5 0 1 1-1.5-3.6M13 2.5v3h-3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                초안 다시 쓰기
              </button>
              <button onClick={send} disabled={busy || !message.trim()} className={primaryButton}>
                요청 보내기
              </button>
            </>
          )}
        </div>

        <p className="mt-6 border-t border-line pt-4 break-keep text-[13px] text-muted">
          방장이 수락하면 팀이 확정돼요. 답을 기다리는 동안에는 같은 방에 다시 요청할 수 없어요.
        </p>
      </div>
    </dialog>
  )
}
