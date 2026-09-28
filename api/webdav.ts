import { eq } from 'drizzle-orm'
import { db } from '../src/server/db/db.js'
import { categories, bookmarks, userSettings } from '../src/server/db/schema.js'
import { getRequestUser } from '../src/server/request.js'
import { decrypt } from '../src/server/encrypt.js'

/**
 * POST /api/webdav — Backup/restore to WebDAV using stored credentials
 * body: { action: 'backup' | 'restore' }
 */
export default async function handler(req: any, res: any) {
  const ctx = await getRequestUser(req)
  if (!ctx) return res.status(401).json({ error: 'unauthorized' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const { action } = body ?? {}

  const [row] = await db.select().from(userSettings).where(eq(userSettings.userId, ctx.userId)).limit(1)
  if (!row?.webdavUrl || !row?.webdavUser || !row?.webdavPassEnc) {
    return res.status(400).json({ error: '请先在设置中配置 WebDAV' })
  }
  const auth = 'Basic ' + Buffer.from(`${row.webdavUser}:${decrypt(row.webdavPassEnc)}`).toString('base64')

  if (action === 'backup') {
    const [cats, bms] = await Promise.all([
      db.select().from(categories).where(eq(categories.userId, ctx.userId)),
      db.select().from(bookmarks).where(eq(bookmarks.userId, ctx.userId)),
    ])
    const payload = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), categories: cats, bookmarks: bms }, null, 2)

    // Try PUT; if 409 (parent missing), MKCOL parent and retry
    const doPut = () => fetch(row.webdavUrl, {
      method: 'PUT',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: payload,
    })
    let resp = await doPut()
    if (resp.status === 409) {
      try {
        const url = new URL(row.webdavUrl)
        const parent = url.pathname.substring(0, url.pathname.lastIndexOf('/'))
        if (parent && parent !== '/') {
          await fetch(`${url.origin}${parent}/`, { method: 'MKCOL', headers: { Authorization: auth } })
        }
      } catch {}
      resp = await doPut()
    }
    if (!resp.ok && resp.status !== 201 && resp.status !== 204) {
      const text = await resp.text().catch(() => '')
      return res.status(502).json({ error: `WebDAV PUT ${resp.status}: ${text.slice(0, 200)}` })
    }
    return res.json({ ok: true, size: payload.length, categories: cats.length, bookmarks: bms.length })
  }

  if (action === 'restore') {
    const resp = await fetch(row.webdavUrl, { method: 'GET', headers: { Authorization: auth } })
    if (!resp.ok) return res.status(502).json({ error: `WebDAV GET failed: ${resp.status}` })
    const data = JSON.parse(await resp.text())
    return res.json({ ok: true, data })
  }

  return res.status(400).json({ error: 'action must be backup or restore' })
}
