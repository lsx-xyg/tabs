import { auth } from '../../src/server/auth.ts'

/**
 * Vercel Serverless Function：Better Auth 路由入口（/api/auth/*）。
 * 会话验证直接查库（session 表），与业务数据同源。
 */
export default auth.handler
