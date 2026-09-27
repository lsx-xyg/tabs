/// <reference types="node" />
/**
 * 环境变量读取规范（全项目统一入口）：
 * - 统一以全大写名称读取；若写入时用了小写（如 database_url），读取时自动转大写兜底。
 * - 必填变量缺失时直接抛错，避免带着空连接串运行。
 *
 * 生产（Vercel）注入：DATABASE_URL / DATABASE_URL_UNPOOLED（Neon 集成自动注入）、
 * BETTER_AUTH_SECRET、BETTER_AUTH_URL。
 * 本地开发：复制 .env.example 为 .env.local 并填写。
 */
export const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'DATABASE_URL_UNPOOLED',
  'BETTER_AUTH_SECRET',
] as const

export type EnvVarName = (typeof REQUIRED_ENV_VARS)[number]

/** 读取环境变量：优先精确名（全大写），缺失时对小写形式做转大写兜底。 */
export function readEnv(name: string): string | undefined {
  const exact = process.env[name]
  if (exact) return exact
  const lowercase = process.env[name.toLowerCase()]
  if (lowercase) return lowercase
  return undefined
}

/** 读取必填环境变量，缺失即抛错。 */
export function requireEnv(name: EnvVarName): string {
  const value = readEnv(name)
  if (!value) {
    throw new Error(
      `缺少必填环境变量: ${name}。请在 Vercel 环境变量或本地 .env.local 中配置。`,
    )
  }
  return value
}

/** Neon 业务查询连接串（池化，Vercel 用 DATABASE_URL）。 */
export function getDatabaseUrl(): string {
  return requireEnv('DATABASE_URL')
}

/** Neon 直连连接串（DDL/迁移用，Vercel 用 DATABASE_URL_UNPOOLED）。 */
export function getDatabaseUrlUnpooled(): string {
  return requireEnv('DATABASE_URL_UNPOOLED')
}

/** Better Auth 会话签名密钥。 */
export function getAuthSecret(): string {
  return requireEnv('BETTER_AUTH_SECRET')
}
