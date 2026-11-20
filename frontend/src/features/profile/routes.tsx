import Placeholder from '../Placeholder.tsx'
import type { FeatureRoute } from '../types.ts'

export const profileRoutes: FeatureRoute[] = [
  { path: '/rooms/:roomId/review', label: '6-1 팀원 평가', element: <Placeholder title="팀원 평가" features="D-3" /> },
  { path: '/users/:userId', label: '6-2 프로필', element: <Placeholder title="프로필 · 평가 반영" features="D-4" /> },
]
