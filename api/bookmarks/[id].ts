import { eq } from 'drizzle-orm'

import { db } from '../../src/server/db/db.js'
import { bookmarks } from '../../src/server/db/schema.js'
import { getRequestUser } from '../../src/server/request.js'

/**
 * PATCH /api/bookmarks/:id — 更新书签 { name?, url?, categoryId?, iconUrl?, sortOrder? }
 * DELETE /api/bookmarks/:id — 删除书签
 */
export default async function handler(req: any, res: any) {
  const ctx = await getRequestUser(req)
  if (!ctx) return res.status(401).json({ error: 'unauthorized' })

  const id = req.query?.id ?? req.query?.[0]
  if (!id) return res.status(400).json({ error: 'id required' })

  if (req.method === 'PATCH') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const patch: Record<string, unknown> = {}
    if (typeof body?.name === 'string') patch.name = body.name.trim()
    if (typeof body?.url === 'string' && body.url.trim()) {
      let u = body.url.trim()
      if (!/^https?:\/\//i.test(u)) u = `https://${u}`
      patch.url = u
    }
    if (body?.categoryId !== undefined) patch.categoryId = body.categoryId || null
    if (body?.iconUrl !== undefined) patch.iconUrl = body.iconUrl || null
    if (typeof body?.sortOrder === 'number') patch.sortOrder = body.sortOrder
    if (Object.keys(patch).length === 0) return res.status(400).json({ error: 'nothing to update' })
    patch.updatedAt = new Date()
    const row = await db
      .update(bookmarks)
      .set(patch)
      .where(eq(bookmarks.id, String(id)))
      .returning()
    return res.status(200).json(row[0] ?? null)
  }

  if (req.method === 'DELETE') {
    await db.delete(bookmarks).where(eq(bookmarks.id, String(id)))
    return res.status(204).end()
  }

  res.setHeader('Allow', 'PATCH,DELETE')
  return res.status(405).json({ error: 'method not allowed' })
}
