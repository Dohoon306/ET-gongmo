import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useCurrentUser } from '../../common/useCurrentUser.ts'
import { idParam, useGet, type Room, type RoomList } from './api.ts'
import JoinDialog from './JoinDialog.tsx'
import DDayBadge from '../../common/DDayBadge.tsx'
import { Card, ErrorText, MissingId, PersonIcon, StatusChip, Tags, TeamPage, primaryButton } from './ui.tsx'

export default function RoomListPage() {
  const contestId = idParam(useParams().contestId)
  if (!contestId) return <MissingId what="공모전" sample="/contests/33/rooms" />
  return <RoomListView contestId={contestId} initialJoinRoomId={null} />
}

export function JoinEntryPage() {
  const roomId = idParam(useParams().roomId)
  const { data: room, error } = useGet<Room>(roomId ? `/api/rooms/${roomId}` : null)
  if (!roomId) return <MissingId what="방" sample="/rooms/1/join" />
  if (error) return <TeamPage><ErrorText message={error} /></TeamPage>
  if (!room) return <TeamPage>{null}</TeamPage>
  if (!room.contestId) return <TeamPage><ErrorText message="공모전에 연결되지 않은 방이에요" /></TeamPage>
  return <RoomListView contestId={room.contestId} initialJoinRoomId={room.id} />
}

function RoomListView({ contestId, initialJoinRoomId }: { contestId: number; initialJoinRoomId: number | null }) {
  const { userId } = useCurrentUser()
  const { data, error, reload } = useGet<RoomList>(`/api/contests/${contestId}/rooms`)
  const [joinRoomId, setJoinRoomId] = useState(initialJoinRoomId)
  const joinRoom = data?.rooms.find((r) => r.id === joinRoomId)
  const open = data?.rooms.filter((r) => r.status !== 'FULL') ?? []
  const full = data?.rooms.filter((r) => r.status === 'FULL') ?? []

  const card = (room: Room) => (
    <RoomCard key={room.id} room={room} isHost={room.hostId === userId} canJoin={userId !== null} onJoin={() => setJoinRoomId(room.id)} />
  )

  return (
    <TeamPage>
      <Link
        to={`/contests/${contestId}`}
        className="flex h-12 items-center gap-3 rounded-xl border border-line bg-white px-4 text-sm hover:border-(--color-line-strong)"
      >
        <span aria-hidden className="text-lg leading-none text-(--color-muted)">
          ‹
        </span>
        <span className="truncate font-semibold">{data?.contest?.title ?? '공모전'}</span>
        {data?.contest && <DDayBadge endDate={data.contest.endDate} />}
      </Link>

      <div className="mt-8 flex items-center justify-between gap-4">
        <h1 className="text-[28px] font-bold">팀원 모집 방 {data?.rooms.length ?? 0}개</h1>
        {userId !== null && (
          <Link to={`/contests/${contestId}/rooms/new`} className={primaryButton}>
            방 만들기
          </Link>
        )}
      </div>
      <p className="mt-2 mb-6 text-[15px] text-(--color-muted)">
        방이 원하는 팀원 태그와 내 태그가 많이 겹치는 방부터 보여요. 모집이 끝난 방은 맨 아래에 있어요.
      </p>
      <ErrorText message={error} />

      <div className="space-y-5">{open.map(card)}</div>
      {data && data.rooms.length === 0 && (
        <Card className="px-6 py-14 text-center text-sm text-(--color-muted)">아직 이 공모전에 모집 방이 없어요.</Card>
      )}

      {full.length > 0 && (
        <>
          <h2 className="mt-7 mb-3 text-[13px] font-medium text-(--color-muted)">모집 완료</h2>
          <div className="space-y-5">{full.map(card)}</div>
        </>
      )}

      {joinRoom && <JoinDialog room={joinRoom} onClose={() => setJoinRoomId(null)} onSent={reload} />}
    </TeamPage>
  )
}

function RoomCard({ room, isHost, canJoin, onJoin }: { room: Room; isHost: boolean; canJoin: boolean; onJoin: () => void }) {
  const full = room.status === 'FULL'
  return (
    <Card muted={full} className="flex gap-6 p-7">
      <div
        className={`flex h-[68px] w-[68px] shrink-0 flex-col items-center justify-center rounded-xl text-brand ${full ? 'bg-brand-soft/60' : 'bg-brand-soft'}`}
      >
        <span className="text-[28px] leading-none font-bold">{room.overlap}</span>
        <span className="mt-1 text-xs font-medium">개 겹침</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold">{room.title}</h3>
          <StatusChip full={full} />
        </div>
        {room.intro && <p className="mt-2 text-[15px] text-(--color-ink-2)">{room.intro}</p>}
        <div className="mt-3 flex items-center gap-3">
          <span className="shrink-0 text-[13px] text-(--color-muted)">원하는 팀원</span>
          <Tags tags={room.tags} />
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end justify-between">
        <div className="text-right">
          <p className="inline-flex items-center gap-1 text-sm font-semibold">
            <PersonIcon />
            {room.memberCount} / {room.capacity}명
          </p>
          <p className="mt-1 text-[13px] text-(--color-muted)">{room.hostName}</p>
        </div>
        {isHost ? (
          <Link to={`/rooms/${room.id}/requests`} className={primaryButton}>
            받은 요청
          </Link>
        ) : full ? (
          <span className="inline-flex h-10 items-center px-4 text-[15px] font-semibold text-(--color-muted)">모집 완료</span>
        ) : (
          <button onClick={onJoin} disabled={!canJoin} className={primaryButton}>
            참가 요청
          </button>
        )}
      </div>
    </Card>
  )
}
