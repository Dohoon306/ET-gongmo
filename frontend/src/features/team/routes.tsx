import type { FeatureRoute } from '../types.ts'
import AdminPage from '../admin/AdminPage.tsx'
import { DirectChatPage, InboxPage, TeamChatPage } from './ChatPages.tsx'
import CreateRoomPage from './CreateRoomPage.tsx'
import MembersPage from './MembersPage.tsx'
import MyTeamsPage from './MyTeamsPage.tsx'
import ReceivedRequestsPage, { MyRequestsPage } from './ReceivedRequestsPage.tsx'
import RoomListPage, { JoinEntryPage } from './RoomListPage.tsx'

export const teamRoutes: FeatureRoute[] = [
  { path: '/contests/:contestId/rooms', label: '3 모집 방 목록', element: <RoomListPage /> },
  { path: '/contests/:contestId/rooms/new', label: '방 만들기', element: <CreateRoomPage /> },
  { path: '/teams/new', label: '방 만들기 (공모전 선택)', element: <CreateRoomPage /> },
  { path: '/rooms/:roomId/join', label: '4 참가 요청', element: <JoinEntryPage /> },
  { path: '/rooms/:roomId/requests', label: '5-1 받은 요청', element: <ReceivedRequestsPage /> },
  { path: '/rooms/:roomId/members', label: '5-2 팀원 목록', element: <MembersPage /> },
  { path: '/my/team', label: '내 팀 (참여한 공모전 목록)', element: <MyTeamsPage /> },
  { path: '/my/requests', label: '받은 요청 (헤더 메뉴)', element: <MyRequestsPage /> },
  { path: '/rooms/:roomId/chat', label: '팀 채팅', element: <TeamChatPage /> },
  { path: '/messages', label: '채팅·쪽지 목록', element: <InboxPage /> },
  { path: '/messages/:userId', label: '쪽지 대화', element: <DirectChatPage /> },
  { path: '/admin', label: '관리자', element: <AdminPage /> },
]
