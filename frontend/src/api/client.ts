import { getStoredUserId } from '../common/currentUserStorage.ts'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type ApiOptions = Omit<RequestInit, 'body'> & { body?: unknown }

export async function api<T = void>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options
  const userId = getStoredUserId()

  const res = await fetch(path, {
    ...rest,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(userId !== null ? { 'X-User-Id': String(userId) } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new ApiError(res.status, data?.message ?? `요청 실패 (${res.status})`)
  }

  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}
