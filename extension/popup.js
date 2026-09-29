const BASE = 'https://tabs.dbthree.dpdns.org'

let token = null

async function init() {
  // 1. Try existing token from storage
  const stored = await chrome.storage.local.get('tabs_token')
  token = stored.tabs_token || null

  if (token) {
    const ok = await tryLoadCategories()
    if (ok) return showSaveView()
    token = null
    await chrome.storage.local.remove('tabs_token')
  }

  // 2. Try cookie (user already logged in on website)
  try {
    const r = await fetch(`${BASE}/api/extension-token`, {
      method: 'POST',
      credentials: 'include',
    })
    if (r.ok) {
      const d = await r.json()
      token = d.token
      await chrome.storage.local.set({ tabs_token: token })
      return showSaveView()
    }
  } catch {}

  // 3. Need login
  showLoginView()
}

function showSaveView() {
  document.getElementById('loginView').classList.add('hidden')
  document.getElementById('saveView').classList.remove('hidden')
  loadCurrentTab()
  loadCategories()
}

function showLoginView() {
  document.getElementById('loginView').classList.remove('hidden')
  document.getElementById('saveView').classList.add('hidden')
}

async function authFetch(path, opts = {}) {
  const headers = { ...(opts.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  return fetch(`${BASE}${path}`, { ...opts, headers })
}

async function tryLoadCategories() {
  try {
    const r = await authFetch('/api/categories')
    if (r.ok) return true
  } catch {}
  return false
}

async function loadCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  document.getElementById('title').value = tab.title || ''
  document.getElementById('url').value = tab.url || ''
}

async function loadCategories() {
  try {
    const r = await authFetch('/api/categories')
    if (r.ok) {
      const cats = await r.json()
      const sel = document.getElementById('category')
      sel.innerHTML = '<option value="">默认分类</option>'
      for (const c of cats) {
        const opt = document.createElement('option')
        opt.value = c.id
        opt.textContent = c.name
        sel.appendChild(opt)
      }
    }
  } catch {}
}

document.getElementById('login').onclick = async () => {
  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value
  if (!email || !password) return
  const status = document.getElementById('loginStatus')
  status.textContent = '登录中…'
  try {
    const r = await fetch(`${BASE}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!r.ok) {
      status.textContent = '登录失败，请检查邮箱密码'
      return
    }
    const t = await fetch(`${BASE}/api/extension-token`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!t.ok) {
      status.textContent = '登录成功但获取 token 失败'
      return
    }
    const d = await t.json()
    token = d.token
    await chrome.storage.local.set({ tabs_token: token })
    showSaveView()
  } catch {
    status.textContent = '网络错误'
  }
}

document.getElementById('save').onclick = async () => {
  const title = document.getElementById('title').value.trim()
  const url = document.getElementById('url').value.trim()
  const categoryId = document.getElementById('category').value
  if (!title || !url) return
  const status = document.getElementById('status')
  try {
    const r = await authFetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: title, url, categoryId: categoryId || null }),
    })
    if (r.ok) {
      status.textContent = '✓ 已保存'
      setTimeout(() => window.close(), 800)
    } else {
      status.textContent = '保存失败'
    }
  } catch {
    status.textContent = '网络错误'
  }
}

init()
