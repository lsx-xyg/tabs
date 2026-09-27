import { computed, ref } from 'vue'
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

export const useBookmarkStore = defineStore('bookmarks', () => {
  const categories = ref<Category[]>([])
  const bookmarks = ref<Bookmark[]>([])
  const activeCategoryId = ref<string | null>(null)
  const loading = ref(false)
  const searchQuery = ref('')

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

  async function loadAll() {
    loading.value = true
    try {
      const [cats, bms] = await Promise.all([
        api<Category[]>('/api/categories'),
        api<Bookmark[]>('/api/bookmarks'),
      ])
      categories.value = cats
      bookmarks.value = bms
      if (!activeCategoryId.value) {
        const def = cats.find((c) => c.isDefault) ?? cats[0]
        activeCategoryId.value = def?.id ?? null
      }
    } finally {
      loading.value = false
    }
  }

  async function addCategory(name: string) {
    const c = await api<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
    categories.value.push(c)
    if (!activeCategoryId.value) activeCategoryId.value = c.id
  }

  async function deleteCategory(id: string) {
    await api(`/api/categories/${id}`, { method: 'DELETE' })
    categories.value = categories.value.filter((c) => c.id !== id)
    bookmarks.value = bookmarks.value.filter((b) => b.categoryId !== id)
    if (activeCategoryId.value === id) {
      activeCategoryId.value = categories.value[0]?.id ?? null
    }
  }

  async function addBookmark(input: { name: string; url: string; categoryId: string | null }) {
    const bm = await api<Bookmark>('/api/bookmarks', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    bookmarks.value.push(bm)
  }

  async function updateBookmark(id: string, patch: Partial<Bookmark>) {
    const updated = await api<Bookmark>(`/api/bookmarks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    const i = bookmarks.value.findIndex((b) => b.id === id)
    if (i >= 0) bookmarks.value[i] = updated
  }

  async function deleteBookmark(id: string) {
    await api(`/api/bookmarks/${id}`, { method: 'DELETE' })
    bookmarks.value = bookmarks.value.filter((b) => b.id !== id)
  }

  async function reorderBookmarks(ids: string[]) {
    await api('/api/bookmarks/reorder', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    })
    // 本地乐观更新顺序
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
    visibleBookmarks,
    loadAll,
    addCategory,
    deleteCategory,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    reorderBookmarks,
    selectCategory,
  }
})
