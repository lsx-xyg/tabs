import { desc, eq, and } from 'drizzle-orm'

import { db } from '../src/server/db/db.js'
import { bookmarks, categories } from '../src/server/db/schema.js'
import { getRequestUser } from '../src/server/request.js'

/**
 * GET /api/bookmarks?categoryId=xxx — 某分类下书签（不传则全部）
 * POST /api/bookmarks — 新建书签 { name, url, categoryId, iconUrl? }
 */
export default async function handler(req: any, res: any) {
  const ctx = await getRequestUser(req)
  if (!ctx) return res.status(401).json({ error: 'unauthorized' })

  if (req.method === 'GET') {
    const categoryId = req.query?.categoryId
    const rows = await db
      .select()
      .from(bookmarks)
      .where(
        categoryId
          ? eq(bookmarks.categoryId, String(categoryId))
          : eq(bookmarks.userId, ctx.userId),
      )
      .orderBy(bookmarks.sortOrder, desc(bookmarks.createdAt))
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const name = (body?.name ?? '').trim()
    let url = (body?.url ?? '').trim()
    if (!name || !url) return res.status(400).json({ error: 'name and url required' })
    // 自动补全协议
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`
    const categoryId = body?.categoryId || null
    // Verify category belongs to user; fall back to null if invalid (e.g. local unsynced category)
    let finalCategoryId: string | null = null
    if (categoryId) {
      const [cat] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(and(eq(categories.id, categoryId), eq(categories.userId, ctx.userId)))
        .limit(1)
      if (cat) finalCategoryId = cat.id
    }
    const row = await db
      .insert(bookmarks)
      .values({
        userId: ctx.userId,
        categoryId: finalCategoryId,
        name,
        url,
        iconUrl: body?.iconUrl || null,
      })
      .returning()
    return res.status(201).json(row[0])
  }

  res.setHeader('Allow', 'GET,POST')
  return res.status(405).json({ error: 'method not allowed' })
}
