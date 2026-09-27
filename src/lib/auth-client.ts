import { createAuthClient } from 'better-auth/vue'

/**
 * Better Auth 前端客户端：
 * - baseURL 取当前源（生产同源；本地开发经 Vite /api 代理到 dev-api）
 * - 通过 useSession() 读取当前会话与用户 ID
 */
export const authClient = createAuthClient()
