<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useDark, useToggle } from '@vueuse/core'
import { VueDraggable } from 'vue-draggable-plus'
import { Search, Sun, Moon, Menu, Plus, Pencil, Trash2, GripVertical, LogOut, Trash, Upload, Download, X } from 'lucide-vue-next'

import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth-client'
import { useBookmarkStore, type Bookmark, type Category } from '@/stores/bookmarks'

const sessionState = authClient.useSession()
const store = useBookmarkStore()

const isSignedIn = computed(() => !!sessionState.value?.data)
const userEmail = computed(() => sessionState.value?.data?.user?.email ?? '')

// theme
const isDark = useDark({ storageKey: 'tabs-theme' })
const toggleTheme = useToggle(isDark)

// mobile sidebar
const sidebarOpen = ref(false)
const searchExpanded = ref(false)
const userMenuOpen = ref(false)
const pcMenuOpen = ref(false)

const mode = ref<'login' | 'signup'>('login')
const authDialogOpen = ref(false)
const email = ref('')
const password = ref('')
const name = ref('')
const submitting = ref(false)
const authMessage = ref('')

const bmDialogOpen = ref(false)
const editingBm = ref<Bookmark | null>(null)
const bmName = ref('')
const bmUrl = ref('')
const bmCategoryId = ref<string>('')
const bmSaving = ref(false)
const bmError = ref('')

const catOpen = ref(false)
const catName = ref('')
const catSaving = ref(false)

const confirmState = ref<{
  open: boolean
  title: string
  description: string
  confirmText: string
  destructive: boolean
  onConfirm: (() => void) | null
}>({
  open: false,
  title: '',
  description: '',
  confirmText: '删除',
  destructive: true,
  onConfirm: null,
})

function askConfirm(opts: {
  title: string
  description: string
  confirmText?: string
  onConfirm: () => void
}) {
  confirmState.value = {
    open: true,
    title: opts.title,
    description: opts.description,
    confirmText: opts.confirmText ?? '删除',
    destructive: true,
    onConfirm: opts.onConfirm,
  }
}

onMounted(() => {
  if (isSignedIn.value) void store.loadAll()
  else store.enterLocalMode()
})
watch(isSignedIn, (v) => {
  if (v) store.exitLocalMode()
  else store.enterLocalMode()
})

function faviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname
    return `https://cn.cravatar.com/favicon/api/index.php?url=${domain}`
  } catch {
    return ''
  }
}

function switchMode(next: 'login' | 'signup') {
  mode.value = next
  authMessage.value = ''
}

async function handleAuthSubmit() {
  authMessage.value = ''
  if (!email.value || !password.value) {
    authMessage.value = '请填写邮箱与密码'
    return
  }
  submitting.value = true
  try {
    const result =
      mode.value === 'signup'
        ? await authClient.signUp.email({
            email: email.value,
            password: password.value,
            name: name.value || email.value.split('@')[0],
          })
        : await authClient.signIn.email({
            email: email.value,
            password: password.value,
          })
    if (result.error) {
      authMessage.value = result.error.message ?? '操作失败'
      return
    }
    email.value = ''
    password.value = ''
    name.value = ''
    authDialogOpen.value = false
  } finally {
    submitting.value = false
  }
}

async function handleSignOut() {
  await authClient.signOut()
  void sessionState.value.refetch()
}

function handleDeleteAccount() {
  askConfirm({
    title: '删除账号',
    description: '将永久删除你的账号和所有书签数据，此操作不可撤销。确定继续？',
    confirmText: '永久删除',
    onConfirm: async () => {
      await authClient.deleteUser()
      void sessionState.value.refetch()
    },
  })
}

function openAddBookmark() {
  editingBm.value = null
  bmName.value = ''
  bmUrl.value = ''
  bmCategoryId.value = store.activeCategoryId ?? ''
  bmError.value = ''
  bmDialogOpen.value = true
}

function openEditBookmark(bm: Bookmark) {
  editingBm.value = bm
  bmName.value = bm.name
  bmUrl.value = bm.url
  bmCategoryId.value = bm.categoryId ?? ''
  bmError.value = ''
  bmDialogOpen.value = true
}

