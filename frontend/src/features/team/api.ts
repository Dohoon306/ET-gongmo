import { useEffect, useState } from 'react'
import { api } from '../../api/client.ts'
import { useCurrentUser } from '../../common/useCurrentUser.ts'

export type Tag = { id: number; name: string; axis: string; matched: boolean }

export type Contest = { id: number; title: string; endDate: string | null; applyUrl: string | null }

export type Room = {
  id: number
  contestId: number | null
  hostId: number
  hostName: string
  title: string
  intro: string | null
  capacity: number
  memberCount: number
  status: 'RECRUITING' | 'FULL' | 'CLOSED'
  overlap: number
  tags: Tag[]
  contest: Contest | null
}

export type RoomList = { contest: Contest | null; rooms: Room[] }

export type Person = {
  id: number
  userId: number
  name: string
  role: 'HOST' | 'MEMBER' | null
  message: string | null
  createdAt: string | null
  tags: Tag[]
}

export type MyTeam = {
  roomId: number
  title: string
  status: 'RECRUITING' | 'FULL'
  role: 'HOST' | 'MEMBER'
  capacity: number
  memberCount: number
  contest: Contest | null
}

export function useGet<T>(path: string | null, pollMs?: number) {
  const { userId } = useCurrentUser()
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!path || !pollMs) return
    const timer = setInterval(() => setVersion((v) => v + 1), pollMs)
    return () => clearInterval(timer)
  }, [path, pollMs])

  useEffect(() => {
    if (!path) return
    let alive = true
    api<T>(path)
      .then((d) => {
        if (!alive) return
        setData(d)
        setError(null)
      })
      .catch((e: Error) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [path, userId, version])

  return { data, error, reload: () => setVersion((v) => v + 1) }
}

export function idParam(value: string | undefined): number | null {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

export function timeAgo(iso: string | null) {
  if (!iso) return ''
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}시간 전`
  return `${Math.floor(minutes / 60 / 24)}일 전`
}

const COMPOSITION_AXES = ['ROLE', 'LEVEL', 'GOAL']

export function teamComposition(members: Person[]) {
  const counts = new Map<number, { tag: Tag; count: number; order: number }>()
  members.forEach((m) =>
    m.tags.forEach((tag, order) => {
      if (!COMPOSITION_AXES.includes(tag.axis)) return
      const entry = counts.get(tag.id) ?? { tag, count: 0, order: tag.id * 100 + order }
      entry.count += 1
      counts.set(tag.id, entry)
    }),
  )
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.tag.id - b.tag.id)
    .slice(0, 4)
    .sort((a, b) => a.tag.id - b.tag.id)
}
