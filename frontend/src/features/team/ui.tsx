import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router'
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

export function Avatar({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
  const initial = name.replace(/^(방장|팀원)\s*/, '').slice(0, 1)
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-soft font-semibold text-brand ${size === 'lg' ? 'h-10 w-10 text-base' : 'h-9 w-9 text-sm'}`}
    >
      {initial}
    </span>
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
