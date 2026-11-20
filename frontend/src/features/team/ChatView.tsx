import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { api } from '../../api/client.ts'
import { ChevronLeftIcon } from '../../common/icons.tsx'
import { useCurrentUser } from '../../common/useCurrentUser.ts'
import { MESSAGES_POLL_MS, type ChatMessage } from './chatApi.ts'
import type { ReportContext } from '../admin/ReportDialog.tsx'
import { Avatar, Card, ErrorText, TeamPage, primaryButton } from './ui.tsx'

type Props = {
  title: string
  titleAvatar?: ReactNode
  subtitle: string
  backTo: string
  backLabel: string
  path: string
  reportContext: ReportContext
}

export default function ChatView({ title, titleAvatar, subtitle, backTo, backLabel, path, reportContext }: Props) {
  const { userId } = useCurrentUser()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [version, setVersion] = useState(0)
  const lastId = useRef(0)
  const loading = useRef(false)
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    const fetchNew = async () => {
      if (loading.current) return
      loading.current = true
      try {
        const fresh = await api<ChatMessage[]>(`${path}?after=${lastId.current}`)
        if (!alive) return
        setError(null)
        const unseen = fresh.filter((m) => m.id > lastId.current)
        if (unseen.length > 0) {
          lastId.current = unseen[unseen.length - 1].id
          setMessages((prev) => [...prev, ...unseen])
        }
      } catch (e) {
        if (alive) setError((e as Error).message)
      } finally {
        loading.current = false
      }
    }
    fetchNew()
    const timer = setInterval(fetchNew, MESSAGES_POLL_MS)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [path, userId, version])

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  async function send(e: FormEvent) {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await api(path, { method: 'POST', body: { content: text } })
      setText('')
      setVersion((v) => v + 1)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <TeamPage>
      <Link to={backTo} className="mb-3 inline-flex min-h-8 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeftIcon />{backLabel}
      </Link>
      <div className="flex items-center gap-2.5">
        {titleAvatar}
        <h1 className="text-[26px] font-bold leading-[1.3] tracking-[-0.02em]">{title}</h1>
      </div>
      <p className="mt-1 mb-5 text-[15px] text-muted">{subtitle}</p>
      <ErrorText message={error} />

      <Card className="flex h-[60vh] min-h-[360px] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5" aria-live="polite">
          {messages.length === 0 && (
            <p className="py-16 text-center text-sm text-muted">아직 메시지가 없어요. 첫 메시지를 보내 보세요.</p>
          )}
          {messages.map((m) =>
            m.notice ? (
              <p key={m.id} role="status" className="mx-auto w-fit max-w-[90%] rounded-sm bg-subtle px-3 py-1.5 text-center text-[13px] text-ink-2">
                {m.content}
                <span className="ml-2 text-[11px] text-muted">{m.createdAt.slice(11, 16)}</span>
              </p>
            ) : (
            <div key={m.id} className={`flex items-end gap-2.5 ${m.mine ? 'flex-row-reverse' : ''}`}>
              <Avatar name={m.senderName} userId={m.senderId} reportContext={reportContext} />
              <div className={`max-w-[70%] ${m.mine ? 'text-right' : ''}`}>
                {!m.mine && <p className="mb-1 text-xs font-semibold text-muted">{m.senderName}</p>}
                <p
                  className={`inline-block rounded-lg px-3.5 py-2.5 text-left text-[15px] break-words whitespace-pre-wrap ${m.mine ? 'bg-brand text-white' : 'bg-subtle text-ink'}`}
                >
                  {m.content}
                </p>
                <p className="mt-1 text-[11px] tabular-nums text-muted">{m.createdAt.slice(11, 16)}</p>
              </div>
            </div>
            ),
          )}
          <div ref={bottom} />
        </div>
        <form onSubmit={send} className="flex gap-2 rounded-b-lg border-t border-line bg-page px-4 py-3.5">
          <label htmlFor="chat-input" className="sr-only">
            메시지
          </label>
          <input
            id="chat-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            placeholder="메시지를 입력하세요"
            className="h-11 min-w-0 flex-1 rounded-md border border-line-strong bg-white px-3.5 text-[15px]"
          />
          <button type="submit" disabled={!text.trim() || sending} className={primaryButton}>
            보내기
          </button>
        </form>
      </Card>
    </TeamPage>
  )
}
