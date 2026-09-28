import { eq } from 'drizzle-orm'
import { db } from '../src/server/db/db.js'
import { userSettings } from '../src/server/db/schema.js'
import { getRequestUser } from '../src/server/request.js'
import { encrypt } from '../src/server/encrypt.js'

/**
 * GET /api/settings — 返回当前用户设置（密码已脱敏）
 * PUT /api/settings — 保存设置 { webdavUrl?, webdavUser?, webdavPass? }
 */
export default async function handler(req: any, res: any) {
  const ctx = await getRequestUser(req)
  if (!ctx) return res.status(401).json({ error: 'unauthorized' })

  if (req.method === 'GET') {
    const [row] = await db.select().from(userSettings).where(eq(userSettings.userId, ctx.userId)).limit(1)
    return res.json({
      webdavUrl: row?.webdavUrl || '',
      webdavUser: row?.webdavUser || '',
      webdavPassSet: !!row?.webdavPassEnc,
    })
  }

  if (req.method === 'PUT') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const set: Record<string, unknown> = { updatedAt: new Date() }
    const insert: Record<string, unknown> = { userId: ctx.userId, updatedAt: new Date() }
    if (body.webdavUrl !== undefined) { set.webdavUrl = body.webdavUrl || null; insert.webdavUrl = body.webdavUrl || null }
    if (body.webdavUser !== undefined) { set.webdavUser = body.webdavUser || null; insert.webdavUser = body.webdavUser || null }
    if (body.webdavPass) { const enc = encrypt(body.webdavPass); set.webdavPassEnc = enc; insert.webdavPassEnc = enc }
    await db.insert(userSettings).values(insert).onConflictDoUpdate({
      target: userSettings.userId,
      set,
    })
    return res.json({ ok: true })
  }

  return res.status(405).json({ error: 'method not allowed' })
}
