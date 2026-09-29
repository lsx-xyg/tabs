import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from '../src/server/db/db.js'
import { extensionTokens } from '../src/server/db/schema.js'
import { getRequestUser } from '../src/server/request.js'

/**
 * POST /api/extension-token — 用现有 session 换取一个长期扩展 token
 * DELETE /api/extension-token — 撤销 token
 */
export default async function handler(req: any, res: any) {
  const ctx = await getRequestUser(req)
  if (!ctx) return res.status(401).json({ error: 'unauthorized' })

  if (req.method === 'POST') {
    const token = randomUUID().replace(/-/g, '')
    await db.insert(extensionTokens).values({ token, userId: ctx.userId })
    return res.json({ token })
  }

  if (req.method === 'DELETE') {
    const auth = req.headers.authorization || ''
    if (auth.startsWith('Bearer ')) {
      await db.delete(extensionTokens).where(eq(extensionTokens.token, auth.slice(7)))
    }
    return res.json({ ok: true })
  }

  return res.status(405).json({ error: 'method not allowed' })
}
