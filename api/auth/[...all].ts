import { toNodeHandler } from 'better-auth/node'

import { auth } from '../../src/server/auth.js'

/**
 * Vercel Serverless Function：Better Auth 路由入口（/api/auth/*）。
 * 使用 toNodeHandler（req, res）签名，兼容 Vercel Node 运行时；
 * 会话验证直接查库（session 表），与业务数据同源。
 */
export default toNodeHandler(auth)