async function submitBookmark() {
  bmError.value = ''
  if (!bmName.value.trim() || !bmUrl.value.trim()) {
    bmError.value = '请填写名称和 URL'
    return
  }
  bmSaving.value = true
  try {
    if (editingBm.value) {
      await store.updateBookmark(editingBm.value.id, {
        name: bmName.value.trim(),
        url: bmUrl.value.trim(),
        categoryId: bmCategoryId.value || null,
      })
    } else {
      await store.addBookmark({
        name: bmName.value.trim(),
        url: bmUrl.value.trim(),
        categoryId: bmCategoryId.value || null,
      })
    }
    bmDialogOpen.value = false
  } catch (e: any) {
    bmError.value = e.message ?? '保存失败'
  } finally {
    bmSaving.value = false
  }
}

async function submitCategory() {
  const n = catName.value.trim()
  if (!n) return
  catSaving.value = true
  try {
    await store.addCategory(n)
    catName.value = ''
    catOpen.value = false
  } finally {
    catSaving.value = false
  }
}

function removeBookmark(bm: Bookmark) {
  askConfirm({
    title: '删除书签',
    description: `确定删除「${bm.name}」？此操作不可撤销。`,
    onConfirm: () => void store.deleteBookmark(bm.id),
  })
}

function removeCategory(id: string, label: string) {
  askConfirm({
    title: '删除分类',
    description: `删除「${label}」将同时删除其下所有书签，确定继续？`,
    onConfirm: () => void store.deleteCategory(id),
  })
}

