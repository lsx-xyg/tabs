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

## 浏览器扩展（一键收藏当前页）

`extension/` 目录下是一个 Manifest V3 扩展，安装后点击图标即可把当前网页收藏到你的 Tabs 导航站。

### 安装

1. 先在浏览器里登录你的 Tabs 站点（如 `https://tabs.dbthree.dpdns.org`），保持登录态。
2. 打开浏览器扩展管理页：
   - Chrome / Edge：地址栏输入 `chrome://extensions`（Edge 为 `edge://extensions`）
3. 打开右上角「开发者模式」。
4. 点「加载已解压的扩展程序」，选择本仓库的 `extension/` 目录。
5. 工具栏会出现 Tabs 图标。

### 使用

- 浏览任意网页时，点工具栏的 Tabs 图标。
- 弹窗自动填入当前页面的标题和 URL，并从服务器拉取你的分类列表。
- 选择分类（不选则放入「未分类」），点「保存」。
- 保存成功后弹窗自动关闭，书签已同步到账号，其他设备刷新即可看到。

### 注意

- 扩展依赖浏览器里已登录的 Tabs 站点会话（cookie），未登录会提示「保存失败，请先登录」。
- 若部署地址不是默认的 `https://tabs.dbthree.dpdns.org`，需修改 `extension/popup.js` 顶部的 `BASE` 常量后重新加载扩展。
- 扩展源码无构建步骤，直接加载目录即可。

## 备份（WebDAV / 坚果云）

登录后点头像 →「WebDAV 备份」，填入 WebDAV 地址、用户名、应用密码（坚果云在「用户中心 → 安全 → 添加应用密码」生成）。

- **备份**：把当前账号全部分类+书签导出为 JSON，PUT 到 WebDAV 地址；父目录不存在时自动 MKCOL 创建。
- **恢复**：从 WebDAV 拉取 JSON（当前版本仅预览数量，合并导入后续迭代）。
- 密码用 AES-256-GCM 加密后存入 `user_settings` 表（密钥来自 `BETTER_AUTH_SECRET`），不明文回传。

## 工程化

- Issue / Spec / Tickets 均托管在 GitHub Issues，见 `AGENTS.md` 与 `docs/agents/`。
- Triage 标签：`needs-triage` / `needs-info` / `ready-for-agent` / `ready-for-human` / `wontfix`。
