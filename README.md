# Tabs — 跨设备书签导航应用

一个自己掌控的网页版书签导航站：左侧分类导航，中间卡片式快捷访问，登录后数据跨设备同步。

## 技术栈

- **前端**：Vue 3 + TypeScript + Vite
- **状态管理**：Pinia
- **样式 / UI**：Tailwind CSS + ShadCN Vue（nova 风格，zinc 基础色，CSS variables）+ lucide-vue-next
- **拖拽**：vue-draggable-plus
- **测试**：Vitest（jsdom + @vue/test-utils）
- **后端**：Neon Postgres + Better Auth + Vercel Serverless Function（规划中）
- **部署**：Vercel / Netlify（均已配置 SPA 重写）

> 说明：ShadCN Vue v2 已将原 "New York" 风格更名为 `nova`，基础色按新枚举取与 Slate 最接近的 `zinc`，均通过 `components.json` 可随时调整。

## 快速开始

```bash
npm install
npm run dev       # 本地开发，默认 http://localhost:5173
npm test          # 单元测试（Vitest）
npm run build     # 生产构建
npm run preview   # 预览生产构建
```

## 目录结构

```
src/
├── components/ui/     # ShadCN Vue 组件（button / card / dialog / input）
├── lib/utils.ts       # cn() 工具
├── __tests__/         # 单元测试
├── App.vue            # 应用壳
├── main.ts
└── style.css          # Tailwind v4 入口 + 主题 CSS 变量
```

## 开发约定

- UI 图标统一使用 `lucide-vue-next` 按需导入，不使用 `import * as icons`。
- 组件内部 `<style>` 若用到 `@apply`，需加 `@reference` 指向 `src/style.css`。
- 唯一核心 seam 为书签仓库（bookmark repository），后续迭代所有数据读写经它中转。

## 工程化

- Issue / Spec / Tickets 均托管在 GitHub Issues，见 `AGENTS.md` 与 `docs/agents/`。
- Triage 标签：`needs-triage` / `needs-info` / `ready-for-agent` / `ready-for-human` / `wontfix`。
