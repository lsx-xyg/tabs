import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { getDatabaseUrl } from '../env.ts'
import * as schema from './schema.ts'

/**
 * 数据库连接（单一数据源）：
 * - 运行时使用 DATABASE_URL（Neon 池化连接串，与 pgBouncer 事务池兼容）
 * - prepare: false 避免池化连接上的预编译语句问题（Vercel serverless 推荐）
 * - 前端不直接持有连接串，所有读写经 Serverless Function 中转
 */
const client = postgres(getDatabaseUrl(), {
  max: 1,
  prepare: false,
  idle_timeout: 20,
  connect_timeout: 10,
})

export const db = drizzle(client, { schema })
