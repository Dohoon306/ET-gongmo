import { useState } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../../api/client.ts'
import { useCurrentUser } from '../../common/useCurrentUser.ts'
import type { Person, Room } from './api.ts'
import { ErrorText, secondaryButton } from './ui.tsx'

const smallButton =
  'inline-flex h-8 items-center rounded-lg border border-(--color-line-strong) bg-white px-2.5 text-[13px] font-semibold hover:bg-(--color-subtle)'

async function call(path: string, method: 'POST' | 'DELETE', body?: unknown) {
  await api(path, { method, body })
}

export function MemberActions({ room, member, onChanged, onError }: {
  room: Room
  member: Person
  onChanged: () => void
  onError: (message: string) => void
}) {
  const { userId } = useCurrentUser()
  if (room.status === 'CLOSED' || room.hostId !== userId || member.userId === userId) return null

  const run = async (path: string, body: unknown) => {
    try {
      await call(path, 'POST', body)
      onChanged()
    } catch (e) {
      onError((e as Error).message)
    }
  }

  const kick = () => {
    const reason = window.prompt(`${member.name} 님을 강퇴하는 이유를 적어 주세요. 팀 채팅에 함께 표시돼요.`, '')
    if (reason === null) return
    if (!reason.trim()) {
      onError('강퇴 사유를 적어 주세요')
      return
    }
    run(`/api/rooms/${room.id}/members/${member.userId}/kick`, { reason })
  }

  const makeHost = () => {
    if (!window.confirm(`${member.name} 님에게 방장을 넘길까요? 넘긴 뒤에는 나는 팀원이 돼요.`)) return
    run(`/api/rooms/${room.id}/host`, { userId: member.userId })
  }

  return (
    <div className="flex shrink-0 gap-1.5">
      <button onClick={makeHost} className={smallButton}>
        방장 넘기기
      </button>
      <button onClick={kick} className={`${smallButton} text-red-700`}>
        강퇴
      </button>
    </div>
  )
}

export function RoomActions({ room, memberCount }: { room: Room; memberCount: number }) {
  const { userId } = useCurrentUser()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  if (room.status === 'CLOSED' || userId === null) return null
  const isHost = room.hostId === userId
  const alone = memberCount <= 1

  const run = async (path: string, method: 'POST' | 'DELETE', confirmText: string) => {
    if (!window.confirm(confirmText)) return
    setError(null)
    try {
      await call(path, method)
      navigate('/my/team')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="mt-5">
      <ErrorText message={error} />
      <div className="flex flex-wrap items-center justify-end gap-2">
        {isHost ? (
          <>
            {!alone && <span className="text-[13px] text-(--color-muted)">팀원이 모두 나가거나 강퇴된 뒤에 방을 지울 수 있어요</span>}
            <button
              disabled={!alone}
              onClick={() => run(`/api/rooms/${room.id}`, 'DELETE', `"${room.title}" 방을 지울까요? 되돌릴 수 없어요.`)}
              className={`${secondaryButton} text-red-700`}
            >
              방 삭제
            </button>
          </>
        ) : (
          <button
            onClick={() => run(`/api/rooms/${room.id}/leave`, 'POST', `"${room.title}" 방에서 나갈까요? 팀 채팅에 나갔다고 표시돼요.`)}
            className={`${secondaryButton} text-red-700`}
          >
            방 나가기
          </button>
        )}
      </div>
    </div>
  )
}
