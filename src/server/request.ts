import { eq } from 'drizzle-orm'
import { auth } from './auth.js'
import { db } from './db/db.js'
import { extensionTokens } from './db/schema.js'

export interface AuthedContext {
  userId: string
}

/**
 * 从请求中解析用户身份。
 * 优先：Better Auth session cookie。
 * 兜底：Authorization: Bearer <extension-token>。
 */
export async function getRequestUser(req: {
  headers: Record<string, string | string[] | undefined>
}): Promise<AuthedContext | null> {
  // 1. Try session cookie
  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === 'string') headers.set(k, v)
    else if (Array.isArray(v) && v[0]) headers.set(k, v[0])
  }
  const result = await auth.api.getSession({ headers })
  if (result?.session?.userId) return { userId: result.session.userId }

  // 2. Try Bearer token (extension)
  const authHeader = headers.get('authorization') || headers.get('Authorization') || ''
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const [row] = await db
      .select({ userId: extensionTokens.userId })
      .from(extensionTokens)
      .where(eq(extensionTokens.token, token))
      .limit(1)
    if (row) return { userId: row.userId }
  }
  return null
}
