import Placeholder from '../Placeholder.tsx'
import type { FeatureRoute } from '../types.ts'

export const contestRoutes: FeatureRoute[] = [
  { path: '/contests', label: '2-1 추천 공모전', element: <Placeholder title="추천 공모전" features="B-3" /> },
  { path: '/contests/:contestId', label: '2-2 공모전 상세', element: <Placeholder title="공모전 상세" features="B-4" /> },
]
