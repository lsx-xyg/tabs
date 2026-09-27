import type { IncomingMessage, ServerResponse } from 'node:http'

/** 对照函数：验证 api/auth/ 子目录下的非动态路由是否可达。 */
export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify({ ok: true, route: 'api/auth/ping', ts: Date.now() }))
}
