import { test, expect } from '@playwright/test'

test('页面加载并显示导航', async ({ page }) => {
  await page.goto('/')
  // header 存在
  await expect(page.locator('header')).toBeVisible()
  // 标题
  await expect(page.locator('h1')).toContainText('Tabs')
  // 侧边栏分类
  await expect(page.locator('nav')).toBeVisible()
  // 搜索图标或输入框
  await expect(page.locator('header')).toContainText(/Tabs/)
})

test('未登录可以本地添加书签', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(500)
  // 点添加书签按钮（+）
  await page.locator('button[title="添加书签"], button:has-text("添加")').first().click()
  // 填表单
  await page.locator('input[placeholder*="名称"]').fill('测试站点')
  await page.locator('input[placeholder*="URL"]').fill('example.com')
  await page.locator('button:has-text("保存")').click()
  // 卡片出现
  await expect(page.locator('text=测试站点')).toBeVisible()
})

test('主题切换按钮存在', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('button[title*="浅色"], button[title*="深色"]')).toBeVisible()
})
