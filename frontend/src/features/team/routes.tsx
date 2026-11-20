import type { FeatureRoute } from '../types.ts'
import MembersPage from './MembersPage.tsx'
import MyTeamsPage from './MyTeamsPage.tsx'
import ReceivedRequestsPage, { MyRequestsPage } from './ReceivedRequestsPage.tsx'
import RoomListPage, { JoinEntryPage } from './RoomListPage.tsx'

export const teamRoutes: FeatureRoute[] = [
  { path: '/contests/:contestId/rooms', label: '3 모집 방 목록', element: <RoomListPage /> },
  { path: '/rooms/:roomId/join', label: '4 참가 요청', element: <JoinEntryPage /> },
  { path: '/rooms/:roomId/requests', label: '5-1 받은 요청', element: <ReceivedRequestsPage /> },
  { path: '/rooms/:roomId/members', label: '5-2 팀원 목록', element: <MembersPage /> },
  { path: '/my/team', label: '내 팀 (참여한 공모전 목록)', element: <MyTeamsPage /> },
  { path: '/my/requests', label: '받은 요청 (헤더 메뉴)', element: <MyRequestsPage /> },
]
