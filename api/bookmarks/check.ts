import { eq } from 'drizzle-orm'
import { db } from '../src/server/db/db.js'
import { bookmarks } from '../src/server/db/schema.js'
import { getRequestUser } from '../src/server/request.js'

/**
 * POST /api/bookmarks/check — 批量检测书签 URL 是否可达
 */
export default async function handler(req: any, res: any) {
  const ctx = await getRequestUser(req)
  if (!ctx) return res.status(401).json({ error: 'unauthorized' })

  const rows = await db.select().from(bookmarks).where(eq(bookmarks.userId, ctx.userId))

  const results: Record<string, { ok: boolean; status?: number }> = {}
  for (const bm of rows) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const resp = await fetch(bm.url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }).catch(() => null)
      clearTimeout(timeout)
      results[bm.id] = { ok: !!resp && resp.status < 400, status: resp?.status }
    } catch {
      results[bm.id] = { ok: false }
    }
  }

  return res.json({ results })
}
