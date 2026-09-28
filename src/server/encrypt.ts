import { createCipheriv, createDecipheriv, createHash } from 'node:crypto'

const KEY = createHash('sha256').update(process.env.BETTER_AUTH_SECRET || 'dev').digest()
const ALGO = 'aes-256-gcm'

export function encrypt(plain: string): string {
  const iv = createHash('md5').update(String(Date.now())).digest().slice(0, 12)
  const cipher = createCipheriv(ALGO, KEY, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

export function decrypt(payload: string): string {
  const buf = Buffer.from(payload, 'base64')
  const iv = buf.slice(0, 12)
  const tag = buf.slice(12, 28)
  const data = buf.slice(28)
  const decipher = createDecipheriv(ALGO, KEY, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}
