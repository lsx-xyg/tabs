# Tabs — 跨设备书签导航应用

一个自己掌控的网页版书签导航站：左侧分类导航，中间卡片式快捷访问，登录后数据跨设备同步。

## 技术栈

- **前端**：Vue 3 + TypeScript + Vite
- **状态管理**：Pinia
- **样式 / UI**：Tailwind CSS + ShadCN Vue（nova 风格，zinc 基础色，CSS variables）+ lucide-vue-next
- **拖拽**：vue-draggable-plus
- **测试**：Vitest（jsdom + @vue/test-utils）
- **后端**：Neon Postgres + Drizzle ORM + Better Auth + Vercel Serverless Function（`/api/*`）
- **部署**：Vercel / Netlify（均已配置 SPA 重写）

> 说明：ShadCN Vue v2 已将原 "New York" 风格更名为 `nova`，基础色按新枚举取与 Slate 最接近的 `zinc`，均通过 `components.json` 可随时调整。

## 环境变量

复制 `.env.example` 为 `.env.local` 并填写（本地开发）。生产环境在 Vercel 上配置同名变量（Neon 集成会自动注入前两个）：

| 变量 | 用途 |
|---|---|
| `DATABASE_URL` | Neon 池化连接串，运行时查询使用 |
| `DATABASE_URL_UNPOOLED` | Neon 直连接串，数据库迁移（DDL）使用 |
| `BETTER_AUTH_SECRET` | 会话签名密钥（`openssl rand -base64 32` 生成） |
| `BETTER_AUTH_URL` | 部署后站点地址（生产必填） |

前端**不直接持有数据库连接串**：所有数据读写经 Serverless Function 中转，由 `src/server/env.ts` 统一按全大写读取（小写写入自动兜底）。

## 部署（Vercel）

`npm run build` 已内置自动迁移：构建时若检测到 `DATABASE_URL_UNPOOLED`（Vercel 环境注入），会先执行 `drizzle-kit migrate` 再构建前端产物，**首次部署即自动建表，无需手动跑迁移**；本地未配置该变量时自动跳过，不影响日常 `npm run build`。

- 需在 Vercel 环境变量中确认 `DATABASE_URL_UNPOOLED` 的作用域包含 Production。
- `BETTER_AUTH_SECRET` 与 `BETTER_AUTH_URL` 需手动配置（见上表）。

## 快速开始

```bash
npm install
cp .env.example .env.local   # 填写本地数据库连接

# 终端 1：本地 API（Better Auth，端口 8787，Vite 自动代理 /api）
npm run dev:api
# 终端 2：前端
npm run dev

npm test          # 单元测试（Vitest）
npm run build     # 生产构建
npm run db:generate   # 依据 schema 生成迁移 SQL（./drizzle）
npm run db:migrate    # 应用迁移（使用 DATABASE_URL_UNPOOLED）
```

## 目录结构

```
src/
├── components/ui/     # ShadCN Vue 组件（button / card / dialog / input）
├── lib/               # 前端工具（auth-client 等）
├── server/            # 服务端：env 注入、db 连接、drizzle schema、auth 实例
├── __tests__/         # 单元测试
├── App.vue            # 应用壳（含认证面板）
├── main.ts
└── style.css          # Tailwind v4 入口 + 主题 CSS 变量
api/auth/[...all].ts   # Vercel Serverless Function：Better Auth 路由
server/dev-api.ts      # 本地 API 服务（npm run dev:api）
drizzle/               # Drizzle 迁移 SQL
```

## 开发约定

- UI 图标统一使用 `lucide-vue-next` 按需导入，不使用 `import * as icons`。
- 组件内部 `<style>` 若用到 `@apply`，需加 `@reference` 指向 `src/style.css`。
- 唯一核心 seam 为书签仓库（bookmark repository），后续迭代所有数据读写经它中转。

## 工程化

- Issue / Spec / Tickets 均托管在 GitHub Issues，见 `AGENTS.md` 与 `docs/agents/`。
- Triage 标签：`needs-triage` / `needs-info` / `ready-for-agent` / `ready-for-human` / `wontfix`。
