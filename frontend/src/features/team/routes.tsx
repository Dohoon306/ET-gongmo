import Placeholder from '../Placeholder.tsx'
import type { FeatureRoute } from '../types.ts'

export const teamRoutes: FeatureRoute[] = [
  { path: '/contests/:contestId/rooms', label: '3 모집 방 목록', element: <Placeholder title="모집 방 목록" features="C-2" /> },
  { path: '/rooms/:roomId/join', label: '4 참가 요청', element: <Placeholder title="참가 요청 (AI 초안)" features="C-3, C-4" /> },
  { path: '/rooms/:roomId/requests', label: '5-1 받은 요청', element: <Placeholder title="방장 · 받은 요청" features="C-5" /> },
  { path: '/rooms/:roomId/members', label: '5-2 팀원 목록', element: <Placeholder title="팀 확정 · 팀원 목록" features="C-6" /> },
]
