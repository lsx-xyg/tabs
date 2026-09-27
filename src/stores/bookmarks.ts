import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

export interface Category {
  id: string
  userId: string
  name: string
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

function loadLS<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]')
  } catch {
    return []
  }
}
function saveLS(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data))
}
function uuid() {
  return crypto.randomUUID()
}

export const useBookmarkStore = defineStore('bookmarks', () => {
  const categories = ref<Category[]>([])
  const bookmarks = ref<Bookmark[]>([])
  const activeCategoryId = ref<string | null>(null)
  const loading = ref(false)
  const searchQuery = ref('')
  const localMode = ref(false)

  const activeCategory = computed(() =>
    categories.value.find((c) => c.id === activeCategoryId.value) ?? null,
  )

  const visibleBookmarks = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()
    let list = bookmarks.value
    if (activeCategoryId.value) list = list.filter((b) => b.categoryId === activeCategoryId.value)
    if (q) {
      list = bookmarks.value.filter(
        (b) =>
          b.name.toLowerCase().includes(q) || b.url.toLowerCase().includes(q),
      )
    }
    return [...list].sort((a, b) => a.sortOrder - b.sortOrder)
  })

  // persist local mode
  watch([categories, bookmarks], () => {
    if (localMode.value) {
      saveLS(LS_CATS, categories.value)
      saveLS(LS_BMS, bookmarks.value)
    }
  }, { deep: true })

  async function loadAll() {
    loading.value = true
    try {
      if (localMode.value) {
        categories.value = loadLS<Category>(LS_CATS)
        bookmarks.value = loadLS<Bookmark>(LS_BMS)
      } else {
        const [cats, bms] = await Promise.all([
          api<Category[]>('/api/categories'),
          api<Bookmark[]>('/api/bookmarks'),
        ])
        categories.value = cats
        bookmarks.value = bms
      }
      if (!activeCategoryId.value) {
        const def = categories.value.find((c) => c.isDefault) ?? categories.value[0]
        activeCategoryId.value = def?.id ?? null
      }
    } finally {
      loading.value = false
    }
  }

  function enterLocalMode() {
    localMode.value = true
    void loadAll()
  }

  async function addCategory(name: string) {
    const now = new Date().toISOString()
    const c: Category = {
      id: uuid(),
      userId: 'local',
      name,
      sortOrder: categories.value.length,
      isDefault: categories.value.length === 0,
      createdAt: now,
    }
    if (!localMode.value) {
      return api<Category>('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }).then((created) => {
        categories.value.push(created)
        if (!activeCategoryId.value) activeCategoryId.value = created.id
      })
    }
    categories.value.push(c)
    if (!activeCategoryId.value) activeCategoryId.value = c.id
  }

  async function deleteCategory(id: string) {
    if (!localMode.value) await api(`/api/categories/${id}`, { method: 'DELETE' })
    categories.value = categories.value.filter((c) => c.id !== id)
    bookmarks.value = bookmarks.value.filter((b) => b.categoryId !== id)
    if (activeCategoryId.value === id) {
      activeCategoryId.value = categories.value[0]?.id ?? null
    }
  }

  async function addBookmark(input: { name: string; url: string; categoryId: string | null }) {
    if (!localMode.value) {
      return api<Bookmark>('/api/bookmarks', {
        method: 'POST',
        body: JSON.stringify(input),
      }).then((bm) => bookmarks.value.push(bm))
    }
    const now = new Date().toISOString()
    let url = input.url.trim()
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`
    const bm: Bookmark = {
      id: uuid(),
      userId: 'local',
      categoryId: input.categoryId,
      name: input.name,
      url,
      iconUrl: null,
      sortOrder: bookmarks.value.filter((b) => b.categoryId === input.categoryId).length,
      createdAt: now,
      updatedAt: now,
    }
    bookmarks.value.push(bm)
  }

  async function updateBookmark(id: string, patch: Partial<Bookmark>) {
    if (!localMode.value) {
      return api<Bookmark>(`/api/bookmarks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }).then((updated) => {
        const i = bookmarks.value.findIndex((b) => b.id === id)
        if (i >= 0) bookmarks.value[i] = updated
      })
    }
    const i = bookmarks.value.findIndex((b) => b.id === id)
    if (i >= 0) bookmarks.value[i] = { ...bookmarks.value[i], ...patch, updatedAt: new Date().toISOString() }
  }

  async function deleteBookmark(id: string) {
    if (!localMode.value) await api(`/api/bookmarks/${id}`, { method: 'DELETE' })
    bookmarks.value = bookmarks.value.filter((b) => b.id !== id)
  }

  async function reorderBookmarks(ids: string[]) {
    if (!localMode.value) {
      await api('/api/bookmarks/reorder', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      })
    }
    const sorted = [...ids]
      .map((id) => bookmarks.value.find((b) => b.id === id))
      .filter(Boolean) as Bookmark[]
    const rest = bookmarks.value.filter((b) => !ids.includes(b.id))
    bookmarks.value = [...sorted, ...rest]
  }

  function selectCategory(id: string | null) {
    activeCategoryId.value = id
    searchQuery.value = ''
  }

  return {
    categories,
    bookmarks,
    activeCategoryId,
    activeCategory,
    loading,
    searchQuery,
    localMode,
    visibleBookmarks,
    loadAll,
    enterLocalMode,
    addCategory,
    deleteCategory,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    reorderBookmarks,
    selectCategory,
  }
})
