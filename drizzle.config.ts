import { defineConfig } from 'drizzle-kit'

/**
 * Drizzle Kit 配置：
 * - schema 入口：src/server/db/schema.ts（Better Auth 四表 + 业务表）
 * - 迁移文件输出：./drizzle
 * - DDL 使用直连接串 DATABASE_URL_UNPOOLED（Neon 的池化连接不执行迁移）
 */
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL

if (!url) {
  throw new Error('缺少 DATABASE_URL_UNPOOLED（或 DATABASE_URL）环境变量，无法执行数据库迁移。')
}

export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
  verbose: true,
  strict: true,
})
