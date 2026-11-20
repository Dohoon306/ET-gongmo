import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { api } from '../../api/client.ts'

type BookmarkSnapshot = {
  ids: ReadonlySet<number> | null
  pending: ReadonlySet<number>
  error: string | null
}

const empty: BookmarkSnapshot = { ids: null, pending: new Set(), error: null }
const snapshots = new Map<number, BookmarkSnapshot>()
const listeners = new Map<number, Set<() => void>>()
const loads = new Map<number, Promise<void>>()

function snapshot(userId: number) {
  return snapshots.get(userId) ?? empty
}

function publish(userId: number, next: BookmarkSnapshot) {
  snapshots.set(userId, next)
  listeners.get(userId)?.forEach((listener) => listener())
}

export function bookmarkHeaders(userId: number) {
  return { 'X-User-Id': String(userId) }
}

export function loadBookmarkIds(userId: number) {
  const existing = loads.get(userId)
  if (existing) return existing
  const request = api<number[]>('/api/bookmarks/ids', { headers: bookmarkHeaders(userId) })
    .then((ids) => publish(userId, { ...snapshot(userId), ids: new Set(ids), error: null }))
    .catch((error: Error) => publish(userId, { ...snapshot(userId), error: error.message }))
    .finally(() => loads.delete(userId))
  loads.set(userId, request)
  return request
}

export function useBookmarkIds(userId: number | null) {
  const subscribe = useCallback((listener: () => void) => {
    if (userId === null) return () => {}
    const active = listeners.get(userId) ?? new Set()
    active.add(listener)
    listeners.set(userId, active)
    return () => {
      active.delete(listener)
      if (active.size === 0) listeners.delete(userId)
    }
  }, [userId])
  const read = useCallback(() => userId === null ? empty : snapshot(userId), [userId])
  const state = useSyncExternalStore(subscribe, read)

  useEffect(() => {
    if (userId !== null && snapshot(userId).ids === null) void loadBookmarkIds(userId)
  }, [userId])

  return state
}

export async function setBookmark(userId: number, contestId: number, saved: boolean) {
  const previous = snapshot(userId)
  if (previous.pending.has(contestId)) return false
  publish(userId, { ...previous, pending: new Set([...previous.pending, contestId]) })
  try {
    await loads.get(userId)
    await api(`/api/bookmarks/${contestId}`, {
      method: saved ? 'PUT' : 'DELETE',
      headers: bookmarkHeaders(userId),
    })
    const current = snapshot(userId)
    if (current.ids === null) {
      await loadBookmarkIds(userId)
      return true
    }
    const ids = new Set(current.ids)
    if (saved) ids.add(contestId)
    else ids.delete(contestId)
    publish(userId, { ...current, ids, error: null })
    return true
  } finally {
    const current = snapshot(userId)
    const pending = new Set(current.pending)
    pending.delete(contestId)
    publish(userId, { ...current, pending })
  }
}
