import { useEffect, useState } from 'react'
import { api } from '../../api/client.ts'

type PhotoVersions = Record<string, number>

let cache: Promise<PhotoVersions> | null = null
const listeners = new Set<(versions: PhotoVersions) => void>()

function loadPhotoVersions() {
  cache ??= api<PhotoVersions>('/api/users/photo-versions').catch(() => ({}))
  return cache
}

export function refreshPhotoVersions() {
  cache = null
  void loadPhotoVersions().then((versions) => listeners.forEach((listener) => listener(versions)))
}

export function usePhotoVersions() {
  const [versions, setVersions] = useState<PhotoVersions>({})
  useEffect(() => {
    let alive = true
    void loadPhotoVersions().then((loaded) => alive && setVersions(loaded))
    listeners.add(setVersions)
    return () => {
      alive = false
      listeners.delete(setVersions)
    }
  }, [])
  return versions
}

export function photoUrl(userId: number | string, version: number) {
  return `/api/users/${userId}/photo?v=${version}`
}
