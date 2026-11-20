import type { FeatureRoute } from '../types.ts'
import ProfilePage from './ProfilePage.tsx'
import TeamReviewPage from './TeamReviewPage.tsx'

export const profileRoutes: FeatureRoute[] = [
  { path: '/rooms/:roomId/review', label: '6-1 팀원 평가', element: <TeamReviewPage /> },
  { path: '/users/:userId', label: '6-2 프로필', element: <ProfilePage /> },
]
