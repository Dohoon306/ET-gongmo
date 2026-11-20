const avatarVersions = new Map<number, number>()
const avatarListeners = new Set<() => void>()

export function getProfileAvatarVersion(userId?: number) {
  return userId === undefined ? 0 : (avatarVersions.get(userId) ?? 0)
}

export function subscribeProfileAvatars(listener: () => void) {
  avatarListeners.add(listener)
  return () => { avatarListeners.delete(listener) }
}

export function refreshProfileAvatar(userId: number) {
  avatarVersions.set(userId, Math.max(Date.now(), getProfileAvatarVersion(userId) + 1))
  avatarListeners.forEach((listener) => listener())
}
