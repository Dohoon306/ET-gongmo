import Placeholder from '../Placeholder.tsx'
import type { FeatureRoute } from '../types.ts'

export const bookmarkRoutes: FeatureRoute[] = [
  { path: '/bookmarks', label: '2-3 관심 공고 목록', element: <Placeholder title="관심 공고 목록" features="D-1, D-2" /> },
]
