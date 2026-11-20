const KEY = 'et.currentUserId'

function readStoredUserId(): number | null {
  try {
    const value = Number(localStorage.getItem(KEY))
    return Number.isInteger(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

let userIdOfThisTab = readStoredUserId()

export function getCurrentUserId(): number | null {
  return userIdOfThisTab
}

export function setCurrentUserId(userId: number | null) {
  userIdOfThisTab = userId
  try {
    if (userId === null) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, String(userId))
  } catch {
    return
  }
}
