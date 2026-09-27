import { eq } from 'drizzle-orm'
import { db } from '../../src/server/db/db.js'
import { bookmarks } from '../../src/server/db/schema.js'
import { getRequestUser } from '../../src/server/request.js'

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
      const timeout = setTimeout(() => controller.abort(), 8000)
      const resp = await fetch(bm.url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      }).catch(() => null)
      clearTimeout(timeout)
      // 200-399 ok, 403 means site exists but blocks bots (still ok)
      const status = resp?.status ?? 0
      results[bm.id] = { ok: status > 0 && status < 500, status }
    } catch {
      results[bm.id] = { ok: false }
    }
  }

  return res.json({ results })
}
