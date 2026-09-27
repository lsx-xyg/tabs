import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * 临时探针：验证 catch-all 路由本身是否被 Vercel 识别。
 * 不引入 better-auth/drizzle 重型依赖。
 */
export default function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('content-type', 'application/json')
  res.end(
    JSON.stringify({
      ok: true,
      route: 'auth-catchall',
      url: req.url,
      ts: Date.now(),
    }),
  )
}
