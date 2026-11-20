import Placeholder from '../Placeholder.tsx'
import type { FeatureRoute } from '../types.ts'

export const userRoutes: FeatureRoute[] = [
  { path: '/signup', label: '1-1 가입·자기소개 입력', element: <Placeholder title="가입·자기소개 입력" features="A-1" /> },
  { path: '/signup/tags', label: '1-2 AI 태그 확인·수정', element: <Placeholder title="AI 태그 확인·수정" features="A-2, A-3" /> },
]
