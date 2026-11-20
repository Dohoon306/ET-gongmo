import { Link, useLocation } from 'react-router'
import { useIsAdmin } from './adminApi.ts'

export default function AdminMenuLink() {
  const isAdmin = useIsAdmin()
  const { pathname } = useLocation()
  if (!isAdmin) return null
  const current = pathname.startsWith('/admin')
  return (
    <Link
      to="/admin"
      aria-current={current ? 'page' : undefined}
      className={`flex h-11 items-center whitespace-nowrap border-b-2 px-3 text-[15px] md:h-[60px] ${current ? 'border-brand font-semibold text-ink' : 'border-transparent font-medium text-muted hover:text-ink'}`}
    >
      관리자
    </Link>
  )
}