// category rename
const renameOpen = ref(false)
const renameId = ref('')
const renameName = ref('')
async function openRenameCategory(c: Category) {
  renameId.value = c.id
  renameName.value = c.name
  renameOpen.value = true
}
async function submitRename() {
  const n = renameName.value.trim()
  if (!n) return
  await fetch(`/api/categories/${renameId.value}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: n }),
  })
  const c = store.categories.find((x) => x.id === renameId.value)
  if (c) c.name = n
  renameOpen.value = false
}

// export bookmarks as Netscape Bookmark HTML
function exportBookmarks() {
  const cats = store.categories
  const bms = store.bookmarks
  let html = `<!DOCTYPE NETSCAPE-BOOKMARK-FILE-1>\n<NETSCAPE-BOOKMARK-FILE-1>\n<DT><H3>Bookmarks</H3>\n<DL><p>\n`
  const uncategorized = bms.filter((b) => !b.categoryId)
  for (const c of cats) {
    const inCat = bms.filter((b) => b.categoryId === c.id).sort((a, b) => a.sortOrder - b.sortOrder)
    if (!inCat.length) continue
    html += `  <DT><H3>${escapeHtml(c.name)}</H3>\n  <DL><p>\n`
    for (const b of inCat) {
      html += `    <DT><A HREF="${escapeHtml(b.url)}">${escapeHtml(b.name)}</A>\n`
    }
    html += `  </DL><p>\n`
  }
  for (const b of uncategorized) {
    html += `  <DT><A HREF="${escapeHtml(b.url)}">${escapeHtml(b.name)}</A>\n`
  }
  html += `</DL><p>\n</NETSCAPE-BOOKMARK-FILE-1>\n`
  const blob = new Blob([html], { type: 'text/html' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `tabs-bookmarks-${new Date().toISOString().slice(0, 10)}.html`
  a.click()
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// import bookmarks from HTML file
const importInput = ref<HTMLInputElement | null>(null)
async function onImportFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const text = await file.text()
  const doc = new DOMParser().parseFromString(text, 'text/html')
  const links = doc.querySelectorAll('a[href]')
  // existing URLs for dedup — normalize: lowercase, strip trailing slash
  const existing = new Set(
    store.bookmarks.map((b) => normalizeUrl(b.url)),
  )
  let added = 0
  let skipped = 0
  for (const a of Array.from(links)) {
    const url = a.getAttribute('href') ?? ''
    const name = a.textContent?.trim() || url
    if (!url || !/^https?:\/\//i.test(url)) continue
    // dedup by normalized URL
    const norm = normalizeUrl(url)
    if (existing.has(norm)) {
      skipped++
      continue
    }
    existing.add(norm)
    // find parent category — skip the root <H3>Bookmarks</H3>
    let catId: string | null = null
    const parent = a.closest('dl')?.previousElementSibling
    if (parent && parent.tagName === 'H3') {
      const catName = parent.textContent?.trim()
      // root "Bookmarks" heading = uncategorized
      if (catName && catName.toLowerCase() !== 'bookmarks') {
        let cat = store.categories.find((c) => c.name === catName)
        if (!cat) {
          await store.addCategory(catName)
          cat = store.categories[store.categories.length - 1]
        }
        catId = cat.id
      }
    }
    await store.addBookmark({ name, url, categoryId: catId })
    added++
  }
  ;(e.target as HTMLInputElement).value = ''
  console.log(`导入完成：新增 ${added} 条，跳过重复 ${skipped} 条`)
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url)
    u.hash = ''
    return (u.origin + u.pathname).replace(/\/$/, '').toLowerCase()
  } catch {
    return url.toLowerCase()
  }
}

function openLink(url: string) {
  window.open(url, '_blank')
}

function onDragEnd() {
  const ids = dragList.value.map((b) => b.id)
  if (ids.length) void store.reorderBookmarks(ids)
}

function onCardDragStart(e: DragEvent, bm: Bookmark) {
  e.dataTransfer?.setData('text/bookmark-id', bm.id)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

async function onCategoryDrop(e: DragEvent, categoryId: string | null) {
  e.preventDefault()
  ;(e.currentTarget as HTMLElement).classList.remove('drag-over')
  const bmId = e.dataTransfer?.getData('text/bookmark-id')
  if (!bmId) return
  const bm = store.bookmarks.find((b) => b.id === bmId)
  if (!bm || bm.categoryId === categoryId) return
  await store.updateBookmark(bmId, { categoryId } as Partial<Bookmark>)
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  ;(e.currentTarget as HTMLElement).classList.add('drag-over')
}
function onDragLeave(e: DragEvent) {
  ;(e.currentTarget as HTMLElement).classList.remove('drag-over')
}

// draggable needs a writable v-model; sync with visibleBookmarks
const dragList = computed({
  get: () => store.visibleBookmarks,
  set: (val: Bookmark[]) => {
    // local optimistic: reorder store.bookmarks to match val order within current filter
    const ids = val.map((b) => b.id)
    const others = store.bookmarks.filter((b) => !ids.includes(b.id))
    const ordered = ids
      .map((id) => store.bookmarks.find((b) => b.id === id))
      .filter(Boolean) as Bookmark[]
    store.bookmarks = [...ordered, ...others]
  },
})
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="border-b">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 gap-2">
        <div class="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="icon-sm" class="md:hidden" @click="sidebarOpen = true">
            <Menu class="w-4 h-4" />
          </Button>
          <h1 class="text-lg font-semibold tracking-tight">Tabs</h1>
        </div>

        <div class="flex items-center gap-1.5 text-sm">
          <span v-if="store.offline" class="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded hidden sm:inline">
            离线{{ store.queueCount ? `·${store.queueCount}` : '' }}
          </span>

          <!-- search: always visible input on desktop, icon-expand on mobile -->
          <div class="flex items-center">
            <div v-if="searchExpanded" class="flex items-center gap-1 md:hidden">
              <Input v-model="store.searchQuery" placeholder="搜索书签…" class="w-32 sm:w-40" autofocus />
              <Button variant="ghost" size="icon-sm" @click="searchExpanded = false"><X class="w-4 h-4" /></Button>
            </div>
            <Button v-else variant="ghost" size="icon-sm" class="md:hidden" @click="searchExpanded = true">
              <Search class="w-4 h-4" />
            </Button>
            <Input v-model="store.searchQuery" placeholder="搜索…" class="hidden md:block w-48" />
          </div>

          <Button variant="ghost" size="icon-sm" @click="toggleTheme()" :title="isDark ? '切换为浅色' : '切换为深色'">
            <Sun v-if="isDark" class="w-4 h-4" />
            <Moon v-else class="w-4 h-4" />
          </Button>

          <!-- user dropdown: hover on PC, click on mobile -->
          <div
            class="relative"
            @mouseenter="pcMenuOpen = true"
            @mouseleave="pcMenuOpen = false"
          >
            <button
              class="flex items-center gap-1.5 rounded-full hover:bg-accent px-2 py-1"
              @click="userMenuOpen = !userMenuOpen"
            >
              <div class="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                {{ (userEmail || '?')[0]?.toUpperCase() }}
              </div>
            </button>
            <div
              v-if="userMenuOpen || pcMenuOpen"
              class="absolute right-0 top-full mt-1 w-48 rounded-lg border bg-card shadow-lg py-1 z-50"
              @click.outside="userMenuOpen = false"
            >
              <button class="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent" @click="exportBookmarks; userMenuOpen = false">
                <Download class="w-4 h-4" /> 导出书签
              </button>
              <button class="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent" @click="importInput?.click(); userMenuOpen = false">
                <Upload class="w-4 h-4" /> 导入书签
              </button>
              <div class="border-t my-1"></div>
              <template v-if="isSignedIn">
                <button class="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent" @click="handleSignOut; userMenuOpen = false">
                  <LogOut class="w-4 h-4" /> 退出登录
                </button>
                <button class="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent" @click="handleDeleteAccount; userMenuOpen = false">
                  <Trash class="w-4 h-4" /> 删除账号
                </button>
              </template>
              <button v-else class="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent" @click="authDialogOpen = true; userMenuOpen = false">
                登录同步
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div v-if="sessionState.isPending" class="flex items-center justify-center py-24">
      <div class="text-sm text-muted-foreground">加载中…</div>
    </div>

    <main v-else class="mx-auto flex max-w-7xl gap-6 px-4 py-6">
      <!-- mobile drawer overlay -->
      <div v-if="sidebarOpen" class="fixed inset-0 z-40 bg-black/40 md:hidden" @click="sidebarOpen = false"></div>

      <!-- sidebar: desktop static, mobile drawer -->
      <aside
        class="fixed md:static z-50 top-0 left-0 h-full w-64 bg-background border-r p-4 transition-transform md:translate-x-0 md:w-56 md:shrink-0 md:border-0 md:p-0 md:bg-transparent"
        :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
      >
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-medium text-muted-foreground">分类</h3>
          <div class="flex gap-1">
            <Button variant="ghost" size="icon-sm" @click="catOpen = true"><Plus class="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon-sm" class="md:hidden" @click="sidebarOpen = false"><X class="w-4 h-4" /></Button>
          </div>
        </div>
        <nav class="space-y-1">
          <button
            class="w-full rounded-md px-3 py-2 text-left text-sm transition drop-target"
            :class="store.activeCategoryId === null ? 'bg-accent font-medium' : 'hover:bg-accent/50'"
            @click="store.selectCategory(null); sidebarOpen = false"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onCategoryDrop($event, null)"
          >全部</button>
          <div v-for="c in store.categories" :key="c.id" class="group flex items-center gap-1">
            <button
              class="flex-1 rounded-md px-3 py-2 text-left text-sm transition truncate drop-target"
              :class="store.activeCategoryId === c.id ? 'bg-accent font-medium' : 'hover:bg-accent/50'"
              @click="store.selectCategory(c.id); sidebarOpen = false"
              @dragover="onDragOver"
              @dragleave="onDragLeave"
              @drop="onCategoryDrop($event, c.id)"
            >{{ c.name }}</button>
            <button
              class="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-xs text-muted-foreground hover:text-foreground px-1"
              title="重命名"
              @click="openRenameCategory(c)"
            ><Pencil class="w-3 h-3" /></button>
            <button
              class="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-xs text-muted-foreground hover:text-destructive px-1"
              title="删除分类"
              @click="removeCategory(c.id, c.name)"
            ><Trash2 class="w-3 h-3" /></button>
          </div>
        </nav>
      </aside>

      <section class="flex-1">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">
            {{ store.searchQuery ? '搜索结果' : (store.activeCategory?.name ?? '全部书签') }}
            <span class="ml-2 text-sm font-normal text-muted-foreground">{{ store.visibleBookmarks.length }} 个</span>
          </h2>
          <Button size="sm" @click="openAddBookmark">+ 添加书签</Button>
        </div>

        <p v-if="store.loading" class="text-sm text-muted-foreground">加载中…</p>

        <VueDraggable
          v-else-if="store.visibleBookmarks.length"
          v-model="dragList"
          :animation="200"
          :handle="'.drag-handle'"
          :delay="150"
          :delay-on-touch-only="true"
          ghost-class="opacity-40"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
          @end="onDragEnd"
        >
          <div
            v-for="bm in store.visibleBookmarks"
            :key="bm.id"
            class="group relative rounded-lg border bg-card p-3 hover:shadow-md transition flex items-center gap-2"
            draggable="true"
            @dragstart="onCardDragStart($event, bm)"
          >
            <span class="drag-handle cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground select-none shrink-0 p-1 -m-1" style="touch-action: none" title="拖拽排序"><GripVertical class="w-4 h-4" /></span>
            <a
              :href="bm.url"
              target="_blank"
              rel="noopener noreferrer"
              draggable="false"
              class="flex items-center gap-3 flex-1 min-w-0"
              @click="openLink(bm.url)"
            >
              <img
                v-if="bm.iconUrl || faviconUrl(bm.url)"
                :src="bm.iconUrl || faviconUrl(bm.url)"
                :alt="bm.name"
                class="w-8 h-8 rounded shrink-0"
                loading="lazy"
                @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
              />
              <div v-else class="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                {{ bm.name[0]?.toUpperCase() }}
              </div>
              <div class="min-w-0">
                <div class="text-sm font-medium truncate">{{ bm.name }}</div>
                <div class="text-xs text-muted-foreground truncate">{{ bm.url }}</div>
              </div>
            </a>
            <div class="absolute top-1 right-1 flex gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100">
              <button class="text-xs text-muted-foreground hover:text-foreground p-0.5" title="编辑" @click.stop="openEditBookmark(bm)"><Pencil class="w-3.5 h-3.5" /></button>
              <button class="text-xs text-muted-foreground hover:text-destructive p-0.5" title="删除" @click.stop="removeBookmark(bm)"><Trash2 class="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </VueDraggable>

        <p v-else class="text-sm text-muted-foreground py-12 text-center">
          还没有书签，点击右上角「添加书签」开始
        </p>
      </section>
    </main>

    <Dialog v-model:open="bmDialogOpen">
      <DialogContent>
        <DialogHeader><DialogTitle>{{ editingBm ? '编辑书签' : '添加书签' }}</DialogTitle></DialogHeader>
        <div class="grid gap-3 py-2">
          <Input v-model="bmName" placeholder="名称（如 GitHub）" />
          <Input v-model="bmUrl" placeholder="URL（如 github.com）" />
          <select v-model="bmCategoryId" class="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm">
            <option value="">未分类</option>
            <option v-for="c in store.categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
          <p v-if="bmError" class="text-sm text-destructive">{{ bmError }}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="bmDialogOpen = false">取消</Button>
          <Button @click="submitBookmark" :disabled="bmSaving">{{ bmSaving ? '保存中…' : '保存' }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="catOpen">
      <DialogContent>
        <DialogHeader><DialogTitle>新建分类</DialogTitle></DialogHeader>
        <Input v-model="catName" placeholder="分类名称（如 开发）" @keyup.enter="submitCategory" />
        <DialogFooter>
          <Button variant="outline" @click="catOpen = false">取消</Button>
          <Button @click="submitCategory" :disabled="catSaving">创建</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="renameOpen">
      <DialogContent>
        <DialogHeader><DialogTitle>重命名分类</DialogTitle></DialogHeader>
        <Input v-model="renameName" placeholder="新名称" @keyup.enter="submitRename" />
        <DialogFooter>
          <Button variant="outline" @click="renameOpen = false">取消</Button>
          <Button @click="submitRename">保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="authDialogOpen">
      <DialogContent>
        <DialogHeader><DialogTitle>{{ mode === 'login' ? '登录同步' : '注册账号' }}</DialogTitle></DialogHeader>
        <form class="grid gap-3 py-2" @submit.prevent="handleAuthSubmit">
          <div class="flex gap-2">
            <Button :variant="mode === 'login' ? 'default' : 'outline'" size="sm" type="button" @click="switchMode('login')">登录</Button>
            <Button :variant="mode === 'signup' ? 'default' : 'outline'" size="sm" type="button" @click="switchMode('signup')">注册</Button>
          </div>
          <Input v-if="mode === 'signup'" v-model="name" placeholder="昵称（可选）" />
          <Input v-model="email" type="email" placeholder="邮箱" autocomplete="email" />
          <Input v-model="password" type="password" placeholder="密码" />
          <p v-if="authMessage" class="text-sm text-destructive">{{ authMessage }}</p>
          <Button type="submit" :disabled="submitting">
            {{ submitting ? '提交中…' : mode === 'login' ? '登录' : '注册' }}
          </Button>
        </form>
      </DialogContent>
    </Dialog>

    <input ref="importInput" type="file" accept=".html" class="hidden" @change="onImportFile" />

    <ConfirmDialog
      :open="confirmState.open"
      title="确认"
      :description="confirmState.description"
      :confirm-text="confirmState.confirmText"
      :destructive="confirmState.destructive"
      @update:open="confirmState.open = $event"
      @confirm="confirmState.onConfirm?.()"
    />
  </div>
</template>

<style scoped>
.drop-target.drag-over {
  outline: 2px solid hsl(var(--primary));
  outline-offset: -2px;
}
</style>
