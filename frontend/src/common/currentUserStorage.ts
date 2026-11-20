const KEY = 'et.currentUserId'

export function getStoredUserId(): number | null {
  try {
    const value = localStorage.getItem(KEY)
    return value ? Number(value) : null
  } catch {
    return null
  }
}

export function storeUserId(userId: number | null): boolean {
  try {
    if (userId === null) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, String(userId))
    return true
  } catch {
    return false
  }
}
