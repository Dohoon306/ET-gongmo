type IconProps = { className?: string }

export function CheckIcon({ className = 'size-3' }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 6.2 5 8.5l4.5-5" />
    </svg>
  )
}

export function ChevronLeftIcon({ className = 'size-3.5' }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3.5 5.5 8l4.5 4.5" />
    </svg>
  )
}

export function ChevronRightIcon({ className = 'size-3.5' }: IconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 3.5 4.5 4.5L6 12.5" />
    </svg>
  )
}

export function StarIcon({ className = 'size-3.5', filled = true }: IconProps & { filled?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={`shrink-0 ${className}`} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round">
      <path d="m8 1.8 1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z" />
    </svg>
  )
}
