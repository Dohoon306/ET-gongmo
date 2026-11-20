import { Link } from 'react-router'
import { useCurrentUser } from '../../common/useCurrentUser.ts'
import { useUnread } from './chatApi.ts'

export function UnreadBadge({ count, floating = true }: { count: number; floating?: boolean }) {
  if (count <= 0) return null
  return (
    <span
      aria-label={`안 읽은 메시지 ${count}개`}
      className={`${floating ? 'absolute -top-1.5 -right-1.5' : 'shrink-0'} flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] leading-none font-bold text-white ring-2 ring-white`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

export default function ChatBell() {
  const { userId } = useCurrentUser()
  const unread = useUnread()
  if (userId === null) return null
  const total = unread?.total ?? 0

  return (
    <Link
      to="/messages"
      aria-label={total > 0 ? `채팅·쪽지, 안 읽은 메시지 ${total}개` : '채팅·쪽지'}
      title="채팅·쪽지"
      className="relative flex size-11 shrink-0 items-center justify-center rounded-md text-ink-2 hover:bg-subtle"
    >
      <svg aria-hidden viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M4 5.5h16v10H9l-5 4v-14Z" strokeLinejoin="round" />
        <path d="M8 9.5h8M8 12.5h5" strokeLinecap="round" />
      </svg>
      <UnreadBadge count={total} />
    </Link>
  )
}

export function SendMessageButton({ userId }: { userId: number }) {
  const { userId: currentUserId } = useCurrentUser()
  if (currentUserId === null || currentUserId === userId) return null
  return (
    <Link
      to={`/messages/${userId}`}
      className="inline-flex h-10 items-center gap-1.5 rounded-md border border-line-strong bg-white px-3 text-sm font-semibold text-ink hover:bg-subtle"
    >
      <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 4h12v8H2zM2 4l6 5 6-5" strokeLinejoin="round" />
      </svg>
      쪽지 보내기
    </Link>
  )
}
