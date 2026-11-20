import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router'
import ProfileAvatar from '../../common/ProfileAvatar.tsx'
import { useCurrentUser } from '../../common/useCurrentUser.ts'
import ReportDialog, { type ReportContext } from '../admin/ReportDialog.tsx'
import type { Tag } from './api.ts'

export function TeamPage({ children }: { children: ReactNode }) {
  return (
    <div className="text-ink">
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
          className={`inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-sm border px-2 text-[13px] ${t.matched ? 'border-brand-soft bg-brand-soft font-semibold text-brand' : 'border-line bg-white font-medium text-ink-2'}`}
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
    <svg aria-label="겹침" viewBox="0 0 12 12" className="size-[11px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2.5 6.2 5 8.5l4.5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Card({ children, className = '', muted = false }: { children: ReactNode; className?: string; muted?: boolean }) {
  return (
    <div className={`rounded-lg border border-line ${muted ? 'bg-page' : 'bg-white'} ${className}`}>{children}</div>
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
        className="flex shrink-0"
      >
        <ProfileAvatar userId={userId} name={name} initial={initial} className={size === 'lg' ? 'size-10 rounded-md text-base' : 'size-9 rounded-md text-sm'} />
      </span>
      {menu &&
        createPortal(
          <div
            role="menu"
            aria-label={`${name} 메뉴`}
            style={{ left: menu.x, top: menu.y }}
            className="fixed z-50 min-w-36 overflow-hidden rounded-md border border-line bg-white py-1 text-sm text-ink shadow-lg"
          >
            <button role="menuitem" autoFocus onClick={go(`/messages/${userId}`)} className="block w-full px-4 py-2 text-left hover:bg-subtle">
              쪽지 보내기
            </button>
            <button role="menuitem" onClick={go(`/users/${userId}`)} className="block w-full px-4 py-2 text-left hover:bg-subtle">
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
              className="block w-full border-t border-line px-4 py-2 text-left text-danger hover:bg-danger-soft"
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
      className={`inline-flex h-[22px] shrink-0 items-center rounded-sm px-[7px] text-xs font-semibold ${full ? 'bg-subtle text-muted' : 'bg-brand-soft text-brand'}`}
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
  return message ? <p className="mb-3 text-sm text-danger">{message}</p> : null
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Card className="border-dashed border-line-strong px-6 py-14 text-center">
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
  'inline-flex h-11 items-center justify-center gap-1.5 rounded-md px-4 text-[15px] font-semibold disabled:cursor-not-allowed disabled:opacity-40'
export const primaryButton = `${buttonBase} bg-brand text-white hover:bg-brand-strong`
export const secondaryButton = `${buttonBase} border border-line-strong bg-white text-ink hover:bg-subtle`
export const dangerButton = `${buttonBase} border border-line-strong bg-white text-danger hover:bg-danger-soft`
