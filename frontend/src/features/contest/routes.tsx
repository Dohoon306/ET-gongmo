import type { FeatureRoute } from '../types.ts'
import ContestDetailPage from './ContestDetailPage.tsx'
import ContestRecommendationPage from './ContestRecommendationPage.tsx'

export const contestRoutes: FeatureRoute[] = [
  { path: '/contests', label: '2-1 추천 공모전', element: <ContestRecommendationPage /> },
  { path: '/contests/:contestId', label: '2-2 공모전 상세', element: <ContestDetailPage /> },
]
