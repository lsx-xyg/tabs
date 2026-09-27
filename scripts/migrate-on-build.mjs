/**
 * Vercel 构建期自动迁移。
 *
 * - Vercel 构建时环境变量已注入（DATABASE_URL_UNPOOLED 存在）→ 执行 drizzle-kit migrate。
 * - 本地开发未配环境变量 → 静默跳过，`npm run build` 照常产出前端产物。
 *
 * 只读 DATABASE_URL_UNPOOLED（直连），不用池化地址，避免迁移走 pgbouncer 事务模式。
 */
import { spawnSync } from 'node:child_process'

const url =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.database_url_unpooled

if (!url) {
  console.log(
    '[migrate-on-build] 未检测到 DATABASE_URL_UNPOOLED，跳过数据库迁移（本地构建模式）',
  )
  process.exit(0)
}

console.log('[migrate-on-build] 检测到直连串，执行数据库迁移…')
const result = spawnSync('npm', ['run', 'db:migrate'], {
  stdio: 'inherit',
})
process.exit(result.status ?? 1)
