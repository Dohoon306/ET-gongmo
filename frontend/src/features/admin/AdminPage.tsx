import { useState } from 'react'
import { EmptyState, TeamPage } from '../team/ui.tsx'
import { useIsAdmin } from './adminApi.ts'
import AdminAppealsTab from './AdminAppealsTab.tsx'
import AdminContestsTab from './AdminContestsTab.tsx'
import AdminEvaluationsTab from './AdminEvaluationsTab.tsx'
import AdminReportsTab from './AdminReportsTab.tsx'
import AdminRoomsTab from './AdminRoomsTab.tsx'
import AdminUsersTab from './AdminUsersTab.tsx'

const TABS = [
  { key: 'users', label: '가입 계정', element: <AdminUsersTab /> },
  { key: 'appeals', label: '평가 항의', element: <AdminAppealsTab /> },
  { key: 'evaluations', label: '전체 평가', element: <AdminEvaluationsTab /> },
  { key: 'contests', label: '공모전', element: <AdminContestsTab /> },
  { key: 'rooms', label: '모집 방', element: <AdminRoomsTab /> },
  { key: 'reports', label: '신고 내역', element: <AdminReportsTab /> },
]

export default function AdminPage() {
  const isAdmin = useIsAdmin()
  const [tab, setTab] = useState(TABS[0].key)

  if (!isAdmin) {
    return (
      <TeamPage>
        <EmptyState title="관리자만 볼 수 있는 화면이에요">
          <p className="mt-2 text-sm text-muted">헤더에서 "관리자" 계정으로 바꿔 주세요.</p>
        </EmptyState>
      </TeamPage>
    )
  }

  return (
    <TeamPage>
      <h1 className="text-[26px] font-bold leading-[1.3] tracking-[-0.02em]">관리자</h1>
      <p className="mt-1.5 mb-5 break-keep text-[15px] text-muted">
        계정 정지, 평가 항의, 공모전, 모집 방, 신고 내역을 관리해요. 관리자 화면에서는 평가한 사람도 보여요.
      </p>
      <div role="tablist" className="mb-5 flex flex-wrap gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px h-11 border-b-2 px-3.5 text-[15px] ${tab === t.key ? 'border-brand font-semibold text-ink' : 'border-transparent font-medium text-muted hover:text-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{TABS.find((t) => t.key === tab)?.element}</div>
    </TeamPage>
  )
}
