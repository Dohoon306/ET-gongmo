import { useEffect, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router'
import { useCurrentUser } from '../../common/useCurrentUser.ts'
import ReportDialog, { type ReportContext } from '../admin/ReportDialog.tsx'
import type { Tag } from './api.ts'
import './team.css'

const FIGMA_TOKENS = {
  '--color-brand': '#1D6A43',
  '--color-brand-soft': '#E5F0E8',
  '--color-line': '#DCE2DA',
  '--color-line-strong': '#C9D1C6',
  '--color-subtle': '#EEF1EC',
  '--color-page': '#F6F7F3',
  '--color-accent': '#9A4508',
  '--color-accent-soft': '#FBEFE3',
  '--color-ink': '#18211B',
  '--color-ink-2': '#3B4840',
  '--color-muted': '#56635B',
  fontFamily: '"IBM Plex Sans KR", sans-serif',
} as CSSProperties


export function TeamPage({ children }: { children: ReactNode }) {
  return (
    <div style={FIGMA_TOKENS} className="-mx-4 -my-8 min-h-[calc(100vh-65px)] bg-(--color-page) px-4 py-8 text-(--color-ink)">
      {children}
    </div>
  )
}

export function Tags({ tags }: { tags: Tag[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <li
          key={t.id}
          className={`inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[13px] font-medium ${t.matched ? 'bg-brand text-white' : 'bg-(--color-subtle) text-(--color-ink-2)'}`}
        >
          {t.matched && <Check />}
          {t.name}
        </li>
      ))}
    </ul>
  )
}

function Check() {
  return (
    <svg aria-label="겹침" viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2.5 6.2 5 8.5l4.5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Card({ children, className = '', muted = false }: { children: ReactNode; className?: string; muted?: boolean }) {
  return (
    <div className={`rounded-2xl border border-line ${muted ? 'bg-(--color-page)' : 'bg-white'} ${className}`}>{children}</div>
  )
}

export function Avatar({ name, size = 'md', userId, reportContext = { source: 'PROFILE' } }: {
  name: string
  size?: 'md' | 'lg'
  userId?: number
  reportContext?: ReportContext
}) {
  const initial = name.replace(/^(방장|팀원)\s*/, '').slice(0, 1)
  const { userId: currentUserId } = useCurrentUser()
  const navigate = useNavigate()
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [reporting, setReporting] = useState(false)
  const canMessage = userId !== undefined && currentUserId !== null && currentUserId !== userId

  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    const closeOnEscape = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('click', close)
    window.addEventListener('scroll', close, true)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [menu])

  const go = (path: string) => (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setMenu(null)
    navigate(path)
  }

  return (
    <>
      <span
        title={canMessage ? '우클릭해서 쪽지 보내기·신고' : undefined}
        onContextMenu={
          canMessage
            ? (e) => {
                e.preventDefault()
                e.stopPropagation()
                setMenu({ x: e.clientX, y: e.clientY })
              }
            : undefined
        }
        className={`flex shrink-0 items-center justify-center rounded-full bg-brand-soft font-semibold text-brand ${size === 'lg' ? 'h-10 w-10 text-base' : 'h-9 w-9 text-sm'}`}
      >
        {initial}
      </span>
      {menu &&
        createPortal(
          <div
            role="menu"
            aria-label={`${name} 메뉴`}
            style={{ left: menu.x, top: menu.y }}
            className="fixed z-50 min-w-36 overflow-hidden rounded-xl border border-[#DCE2DA] bg-white py-1 text-sm text-[#18211B] shadow-lg"
          >
            <button role="menuitem" autoFocus onClick={go(`/messages/${userId}`)} className="block w-full px-4 py-2 text-left hover:bg-[#EEF1EC]">
              쪽지 보내기
            </button>
            <button role="menuitem" onClick={go(`/users/${userId}`)} className="block w-full px-4 py-2 text-left hover:bg-[#EEF1EC]">
              프로필 보기
            </button>
            <button
              role="menuitem"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setMenu(null)
                setReporting(true)
              }}
              className="block w-full border-t border-[#DCE2DA] px-4 py-2 text-left text-red-700 hover:bg-red-50"
            >
              유저 신고
            </button>
          </div>,
          document.body,
        )}
      {reporting && userId !== undefined && (
        <span onClick={(e) => e.stopPropagation()}>
          <ReportDialog targetId={userId} targetName={name} context={reportContext} onClose={() => setReporting(false)} />
        </span>
      )}
    </>
  )
}

export function StatusChip({ full }: { full: boolean }) {
  return (
    <span
      className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${full ? 'bg-(--color-subtle) text-(--color-muted)' : 'bg-brand-soft text-brand'}`}
    >
      {full ? '모집 완료' : '모집 중'}
    </span>
  )
}

export function PersonIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="8" cy="5.5" r="2.5" />
      <path d="M3 13.5c.6-2.4 2.6-3.7 5-3.7s4.4 1.3 5 3.7" strokeLinecap="round" />
    </svg>
  )
}

export function ErrorText({ message }: { message: string | null }) {
  return message ? <p className="mb-3 text-sm text-red-600">{message}</p> : null
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Card className="px-6 py-14 text-center">
      <p className="text-base font-semibold">{title}</p>
      {children}
    </Card>
  )
}

export function MissingId({ what, sample }: { what: string; sample: string }) {
  return (
    <TeamPage>
      <EmptyState title={`주소에 ${what} 번호가 없어요`}>
        <Link to={sample} className={`${secondaryButton} mt-4`}>
          개발용 샘플({sample})로 가기
        </Link>
      </EmptyState>
    </TeamPage>
  )
}

const buttonBase =
  'inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-[15px] font-semibold disabled:cursor-not-allowed disabled:opacity-40'
export const primaryButton = `${buttonBase} bg-brand text-white hover:opacity-90`
export const secondaryButton = `${buttonBase} border border-(--color-line-strong) bg-white text-(--color-ink) hover:bg-(--color-subtle)`
