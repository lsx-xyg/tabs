import { desc, eq } from 'drizzle-orm'

import { db } from '../src/server/db/db.js'
import { categories } from '../src/server/db/schema.js'
import { getRequestUser } from '../src/server/request.js'

/**
 * GET /api/categories — 当前用户的分类列表
 * POST /api/categories — 新建分类 { name }
 */
export default async function handler(req: any, res: any) {
  const ctx = await getRequestUser(req)
  if (!ctx) return res.status(401).json({ error: 'unauthorized' })

  if (req.method === 'GET') {
    const rows = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, ctx.userId))
      .orderBy(categories.sortOrder, desc(categories.createdAt))
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const name = (body?.name ?? '').trim()
    if (!name) return res.status(400).json({ error: 'name required' })
    const count = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.userId, ctx.userId))
    const row = await db
      .insert(categories)
      .values({ userId: ctx.userId, name, parentId: body?.parentId || null, sortOrder: count.length, isDefault: count.length === 0 })
      .returning()
    return res.status(201).json(row[0])
  }

  res.setHeader('Allow', 'GET,POST')
  return res.status(405).json({ error: 'method not allowed' })
}
