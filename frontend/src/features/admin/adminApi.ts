import { useCurrentUser } from '../../common/useCurrentUser.ts'
import { useGet } from '../team/api.ts'

export type AdminUser = {
  id: number
  name: string
  intro: string | null
  createdAt: string
  admin: boolean
  suspended: boolean
  suspendReason: string | null
  reportCount: number
  categories: string[]
}

export type AdminEvaluation = {
  id: number
  roomId: number
  roomTitle: string
  evaluatorId: number
  evaluatorName: string
  targetId: number
  targetName: string
  score: number
  comment: string | null
  createdAt: string
}

export type AppealStatus = 'PENDING' | 'REMOVED' | 'REJECTED'

export type AdminAppeal = {
  id: number
  evaluationId: number
  roomTitle: string | null
  evaluatorId: number
  evaluatorName: string | null
  targetId: number
  targetName: string | null
  score: number
  comment: string | null
  reason: string
  status: AppealStatus
  createdAt: string
}

export type ReportSource = 'PROFILE' | 'TEAM_CHAT' | 'DIRECT'

export type AdminReport = {
  id: number
  reporterId: number
  reporterName: string
  targetId: number
  targetName: string
  reasons: string[]
  detail: string | null
  source: ReportSource
  roomId: number | null
  roomTitle: string | null
  createdAt: string
  messages: { senderId: number; senderName: string; content: string; sentAt: string }[]
}

export type AdminContest = {
  id: number
  gongmoaId: number
  title: string
  type: string | null
  host: string | null
  startDate: string | null
  endDate: string | null
  target: string | null
  prize: string | null
  benefit: string | null
  gongmoaUrl: string | null
  sourceUrl: string | null
  categoryIds: number[]
}

export type MyEvaluation = {
  id: number
  score: number
  comment: string | null
  appealStatus: AppealStatus | null
  appealReason: string | null
}

export const REPORT_REASONS: { code: string; label: string }[] = [
  { code: 'AD', label: '외부 광고' },
  { code: 'ABUSE', label: '욕설·비하' },
  { code: 'DISRUPT', label: '의도적인 방해' },
  { code: 'LOW_PARTICIPATION', label: '참여율 저조' },
  { code: 'ETC', label: '기타' },
]

export const reasonLabel = (code: string) => REPORT_REASONS.find((r) => r.code === code)?.label ?? code

export const SOURCE_LABELS: Record<ReportSource, string> = {
  PROFILE: '프로필',
  TEAM_CHAT: '팀 채팅',
  DIRECT: '쪽지',
}

export const APPEAL_LABELS: Record<AppealStatus, string> = {
  PENDING: '검토 중',
  REMOVED: '평가 제거됨',
  REJECTED: '기각됨',
}

export function useIsAdmin() {
  const { userId } = useCurrentUser()
  return useGet<{ admin: boolean }>(userId ? '/api/admin/status' : null).data?.admin === true && userId !== null
}
