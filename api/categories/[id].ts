import { eq } from 'drizzle-orm'

import { db } from '../../src/server/db/db.js'
import { categories } from '../../src/server/db/schema.js'
import { getRequestUser } from '../../src/server/request.js'

/**
 * PATCH /api/categories/:id — 更新分类 { name?, sortOrder?, isDefault? }
 * DELETE /api/categories/:id — 删除分类（书签级联删除）
 */
export default async function handler(req: any, res: any) {
  const ctx = await getRequestUser(req)
  if (!ctx) return res.status(401).json({ error: 'unauthorized' })

  // Vercel 把动态段放在 req.query.id 或 req.query；[id].ts 文件名对应 :id
  const id = req.query?.id ?? req.query?.[0]
  if (!id) return res.status(400).json({ error: 'id required' })

  if (req.method === 'PATCH') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const patch: Record<string, unknown> = {}
    if (typeof body?.name === 'string') patch.name = body.name.trim()
    if (typeof body?.sortOrder === 'number') patch.sortOrder = body.sortOrder
    if (typeof body?.isDefault === 'boolean') patch.isDefault = body.isDefault
    if (Object.keys(patch).length === 0) return res.status(400).json({ error: 'nothing to update' })
    if (body?.isDefault) {
      await db.update(categories).set({ isDefault: false }).where(eq(categories.userId, ctx.userId))
    }
    const row = await db
      .update(categories)
      .set(patch)
      .where(eq(categories.id, String(id)))
      .returning()
    return res.status(200).json(row[0] ?? null)
  }

  if (req.method === 'DELETE') {
    await db.delete(categories).where(eq(categories.id, String(id)))
    return res.status(204).end()
  }

  res.setHeader('Allow', 'PATCH,DELETE')
  return res.status(405).json({ error: 'method not allowed' })
}
