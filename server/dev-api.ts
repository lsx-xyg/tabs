import { createServer } from 'node:http'

import { toNodeHandler } from 'better-auth/node'

import { auth } from '../src/server/auth'

/**
 * 本地开发 API 服务（Better Auth）：
 * `npm run dev:api` 启动于 http://localhost:8787，Vite 将 /api 代理到此端口，
 * 与生产（Vercel Serverless Function）行为一致：会话 Cookie 同源传递。
 */
const port = Number(process.env.PORT ?? 8787)
const handler = toNodeHandler(auth)

const server = createServer((req, res) => {
  void handler(req, res)
})

server.listen(port, () => {
  console.log(`[dev-api] Better Auth 本地服务就绪: http://localhost:${port}/api/auth/*`)
})
