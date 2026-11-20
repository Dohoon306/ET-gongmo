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
      className={`flex h-10 items-center whitespace-nowrap rounded-lg px-3 text-[15px] ${current ? 'bg-brand-soft font-semibold text-brand' : 'font-medium text-red-700 hover:bg-gray-100'}`}
    >
      관리자
    </Link>
  )
}
