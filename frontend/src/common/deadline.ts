const seoulCalendar = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function getDeadline(endDate: string | null | undefined, now = new Date()) {
  if (!endDate) return { label: '상시', date: null, urgent: false, expired: false }

  const today = seoulCalendar.formatToParts(now)
  const year = Number(today.find((part) => part.type === 'year')?.value)
  const month = Number(today.find((part) => part.type === 'month')?.value)
  const day = Number(today.find((part) => part.type === 'day')?.value)
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number)
  const days = (Date.UTC(endYear, endMonth - 1, endDay) - Date.UTC(year, month - 1, day)) / 86_400_000

  return {
    label: days < 0 ? '마감' : days === 0 ? 'D-Day' : `D-${days}`,
    date: `${endMonth}.${String(endDay).padStart(2, '0')} ${days < 0 ? '종료' : '마감'}`,
    urgent: days >= 0 && days <= 3,
    expired: days < 0,
  }
}
