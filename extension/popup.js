const BASE = 'https://tabs.dbthree.dpdns.org'

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  document.getElementById('title').value = tab.title || ''
  document.getElementById('url').value = tab.url || ''

  // load categories
  try {
    const r = await fetch(`${BASE}/api/categories`, { credentials: 'include' })
    if (r.ok) {
      const cats = await r.json()
      const sel = document.getElementById('category')
      for (const c of cats) {
        const opt = document.createElement('option')
        opt.value = c.id
        opt.textContent = c.name
        sel.appendChild(opt)
      }
    }
  } catch {}
}

document.getElementById('save').onclick = async () => {
  const title = document.getElementById('title').value.trim()
  const url = document.getElementById('url').value.trim()
  const categoryId = document.getElementById('category').value
  if (!title || !url) return
  try {
    const r = await fetch(`${BASE}/api/bookmarks`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: title, url, categoryId: categoryId || null }),
    })
    if (r.ok) {
      document.getElementById('status').textContent = '✓ 已保存'
      setTimeout(() => window.close(), 800)
    } else {
      document.getElementById('status').textContent = '保存失败，请先登录'
    }
  } catch {
    document.getElementById('status').textContent = '网络错误'
  }
}

init()
