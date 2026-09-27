import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * 部署诊断端点：验证 Vercel 是否在构建/提供 Serverless Function。
 * 成功返回 {"ok":true} JSON；若仍返回 HTML 说明 api 函数未被识别。
 */
export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify({ ok: true, ts: Date.now() }))
}
