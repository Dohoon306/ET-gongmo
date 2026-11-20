import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { api } from '../../api/client.ts'
import { useCurrentUser } from '../../common/useCurrentUser.ts'
import { MESSAGES_POLL_MS, type ChatMessage } from './chatApi.ts'
import { Avatar, Card, ErrorText, TeamPage, primaryButton } from './ui.tsx'

type Props = { title: string; subtitle: string; backTo: string; backLabel: string; path: string }

export default function ChatView({ title, subtitle, backTo, backLabel, path }: Props) {
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
      <Link to={backTo} className="mb-4 inline-flex items-center gap-1 text-sm text-(--color-muted) hover:text-(--color-ink)">
        ‹ {backLabel}
      </Link>
      <h1 className="text-[28px] font-bold">{title}</h1>
      <p className="mt-1 mb-5 text-[15px] text-(--color-muted)">{subtitle}</p>
      <ErrorText message={error} />

      <Card className="flex h-[60vh] min-h-[360px] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5" aria-live="polite">
          {messages.length === 0 && (
            <p className="py-16 text-center text-sm text-(--color-muted)">아직 메시지가 없어요. 첫 메시지를 보내 보세요.</p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex items-end gap-2.5 ${m.mine ? 'flex-row-reverse' : ''}`}>
              {!m.mine && <Avatar name={m.senderName} userId={m.senderId} />}
              <div className={`max-w-[70%] ${m.mine ? 'text-right' : ''}`}>
                {!m.mine && <p className="mb-1 text-xs font-medium text-(--color-muted)">{m.senderName}</p>}
                <p
                  className={`inline-block rounded-2xl px-4 py-2.5 text-left text-[15px] break-words whitespace-pre-wrap ${m.mine ? 'bg-brand text-white' : 'bg-(--color-subtle) text-(--color-ink)'}`}
                >
                  {m.content}
                </p>
                <p className="mt-1 text-[11px] text-(--color-muted)">{m.createdAt.slice(11, 16)}</p>
              </div>
            </div>
          ))}
          <div ref={bottom} />
        </div>
        <form onSubmit={send} className="flex gap-2 border-t border-line p-4">
          <label htmlFor="chat-input" className="sr-only">
            메시지
          </label>
          <input
            id="chat-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            placeholder="메시지를 입력하세요"
            className="h-11 flex-1 rounded-xl border border-(--color-line-strong) px-3 text-[15px]"
          />
          <button type="submit" disabled={!text.trim() || sending} className={primaryButton}>
            보내기
          </button>
        </form>
      </Card>
    </TeamPage>
  )
}
