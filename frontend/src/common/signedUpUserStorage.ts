const KEY = 'et.signedUpUserIds'

export function getSignedUpUserIds(): number[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(stored) ? stored.filter((id): id is number => Number.isInteger(id)) : []
  } catch {
    return []
  }
}

export function rememberSignedUpUser(userId: number) {
  try {
    const ids = getSignedUpUserIds()
    if (!ids.includes(userId)) localStorage.setItem(KEY, JSON.stringify([...ids, userId]))
  } catch {
    return
  }
}

export function forgetSignedUpUser(userId: number) {
  try {
    localStorage.setItem(KEY, JSON.stringify(getSignedUpUserIds().filter((id) => id !== userId)))
  } catch {
    return
  }
}
