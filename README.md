<div align="center">

<img src="docs/logo.png" alt="Tabs" width="120" />

# Tabs

**一个自托管、可自定义的网页版书签导航应用，登录后数据跨设备同步**

![Vue](https://img.shields.io/badge/Vue-3-42b883?logo=vuedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)
![Deploy](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-Web-4fc08d)
![License](https://img.shields.io/badge/License-MIT-yellow)

[在线体验](https://tabs.dbthree.dpdns.org/) · [反馈](https://github.com/lsx-xyg/tabs/issues)

</div>

## 目录

- [💡 这是什么](#💡-这是什么)
- [✨ 功能](#✨-功能)
- [🚀 安装](#🚀-安装)
- [📖 使用](#📖-使用)
- [⚙️ 配置](#⚙️-配置)
- [🛠️ 开发](#🛠️-开发)
- [📁 项目结构](#📁-项目结构)
- [🧩 扩展](#🧩-扩展)
- [🤝 贡献](#🤝-贡献)
- [📄 License](#📄-license)

## 💡 这是什么

Tabs 是一个自己掌控数据的书签导航站，用来替代浏览器本地书签：

- **解决什么**：书签无法跨设备同步，且缺少统一、可自定义的快速访问入口。
- **适合谁**：有多台设备、希望数据掌握在自己手里的个人用户。
- **和同类工具的区别**：自托管 + 数据全量可导出备份，认证、数据库、备份均可自己掌控。

## ✨ 功能

| 功能 | 说明 |
| --- | --- |
| 🗂️ 分类导航 | 左侧分类 + 卡片式快捷访问，点击卡片在新标签页打开 |
| 🔁 跨设备同步 | Better Auth + Neon Postgres，多设备登录同一账号数据一致 |
| 📶 离线可用 | 本地缓存 + 离线队列，网络恢复后自动重放同步 |
| 🔍 全局搜索 | 跨所有分类匹配书签名称与 URL |
| 🖱️ 拖拽管理 | 分类内拖拽排序，拖到其他分类完成移动 |
| 📥 导入导出 | JSON 导入导出，按 URL 自动去重 |
| 🧩 浏览器扩展 | Manifest V3 一键收藏当前页，支持扩展内直接登录 |
| 🌙 主题切换 | 深色 / 浅色，跟随系统主题，圆形扩散过渡动画 |
| 📱 响应式 + PWA | 桌面 / 平板 / 手机自适应，可安装到设备 |
| ☁️ WebDAV 备份 | 兼容坚果云，密码 AES-256-GCM 加密存储 |
| 🩺 链接检测 | 书签链接失效检测与结果提示 |

<!-- 替换为实际主界面截图：docs/screenshot-main.png -->

## 🚀 安装

### 下载即用

无需安装，直接访问 [在线站点](https://tabs.dbthree.dpdns.org/)，注册登录即可使用。

浏览器扩展（可选，一键收藏当前页）：

1. 打开扩展管理页（Chrome / Edge 地址栏输入 `chrome://extensions`）。
2. 开启右上角「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择本仓库的 `extension/` 目录。

### 从源码安装

```bash
git clone https://github.com/lsx-xyg/tabs.git
cd tabs
npm install
cp .env.example .env.local   # 填写数据库连接串与认证配置
```

启动本地开发环境（两个终端）：

```bash
npm run dev:api   # 本地 API 服务（Better Auth，端口 8787）
npm run dev       # 前端开发服务器（Vite 自动代理 /api）
```

> [!TIP]
> 不想配置本地数据库时，可直接在 Vercel 部署后使用在线环境。

## 📖 使用

### 网站

1. 注册并登录（邮箱 + 密码）。
2. 左侧栏新建分类；点击分类切换查看。
3. 点击「添加书签」，填写名称、URL（省略协议时自动补全 `https://`）、选择分类；图标自动抓取。
4. 点击卡片在新标签页打开网站。
5. 拖拽卡片调整分类内顺序，或拖到其他分类上完成移动。
6. 顶部搜索框跨所有分类匹配书签名称与 URL。
7. 头像菜单中可导入 / 导出 JSON、切换主题、进行 WebDAV 备份、退出登录或删除账号。

### 浏览器扩展

1. 打开扩展弹窗：已存 token 或站点登录态有效则直接进入收藏界面，否则显示登录表单。
2. 弹窗自动填入当前页面的标题与 URL，选择分类（不选则放入默认分类）。
3. 点击「保存」，书签同步到账号。

## ⚙️ 配置

复制 `.env.example` 为 `.env.local` 并填写（本地开发）。生产环境在 Vercel 上配置同名变量，Neon 集成会自动注入前两个：

| 变量 | 用途 |
| --- | --- |
| `DATABASE_URL` | Neon 池化连接串，运行时查询使用 |
| `DATABASE_URL_UNPOOLED` | Neon 直连接串，数据库迁移（DDL）使用 |
| `BETTER_AUTH_SECRET` | 会话签名密钥（`openssl rand -base64 32` 生成） |
| `BETTER_AUTH_URL` | 部署后站点地址（生产必填） |

前端不直接持有数据库连接串：所有数据读写经 Serverless Function 中转，由 `src/server/env.ts` 统一按全大写读取（小写写入自动兜底）。

<details>
<summary>WebDAV 备份配置（坚果云）</summary>

登录后点击头像 →「WebDAV 备份」，填入 WebDAV 地址、用户名、应用密码（坚果云在「用户中心 → 安全 → 添加应用密码」生成）。

- 备份：把当前账号全部分类 + 书签导出为 JSON，PUT 到 WebDAV 地址；父目录不存在时自动 MKCOL 创建。
- 恢复：从 WebDAV 拉取 JSON 并预览数量（合并导入在后续迭代）。
- 密码用 AES-256-GCM 加密后存入 `user_settings` 表（密钥来自 `BETTER_AUTH_SECRET`），接口不明文回传。

</details>

## 🛠️ 开发

前置要求：Node.js、可选的 Neon Postgres 数据库（不配置时构建自动跳过迁移）。

```bash
npm test              # 单元测试（Vitest，mock API 客户端）
npm run test:e2e      # E2E 冒烟测试（Playwright）
npm run build         # 生产构建（构建期自动执行数据库迁移）
npm run db:generate   # 依据 schema 生成迁移 SQL（./drizzle）
npm run db:migrate    # 应用迁移（使用 DATABASE_URL_UNPOOLED）
```

测试只断言书签仓库的**外部行为**（最终状态、顺序、搜索结果），不断言内部实现细节。

## 📁 项目结构

```text
.
├── api/                      # Vercel Serverless Function
│   ├── auth/                 # Better Auth 路由（catch-all）
│   ├── bookmarks.ts          # 书签 API
│   ├── categories.ts         # 分类 API
│   ├── extension-token.ts    # 扩展长期 token
│   ├── favicon.ts            # favicon 抓取代理
│   ├── health.ts             # 健康检查
│   ├── settings.ts           # 用户设置（WebDAV 配置）
│   └── webdav.ts             # WebDAV 备份 / 恢复代理
├── extension/                # Chrome 扩展（Manifest V3，无需构建）
├── server/                   # 本地 API 服务（npm run dev:api）
├── scripts/
│   └── migrate-on-build.mjs  # 构建期自动补表 + 迁移
├── src/
│   ├── components/ui/        # ShadCN Vue 组件
│   ├── lib/                  # 前端工具（auth-client 等）
│   ├── server/               # 服务端：env、db、schema、auth、request、encrypt
│   ├── stores/               # Pinia 状态（书签仓库）
│   ├── __tests__/            # 单元测试
│   ├── App.vue               # 应用壳
│   ├── main.ts
│   └── style.css             # Tailwind 入口 + 主题变量
├── e2e/                      # Playwright 冒烟测试
├── drizzle/                  # Drizzle 迁移 SQL
├── public/                   # 静态资源（PWA 图标、favicon）
├── .env.example
├── components.json
├── netlify.toml
├── vercel.json
└── package.json
```

## 🧩 扩展

- **新增 API 端点**：在 `api/` 下新建 `.ts` 文件，导出默认 `handler(req, res)`；鉴权统一使用 `src/server/request.ts` 的 `getRequestUser`。
- **新增 UI 组件**：在 `src/components/ui/` 下按 ShadCN Vue 约定添加，样式用 Tailwind 工具类。
- **数据库变更**：修改 `src/server/db/schema.ts` 后运行 `npm run db:generate`，部署时由 `scripts/migrate-on-build.mjs` 自动应用。
- **数据层 seam**：所有数据读写经 `src/stores/bookmarks.ts`（书签仓库）中转，单元测试以仓库外部行为为准。
- **浏览器扩展**：无构建步骤，直接编辑 `extension/` 下文件后到 `chrome://extensions` 刷新加载；部署地址变更时修改 `popup.js` 顶部的 `BASE` 常量。

## 🤝 贡献

欢迎通过 [GitHub Issues](https://github.com/lsx-xyg/tabs/issues) 提交缺陷与需求，通过 Pull Request 贡献代码。
提交前请确保通过 `npm test` 与 `npm run build`。

<details>
<summary>常见问题</summary>

**离线修改后数据会丢吗？**

不会。写操作先进入本地队列并持久化到 `localStorage`，恢复网络后按队列顺序重放，冲突按最后写入时间（`updated_at`）合并。

**扩展提示「保存失败，请先登录」怎么办？**

扩展优先使用已存 token，其次尝试站点登录态 cookie，两者都没有时在弹窗内直接输入邮箱密码登录即可。

**WebDAV 密码存在哪里？**

加密后存入数据库 `user_settings` 表（AES-256-GCM，密钥来自 `BETTER_AUTH_SECRET`），接口不明文回传。

</details>

## 📄 License

本项目采用 [MIT License](./LICENSE)。
