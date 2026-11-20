import { useCurrentUser } from '../../common/useCurrentUser.ts'
import { useGet } from './api.ts'

export type ChatMessage = {
  id: number
  senderId: number
  senderName: string
  content: string
  createdAt: string
  mine: boolean
  notice: boolean
}

export type RoomUnread = { roomId: number; title: string; unread: number; lastContent: string | null }

export type Unread = { total: number; direct: number; rooms: RoomUnread[] }

export type Conversation = { peerId: number; peerName: string; lastContent: string; lastAt: string; unread: number }

export const UNREAD_POLL_MS = 5000
export const MESSAGES_POLL_MS = 3000

export function useUnread() {
  const { userId } = useCurrentUser()
  return useGet<Unread>(userId ? '/api/chat/unread' : null, UNREAD_POLL_MS).data
}
