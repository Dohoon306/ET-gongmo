import { getDeadline } from './deadline.ts'

export function DDayBadge({ endDate, today }: { endDate?: string | null; today?: Date }) {
  const { label, date, urgent, expired } = getDeadline(endDate, today)
  const colors = urgent ? 'bg-[#FBEFE3] text-[#9A4508]'
    : expired ? 'bg-[#F6F7F3] text-[#56635B]' : 'bg-[#EEF1EC] text-[#3B4840]'
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-xs">
      <span className={`rounded-md px-2 py-1 font-semibold ${colors}`}>{label}</span>
      {date && <time dateTime={endDate ?? undefined} className="text-[#56635B]">{date}</time>}
    </span>
  )
}

export default DDayBadge
