import { eq } from 'drizzle-orm'
import { db } from '../src/server/db/db.js'
import { categories, bookmarks } from '../src/server/db/schema.js'
import { getRequestUser } from '../src/server/request.js'

/**
 * POST /api/webdav — Proxy WebDAV backup/restore
 * body: { action: 'backup' | 'restore', webdavUrl, username, password }
 *
 * backup: dumps user's categories+bookmarks as JSON, PUT to webdavUrl
 * restore: GET from webdavUrl, replaces local data (in a later version; here just returns the JSON)
 */
export default async function handler(req: any, res: any) {
  const ctx = await getRequestUser(req)
  if (!ctx) return res.status(401).json({ error: 'unauthorized' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const { action, webdavUrl, username, password } = body ?? {}
  if (!webdavUrl || !username || !password) {
    return res.status(400).json({ error: 'webdavUrl, username, password required' })
  }

  const auth = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')

  if (action === 'backup') {
    const [cats, bms] = await Promise.all([
      db.select().from(categories).where(eq(categories.userId, ctx.userId)),
      db.select().from(bookmarks).where(eq(bookmarks.userId, ctx.userId)),
    ])
    const payload = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), categories: cats, bookmarks: bms }, null, 2)
    const resp = await fetch(webdavUrl, {
      method: 'PUT',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: payload,
    })
    if (!resp.ok && resp.status !== 201 && resp.status !== 204) {
      return res.status(502).json({ error: `WebDAV PUT failed: ${resp.status}` })
    }
    return res.json({ ok: true, size: payload.length, categories: cats.length, bookmarks: bms.length })
  }

  if (action === 'restore') {
    const resp = await fetch(webdavUrl, {
      method: 'GET',
      headers: { Authorization: auth },
    })
    if (!resp.ok) {
      return res.status(502).json({ error: `WebDAV GET failed: ${resp.status}` })
    }
    const text = await resp.text()
    return res.json({ ok: true, data: JSON.parse(text) })
  }

  return res.status(400).json({ error: 'action must be backup or restore' })
}
