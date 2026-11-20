import { Link } from 'react-router'
import { userRoutes } from '../features/user/routes.tsx'
import { contestRoutes } from '../features/contest/routes.tsx'
import { teamRoutes } from '../features/team/routes.tsx'
import { bookmarkRoutes } from '../features/bookmark/routes.tsx'
import { profileRoutes } from '../features/profile/routes.tsx'

const sections = [
  { title: 'A. 사용자 판단', routes: userRoutes },
  { title: 'B. 공모전', routes: contestRoutes },
  { title: 'C. 팀 모집', routes: teamRoutes },
  { title: 'D. 관심 공고 · 팀원 평가', routes: [...bookmarkRoutes, ...profileRoutes] },
]

export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">개발용 화면 목록</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((s) => (
          <section key={s.title} className="rounded-md border border-line bg-white p-4">
            <h2 className="mb-3 font-semibold">{s.title}</h2>
            <ul className="space-y-1 text-sm">
              {s.routes.map((r) => (
                <li key={r.path}>
                  <Link to={r.path} className="text-brand hover:underline">
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
