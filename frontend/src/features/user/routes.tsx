import type { FeatureRoute } from '../types.ts'
import SignupPage from './SignupPage.tsx'
import SignupTagsPage from './SignupTagsPage.tsx'

export const userRoutes: FeatureRoute[] = [
  { path: '/signup', label: '1-1 가입·자기소개 입력', element: <SignupPage /> },
  { path: '/signup/tags', label: '1-2 AI 태그 확인·수정', element: <SignupTagsPage /> },
]
