import { Link } from 'react-router'
import { useCurrentUser } from '../../common/useCurrentUser.ts'
import { useGet, type MyTeam } from './api.ts'
import DDayBadge from '../../common/DDayBadge.tsx'
import { UnreadBadge } from './ChatBell.tsx'
import { useUnread } from './chatApi.ts'
import { Card, EmptyState, ErrorText, PersonIcon, StatusChip, TeamPage, primaryButton, secondaryButton } from './ui.tsx'

export default function MyTeamsPage() {
  const { userId } = useCurrentUser()
  const { data, error } = useGet<MyTeam[]>(userId ? '/api/my/teams' : null)
  const unread = useUnread()
  const unreadByRoom = new Map(unread?.rooms.map((r) => [r.roomId, r.unread]))

  return (
    <TeamPage>
      <h1 className="text-[28px] font-bold">내 팀</h1>
      <p className="mt-2 mb-6 text-[15px] text-(--color-muted)">
        참여한 공모전과 팀을 모아 봤어요. 팀을 누르면 팀원과 팀 구성을 볼 수 있어요.
      </p>
      <ErrorText message={error} />

      {!userId && <EmptyState title="사용자를 먼저 골라 주세요" />}

      {data && data.length === 0 && (
        <EmptyState title="아직 속한 팀이 없어요">
          <p className="mt-2 text-sm text-(--color-muted)">추천 공모전에서 마음에 드는 방에 참가 요청을 보내 보세요.</p>
          <Link to="/contests" className={`${primaryButton} mt-5`}>
            추천 공모전 보러 가기
          </Link>
        </EmptyState>
      )}

      {data && data.length > 0 && (
        <>
          <p className="mb-3 text-[13px] font-medium text-(--color-muted)">참여한 공모전 {data.length}개</p>
          <ul className="space-y-4">
            {data.map((team) => (
              <li key={team.roomId}>
                <Card className="flex items-center gap-6 p-6">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="truncate text-[15px] font-semibold">{team.contest?.title ?? '연결된 공모전 없음'}</p>
                      {team.contest && <DDayBadge endDate={team.contest.endDate} />}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold">{team.title}</h2>
                      <StatusChip full={team.status === 'FULL'} />
                    </div>
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-(--color-muted)">
                      <span className="font-medium text-brand">{team.role === 'HOST' ? '방장' : '팀원'}</span>·
                      <PersonIcon />
                      {team.memberCount} / {team.capacity}명
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {team.role === 'HOST' && (
                      <Link to={`/rooms/${team.roomId}/requests`} className={secondaryButton}>
                        받은 요청
                      </Link>
                    )}
                    <Link to={`/rooms/${team.roomId}/members`} className={primaryButton}>
                      팀 보기
                    </Link>
                    <Link to={`/rooms/${team.roomId}/chat`} className={`${secondaryButton} relative`}>
                      채팅방 열기
                      <UnreadBadge count={unreadByRoom.get(team.roomId) ?? 0} />
                    </Link>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </TeamPage>
  )
}
