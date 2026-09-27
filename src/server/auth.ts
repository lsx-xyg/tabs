import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'

import { db } from './db/db.ts'
import * as schema from './db/schema.ts'
import { getAuthSecret, readEnv } from './env.ts'

/**
 * Better Auth 服务端实例：
 * - 用户表 / 会话表 / 账号表与业务表同处一个 Neon 数据库（单一数据源）
 * - 会话存于 session 表，Serverless Function 直接查库验证会话
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: {
    enabled: true,
  },
  secret: getAuthSecret(),
  baseURL: readEnv('BETTER_AUTH_URL'),
})
