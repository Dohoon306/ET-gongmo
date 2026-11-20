import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { useCurrentUser } from '../../common/useCurrentUser.ts'
import { idParam, timeAgo, useGet, type Room } from './api.ts'
import { UNREAD_POLL_MS, useUnread, type Conversation } from './chatApi.ts'
import ChatView from './ChatView.tsx'
import { UnreadBadge } from './ChatBell.tsx'
import { Avatar, Card, EmptyState, MissingId, TeamPage } from './ui.tsx'

export function TeamChatPage() {
  const roomId = idParam(useParams().roomId)
  const room = useGet<Room>(roomId ? `/api/rooms/${roomId}` : null)
  if (!roomId) return <MissingId what="방" sample="/rooms/1/chat" />
  return (
    <ChatView
      key={roomId}
      title={room.data ? `${room.data.title} 채팅` : '팀 채팅'}
      subtitle="같은 팀 팀원끼리만 보이는 채팅방이에요."
      backTo="/my/team"
      backLabel="내 팀 목록"
      path={`/api/rooms/${roomId}/messages`}
      reportContext={{ source: 'TEAM_CHAT', roomId }}
    />
  )
}

export function DirectChatPage() {
  const peerId = idParam(useParams().userId)
  const users = useGet<{ id: number; name: string }[]>('/api/users')
  if (!peerId) return <MissingId what="사용자" sample="/messages/1" />
  const peerName = users.data?.find((u) => u.id === peerId)?.name ?? '사용자'
  return (
    <ChatView
      key={peerId}
      title={`${peerName} 님과 쪽지`}
      subtitle="두 사람만 볼 수 있는 쪽지예요."
      backTo="/messages"
      backLabel="채팅·쪽지 목록"
      path={`/api/direct-messages/${peerId}`}
      reportContext={{ source: 'DIRECT' }}
    />
  )
}

export function InboxPage() {
  const { userId } = useCurrentUser()
  const unread = useUnread()
  const conversations = useGet<Conversation[]>(userId ? '/api/direct-messages' : null, UNREAD_POLL_MS)

  if (!userId) {
    return (
      <TeamPage>
        <EmptyState title="사용자를 먼저 골라 주세요" />
      </TeamPage>
    )
  }

  return (
    <TeamPage>
      <h1 className="text-[26px] font-bold leading-[1.3] tracking-[-0.02em]">채팅·쪽지</h1>
      <p className="mt-1.5 mb-[26px] text-[15px] text-muted">새 메시지가 오면 빨간 숫자로 알려 드려요.</p>

      <h2 className="mb-2.5 text-[13px] font-semibold text-muted">팀 채팅</h2>
      {unread && unread.rooms.length === 0 && (
        <Card className="mb-8 px-6 py-8 text-center text-sm text-muted">아직 속한 팀이 없어요.</Card>
      )}
      <ul className="mb-[30px] divide-y divide-line overflow-hidden rounded-lg border border-line empty:hidden">
        {unread?.rooms.map((r) => (
          <li key={r.roomId}>
            <Row to={`/rooms/${r.roomId}/chat`} title={r.title} preview={r.lastContent ?? '아직 메시지가 없어요'} count={r.unread} />
          </li>
        ))}
      </ul>

      <h2 className="mb-2.5 text-[13px] font-semibold text-muted">쪽지</h2>
      {conversations.data && conversations.data.length === 0 && (
        <Card className="px-6 py-8 text-center text-sm text-muted">
          주고받은 쪽지가 없어요. 팀원 사진을 우클릭하거나 프로필에서 쪽지를 보낼 수 있어요.
        </Card>
      )}
      <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line empty:hidden">
        {conversations.data?.map((c) => (
          <li key={c.peerId}>
            <Row
              to={`/messages/${c.peerId}`}
              title={c.peerName}
              preview={c.lastContent}
              count={c.unread}
              avatar={<Avatar name={c.peerName} userId={c.peerId} />}
              time={timeAgo(c.lastAt)}
            />
          </li>
        ))}
      </ul>
    </TeamPage>
  )
}

function Row({ to, title, preview, count, avatar, time }: {
  to: string
  title: string
  preview: string
  count: number
  avatar?: ReactNode
  time?: string
}) {
  return (
    <Link to={to} className="flex min-h-[68px] items-center gap-3.5 bg-white px-[18px] py-3 hover:bg-page">
        {avatar}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{title}</p>
          <p className="truncate text-sm text-muted">{preview}</p>
        </div>
        {time && <span className="shrink-0 text-xs text-muted">{time}</span>}
        <UnreadBadge count={count} floating={false} />
    </Link>
  )
}
