import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

export interface Category {
  id: string
  userId: string
  name: string
  parentId: string | null
  sortOrder: number
  isDefault: boolean
  createdAt: string
}

export interface Bookmark {
  id: string
  userId: string
  categoryId: string | null
  name: string
  url: string
  iconUrl: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

interface QueuedOp {
  method: string
  path: string
  body: unknown
  localId: string
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  })
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)
  return data as T
}

const LS_CATS = 'tabs-local-categories'
const LS_BMS = 'tabs-local-bookmarks'
const LS_QUEUE = 'tabs-sync-queue'

function loadLS<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') } catch { return [] }
}
function saveLS(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data))
}
function uuid() { return crypto.randomUUID() }

export const useBookmarkStore = defineStore('bookmarks', () => {
  const categories = ref<Category[]>([])
  const bookmarks = ref<Bookmark[]>([])
  const activeCategoryId = ref<string | null>(null)
  const loading = ref(false)
  const searchQuery = ref('')
  const localMode = ref(false)
  const offline = ref(!navigator.onLine)
  const queue = ref<QueuedOp[]>(loadLS<QueuedOp>(LS_QUEUE))

  const activeCategory = computed(() =>
    categories.value.find((c) => c.id === activeCategoryId.value) ?? null,
  )

  const visibleBookmarks = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    if (q) {
      return bookmarks.value
        .filter((b) => b.name.toLowerCase().includes(q) || b.url.toLowerCase().includes(q))
        .sort((a, b) => a.sortOrder - b.sortOrder)
    }
    if (activeCategoryId.value) {
      return bookmarks.value.filter((b) => b.categoryId === activeCategoryId.value)
    }
    // 默认分类：只显示未分类的书签
    return bookmarks.value.filter((b) => b.categoryId == null)
  })

  const queueCount = computed(() => queue.value.length)

  // persist to localStorage always (as offline cache)
  watch([categories, bookmarks], () => {
    saveLS(LS_CATS, categories.value)
    saveLS(LS_BMS, bookmarks.value)
  }, { deep: true })

  // persist queue
  watch(queue, (q) => saveLS(LS_QUEUE, q), { deep: true })

  // online/offline listeners
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      offline.value = false
      void flushQueue()
    })
    window.addEventListener('offline', () => {
      offline.value = true
    })
  }

  function enqueue(op: Omit<QueuedOp, 'localId'>) {
    queue.value.push({ ...op, localId: uuid() })
  }

  async function flushQueue(reload = true) {
    if (!queue.value.length || localMode.value) return
    const pending = [...queue.value]
    queue.value = []
    const failed: QueuedOp[] = []
    for (const op of pending) {
      try {
        await api(op.path, { method: op.method, body: JSON.stringify(op.body) })
      } catch {
        failed.push(op)
      }
    }
    if (failed.length) queue.value = [...failed, ...queue.value]
    if (pending.length && reload) await loadAll()
  }

  async function loadAll() {
    loading.value = true
    try {
      if (localMode.value) {
        categories.value = loadLS<Category>(LS_CATS)
        bookmarks.value = loadLS<Bookmark>(LS_BMS)
      } else {
        // flush pending queue first, then load fresh data
        if (queue.value.length) await flushQueue(false)
        try {
          const [cats, bms] = await Promise.all([
            api<Category[]>('/api/categories'),
            api<Bookmark[]>('/api/bookmarks'),
          ])
          categories.value = cats
          bookmarks.value = bms
        } catch {
          // API failed — fall back to localStorage cache so user doesn't lose data
          categories.value = loadLS<Category>(LS_CATS)
          bookmarks.value = loadLS<Bookmark>(LS_BMS)
        }
      }
      if (!activeCategoryId.value) {
        activeCategoryId.value = null
      }
    } catch (e) {
      console.error('[loadAll] failed:', e)
    } finally {
      loading.value = false
    }
  }

  function enterLocalMode() {
    localMode.value = true
    void loadAll()
  }

  function exitLocalMode() {
    localMode.value = false
    void loadAll()
  }

  async function addCategory(name: string, parentId: string | null = null) {
    const now = new Date().toISOString()
    const c: Category = {
      id: uuid(), userId: 'local', name, parentId,
      sortOrder: categories.value.length,
      isDefault: categories.value.length === 0,
      createdAt: now,
    }
    // optimistic add
    categories.value.push(c)
    if (!activeCategoryId.value) activeCategoryId.value = c.id

    if (localMode.value) return 'local' as const
    try {
      await api('/api/categories', { method: 'POST', body: JSON.stringify({ name, parentId }) })
      return 'online' as const
    } catch {
      offline.value = true
      enqueue({ method: 'POST', path: '/api/categories', body: { name, parentId } })
      return 'queued' as const
    }
  }

  async function deleteCategory(id: string) {
    categories.value = categories.value.filter((c) => c.id !== id)
    bookmarks.value = bookmarks.value.filter((b) => b.categoryId !== id)
    if (activeCategoryId.value === id) activeCategoryId.value = categories.value[0]?.id ?? null
    if (localMode.value) return
    try {
      await api(`/api/categories/${id}`, { method: 'DELETE' })
    } catch {
      enqueue({ method: 'DELETE', path: `/api/categories/${id}`, body: null })
    }
  }

  async function addBookmark(input: { name: string; url: string; categoryId: string | null }) {
    const now = new Date().toISOString()
    let url = input.url.trim()
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`
    const bm: Bookmark = {
      id: uuid(), userId: 'local', categoryId: input.categoryId,
      name: input.name, url, iconUrl: null,
      sortOrder: bookmarks.value.filter((b) => b.categoryId === input.categoryId).length,
      createdAt: now, updatedAt: now,
    }
    // optimistic add
    bookmarks.value.push(bm)

    if (localMode.value) return 'local' as const
    try {
      await api('/api/bookmarks', { method: 'POST', body: JSON.stringify({ name: input.name, url, categoryId: input.categoryId }) })
      return 'online' as const
    } catch {
      offline.value = true
      enqueue({ method: 'POST', path: '/api/bookmarks', body: { name: input.name, url, categoryId: input.categoryId } })
      return 'queued' as const
    }
  }

  async function updateBookmark(id: string, patch: Partial<Bookmark>): Promise<'local' | 'online' | 'queued'> {
    // optimistic update
    const i = bookmarks.value.findIndex((b) => b.id === id)
    if (i >= 0) bookmarks.value[i] = { ...bookmarks.value[i], ...patch, updatedAt: new Date().toISOString() }
    if (localMode.value) return 'local'
    try {
      await api(`/api/bookmarks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
      return 'online'
    } catch {
      offline.value = true
      enqueue({ method: 'PATCH', path: `/api/bookmarks/${id}`, body: patch })
      return 'queued'
    }
  }

  async function deleteBookmark(id: string): Promise<'local' | 'online' | 'queued'> {
    bookmarks.value = bookmarks.value.filter((b) => b.id !== id)
    if (localMode.value) return 'local'
    try {
      await api(`/api/bookmarks/${id}`, { method: 'DELETE' })
      return 'online'
    } catch {
      offline.value = true
      enqueue({ method: 'DELETE', path: `/api/bookmarks/${id}`, body: null })
      return 'queued'
    }
  }

  async function reorderBookmarks(ids: string[]): Promise<'local' | 'online' | 'queued'> {
    const sorted = [...ids]
      .map((id) => bookmarks.value.find((b) => b.id === id))
      .filter(Boolean) as Bookmark[]
    const rest = bookmarks.value.filter((b) => !ids.includes(b.id))
    bookmarks.value = [...sorted, ...rest]
    if (localMode.value) return 'local'
    try {
      await api('/api/bookmarks/reorder', { method: 'POST', body: JSON.stringify({ ids }) })
      return 'online'
    } catch {
      offline.value = true
      enqueue({ method: 'POST', path: '/api/bookmarks/reorder', body: { ids } })
      return 'queued'
    }
  }

  function selectCategory(id: string | null) {
    activeCategoryId.value = id
    searchQuery.value = ''
  }

  return {
    categories, bookmarks, activeCategoryId, activeCategory,
    loading, searchQuery, localMode, offline, queueCount,
    visibleBookmarks,
    loadAll, enterLocalMode, exitLocalMode,
    addCategory, deleteCategory, addBookmark, updateBookmark,
    deleteBookmark, reorderBookmarks, selectCategory,
  }
})
