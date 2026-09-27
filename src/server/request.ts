import { auth } from './auth.js'

export interface AuthedContext {
  userId: string
}

/**
 * 从请求中解析 Better Auth 会话。
 * 未登录或会话无效时返回 null，由调用方决定 401。
 */
export async function getRequestUser(req: {
  headers: Record<string, string | string[] | undefined>
}): Promise<AuthedContext | null> {
  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === 'string') headers.set(k, v)
    else if (Array.isArray(v) && v[0]) headers.set(k, v[0])
  }
  const result = await auth.api.getSession({ headers })
  if (!result?.session?.userId) return null
  return { userId: result.session.userId }
}
