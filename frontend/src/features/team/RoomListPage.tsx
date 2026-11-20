import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useCurrentUser } from '../../common/useCurrentUser.ts'
import { idParam, useGet, type Room, type RoomList } from './api.ts'
import JoinDialog from './JoinDialog.tsx'
import DDayBadge from '../../common/DDayBadge.tsx'
import { ChevronLeftIcon } from '../../common/icons.tsx'
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
  const [requestedKeys, setRequestedKeys] = useState<string[]>([])
  const requestKey = (roomId: number) => `${userId}:${roomId}`
  const joinRoom = data?.rooms.find(
    (r) => r.id === joinRoomId && userId !== null && r.hostId !== userId && r.status === 'RECRUITING',
  )
  const open = data?.rooms.filter((r) => r.status !== 'FULL') ?? []
  const full = data?.rooms.filter((r) => r.status === 'FULL') ?? []

  const card = (room: Room) => (
    <RoomCard
      key={room.id}
      room={room}
      isHost={room.hostId === userId}
      canJoin={userId !== null}
      requested={requestedKeys.includes(requestKey(room.id))}
      onJoin={() => setJoinRoomId(room.id)}
    />
  )

  return (
    <TeamPage>
      <Link
        to={`/contests/${contestId}`}
        className="flex min-h-12 flex-wrap items-center gap-2.5 rounded-md border border-line bg-page px-3.5 py-2 text-sm hover:border-line-strong"
      >
        <ChevronLeftIcon className="size-3.5 text-muted" />
        <span className="truncate font-semibold">{data?.contest?.title ?? '공모전'}</span>
        {data?.contest && <DDayBadge endDate={data.contest.endDate} />}
      </Link>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[26px] font-bold leading-[1.3] tracking-[-0.02em]">팀원 모집 방 <span className="tabular-nums text-brand">{data?.rooms.length ?? 0}</span>개</h1>
        {userId !== null && (
          <Link to={`/contests/${contestId}/rooms/new`} className={primaryButton}>
            방 만들기
          </Link>
        )}
      </div>
      <p className="mt-1.5 mb-[22px] text-[15px] text-muted">
        방이 원하는 팀원 태그와 내 태그가 많이 겹치는 방부터 보여요. 모집이 끝난 방은 맨 아래에 있어요.
      </p>
      <ErrorText message={error} />

      <div className="space-y-3.5">{open.map(card)}</div>
      {data && data.rooms.length === 0 && (
        <Card className="px-6 py-14 text-center text-sm text-muted">아직 이 공모전에 모집 방이 없어요.</Card>
      )}

      {full.length > 0 && (
        <>
          <h2 className="mt-7 mb-2.5 text-[13px] font-semibold text-muted">모집 완료</h2>
          <div className="space-y-3.5">{full.map(card)}</div>
        </>
      )}

      {joinRoom && (
        <JoinDialog
          room={joinRoom}
          onClose={() => setJoinRoomId(null)}
          onSent={() => {
            setRequestedKeys((keys) => [...keys, requestKey(joinRoom.id)])
            reload()
          }}
        />
      )}
    </TeamPage>
  )
}

function RoomCard({
  room,
  isHost,
  canJoin,
  requested,
  onJoin,
}: {
  room: Room
  isHost: boolean
  canJoin: boolean
  requested: boolean
  onJoin: () => void
}) {
  const full = room.status === 'FULL'
  return (
    <Card muted={full} className="flex flex-wrap gap-5 p-[22px]">
      <div
        className={`flex size-16 shrink-0 flex-col items-center justify-center rounded-md ${full ? 'bg-subtle text-muted' : 'bg-brand-soft text-brand'}`}
      >
        <span className="text-[26px] leading-none font-bold tabular-nums">{room.overlap}</span>
        <span className="mt-0.5 text-xs font-medium">개 겹침</span>
      </div>

      <div className="min-w-0 flex-[999_1_380px]">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold tracking-[-0.01em]">{room.title}</h3>
          <StatusChip full={full} />
        </div>
        {room.intro && <p className="mt-1.5 break-keep text-[15px] text-ink-2">{room.intro}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <span className="shrink-0 text-[13px] text-muted">원하는 팀원</span>
          <Tags tags={room.tags} />
        </div>
      </div>

      <div className="flex flex-[1_0_auto] flex-col items-end justify-between gap-3.5">
        <div className="text-right">
          <p className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums">
            <PersonIcon />
            {room.memberCount} / {room.capacity}명
          </p>
          <p className="mt-0.5 text-[13px] text-muted">{room.hostName}</p>
        </div>
        {isHost ? (
          <Link to={`/rooms/${room.id}/requests`} className={primaryButton}>
            받은 요청
          </Link>
        ) : full ? (
          <span className="inline-flex h-11 items-center text-[15px] font-semibold text-muted">모집 완료</span>
        ) : requested ? (
          <span className="inline-flex h-11 items-center text-[15px] font-semibold text-muted">요청 보냄</span>
        ) : (
          <button onClick={onJoin} disabled={!canJoin} className={primaryButton}>
            참가 요청
          </button>
        )}
      </div>
    </Card>
  )
}
