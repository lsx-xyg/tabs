/**
 * Vercel 构建期自动迁移。
 *
 * - Vercel 构建时环境变量已注入（DATABASE_URL_UNPOOLED 存在）→ 执行 raw SQL 补列 + drizzle-kit migrate。
 * - 本地开发未配环境变量 → 静默跳过，`npm run build` 照常产出前端产物。
 */
import { spawnSync } from 'node:child_process'
import postgres from 'postgres'

const url =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.database_url_unpooled

if (!url) {
  console.log(
    '[migrate-on-build] 未检测到 DATABASE_URL_UNPOOLED，跳过数据库迁移（本地构建模式）',
  )
  process.exit(0)
}

console.log('[migrate-on-build] 检测到直连串，补列 + 执行迁移…')

// Raw SQL: 确保 parent_id 列存在（drizzle 迁移记录可能与实际 schema 不一致）
try {
  const sql = postgres(url, { max: 1 })
  await sql`ALTER TABLE IF EXISTS categories ADD COLUMN IF NOT EXISTS parent_id text`
  await sql.end()
  console.log('[migrate-on-build] parent_id 列已确认存在')
} catch (e) {
  console.error('[migrate-on-build] 补列失败:', e.message)
  process.exit(1)
}

const result = spawnSync('npm', ['run', 'db:migrate'], {
  stdio: 'inherit',
})
process.exit(result.status ?? 1)
