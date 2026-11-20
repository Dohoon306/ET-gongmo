import { getDeadline } from './deadline.ts'

export function DDayBadge({ endDate, today }: { endDate?: string | null; today?: Date }) {
  const { label, date, urgent, expired } = getDeadline(endDate, today)
  const colors = urgent ? 'bg-accent-soft text-accent'
    : expired ? 'bg-subtle text-muted' : 'bg-subtle text-ink'
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-xs tabular-nums">
      <span className={`inline-flex h-6 items-center rounded-sm px-2 font-bold ${colors}`}>{label}</span>
      {date && <time dateTime={endDate ?? undefined} className="text-muted">{date}</time>}
    </span>
  )
}

export default DDayBadge
