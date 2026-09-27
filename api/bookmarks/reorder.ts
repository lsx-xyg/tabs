import { eq } from 'drizzle-orm'

import { db } from '../../src/server/db/db.js'
import { bookmarks } from '../../src/server/db/schema.js'
import { getRequestUser } from '../../src/server/request.js'

/**
 * POST /api/bookmarks/reorder — 批量更新书签排序
 * body: { ids: string[] }（按数组顺序作为 sortOrder）
 */
export default async function handler(req: any, res: any) {
  const ctx = await getRequestUser(req)
  if (!ctx) return res.status(401).json({ error: 'unauthorized' })

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method not allowed' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const ids: string[] = body?.ids
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids array required' })

  for (let i = 0; i < ids.length; i++) {
    await db
      .update(bookmarks)
      .set({ sortOrder: i, updatedAt: new Date() })
      .where(eq(bookmarks.id, ids[i]))
  }
  return res.status(200).json({ ok: true })
}
