import Placeholder from '../Placeholder.tsx'
import type { FeatureRoute } from '../types.ts'

export const userRoutes: FeatureRoute[] = [
  { path: '/signup', label: '1-1 가입·자기소개 입력', element: <Placeholder title="가입·자기소개 입력" features="A-1" /> },
  { path: '/signup/tags', label: '1-2 AI 태그 확인·수정', element: <Placeholder title="AI 태그 확인·수정" features="A-2, A-3" /> },
  { path: '/rooms/:roomId/review', label: '6-1 팀원 평가', element: <Placeholder title="팀원 평가" features="A-5" /> },
  { path: '/users/:userId', label: '6-2 프로필', element: <Placeholder title="프로필 · 평가 반영" features="A-6" /> },
]
