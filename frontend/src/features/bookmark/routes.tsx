import type { FeatureRoute } from '../types.ts'
import BookmarksPage from './BookmarksPage.tsx'

export const bookmarkRoutes: FeatureRoute[] = [
  { path: '/bookmarks', label: '2-3 관심 공고 목록', element: <BookmarksPage /> },
]
