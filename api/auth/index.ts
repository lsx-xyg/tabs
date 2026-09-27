import { toNodeHandler } from 'better-auth/node'

import { auth } from '../../src/server/auth.js'

/**
 * Vercel Serverless Function：Better Auth 路由入口（/api/auth/*）。
 * Vite 项目下 [...all].ts 不被 Vercel 识别为多级 catch-all，
 * 因此改用固定文件名 index.ts + vercel.json rewrites 转发。
 */
export default toNodeHandler(auth)
