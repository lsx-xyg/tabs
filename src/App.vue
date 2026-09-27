<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

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
import { useBookmarkStore, type Bookmark } from '@/stores/bookmarks'

const sessionState = authClient.useSession()
const store = useBookmarkStore()

const isSignedIn = computed(() => !!sessionState.value?.data)
const userEmail = computed(() => sessionState.value?.data?.user?.email ?? '')

// auth form
const mode = ref<'login' | 'signup'>('login')
const email = ref('')
const password = ref('')
const name = ref('')
const submitting = ref(false)
const authMessage = ref('')

// add bookmark dialog
const addOpen = ref(false)
const bmName = ref('')
const bmUrl = ref('')
const bmCategoryId = ref<string>('')
const bmSaving = ref(false)
const bmError = ref('')

// add category dialog
const catOpen = ref(false)
const catName = ref('')
const catSaving = ref(false)

onMounted(() => {
  if (isSignedIn.value) void store.loadAll()
})
watch(isSignedIn, (v) => {
  if (v) void store.loadAll()
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
  } finally {
    submitting.value = false
  }
}

async function handleSignOut() {
  await authClient.signOut()
  void sessionState.value.refetch()
}

function openAddBookmark() {
  bmName.value = ''
  bmUrl.value = ''
  bmCategoryId.value = store.activeCategoryId ?? ''
  bmError.value = ''
  addOpen.value = true
}

async function submitBookmark() {
  bmError.value = ''
  if (!bmName.value.trim() || !bmUrl.value.trim()) {
    bmError.value = '请填写名称和 URL'
    return
  }
  bmSaving.value = true
  try {
    await store.addBookmark({
      name: bmName.value.trim(),
      url: bmUrl.value.trim(),
      categoryId: bmCategoryId.value || null,
    })
    addOpen.value = false
  } catch (e: any) {
    bmError.value = e.message ?? '添加失败'
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

async function removeBookmark(bm: Bookmark) {
  if (!confirm(`删除书签「${bm.name}」？`)) return
  await store.deleteBookmark(bm.id)
}

async function removeCategory(id: string, label: string) {
  if (!confirm(`删除分类「${label}」及其所有书签？`)) return
  await store.deleteCategory(id)
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <!-- header -->
    <header class="border-b">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <h1 class="text-lg font-semibold tracking-tight">Tabs</h1>
        <div class="flex items-center gap-3 text-sm">
          <template v-if="isSignedIn">
            <Input
              v-model="store.searchQuery"
              placeholder="搜索书签…"
              class="w-48"
            />
            <span class="text-muted-foreground">{{ userEmail }}</span>
            <Button variant="outline" size="sm" @click="handleSignOut">退出</Button>
          </template>
        </div>
      </div>
    </header>

    <!-- auth screen -->
    <main v-if="!isSignedIn" class="mx-auto max-w-md px-4 py-16">
      <div class="rounded-xl border bg-card p-6 shadow-sm">
        <h2 class="text-xl font-semibold mb-1">{{ mode === 'login' ? '登录' : '注册' }}</h2>
        <p class="text-sm text-muted-foreground mb-4">登录后书签跨设备同步</p>
        <form class="grid gap-3" @submit.prevent="handleAuthSubmit">
          <div class="flex gap-2">
            <Button
              :variant="mode === 'login' ? 'default' : 'outline'"
              size="sm"
              @click="switchMode('login')"
            >登录</Button>
            <Button
              :variant="mode === 'signup' ? 'default' : 'outline'"
              size="sm"
              @click="switchMode('signup')"
            >注册</Button>
          </div>
          <Input v-if="mode === 'signup'" v-model="name" placeholder="昵称（可选）" />
          <Input v-model="email" type="email" placeholder="邮箱" autocomplete="email" />
          <Input v-model="password" type="password" placeholder="密码" />
          <p v-if="authMessage" class="text-sm text-destructive">{{ authMessage }}</p>
          <Button type="submit" :disabled="submitting">
            {{ submitting ? '提交中…' : mode === 'login' ? '登录' : '注册' }}
          </Button>
        </form>
      </div>
    </main>

    <!-- main app -->
    <main v-else class="mx-auto flex max-w-7xl gap-6 px-4 py-6">
      <!-- sidebar -->
      <aside class="w-56 shrink-0">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-medium text-muted-foreground">分类</h3>
          <Button variant="ghost" size="sm" @click="catOpen = true">+</Button>
        </div>
        <nav class="space-y-1">
          <button
            class="w-full rounded-md px-3 py-2 text-left text-sm transition"
            :class="store.activeCategoryId === null ? 'bg-accent font-medium' : 'hover:bg-accent/50'"
            @click="store.selectCategory(null)"
          >
            全部
          </button>
          <div
            v-for="c in store.categories"
            :key="c.id"
            class="group flex items-center gap-1"
          >
            <button
              class="flex-1 rounded-md px-3 py-2 text-left text-sm transition truncate"
              :class="store.activeCategoryId === c.id ? 'bg-accent font-medium' : 'hover:bg-accent/50'"
              @click="store.selectCategory(c.id)"
            >
              {{ c.name }}
            </button>
            <button
              class="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground hover:text-destructive px-1"
              @click="removeCategory(c.id, c.name)"
            >×</button>
          </div>
        </nav>
      </aside>

      <!-- content -->
      <section class="flex-1">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold">
            {{ store.searchQuery ? '搜索结果' : (store.activeCategory?.name ?? '全部书签') }}
            <span class="ml-2 text-sm font-normal text-muted-foreground">
              {{ store.visibleBookmarks.length }} 个
            </span>
          </h2>
          <Button size="sm" @click="openAddBookmark">+ 添加书签</Button>
        </div>

        <p v-if="store.loading" class="text-sm text-muted-foreground">加载中…</p>

        <div v-else-if="store.visibleBookmarks.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <a
            v-for="bm in store.visibleBookmarks"
            :key="bm.id"
            :href="bm.url"
            target="_blank"
            rel="noopener noreferrer"
            class="group rounded-lg border bg-card p-3 hover:shadow-md transition flex items-center gap-3"
          >
            <img
              v-if="bm.iconUrl || faviconUrl(bm.url)"
              :src="bm.iconUrl || faviconUrl(bm.url)"
              :alt="bm.name"
              class="w-8 h-8 rounded"
              loading="lazy"
              @error="(e) => ((e.target as HTMLImageElement).style.display = 'none')"
            />
            <div v-else class="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
              {{ bm.name[0]?.toUpperCase() }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-sm font-medium truncate">{{ bm.name }}</div>
              <div class="text-xs text-muted-foreground truncate">{{ bm.url }}</div>
            </div>
            <button
              class="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground hover:text-destructive"
              @click.prevent="removeBookmark(bm)"
            >删除</button>
          </a>
        </div>

        <p v-else class="text-sm text-muted-foreground py-12 text-center">
          还没有书签，点击右上角「添加书签」开始
        </p>
      </section>
    </main>

    <!-- add bookmark dialog -->
    <Dialog v-model:open="addOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加书签</DialogTitle>
        </DialogHeader>
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
          <Button variant="outline" @click="addOpen = false">取消</Button>
          <Button @click="submitBookmark" :disabled="bmSaving">
            {{ bmSaving ? '保存中…' : '保存' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- add category dialog -->
    <Dialog v-model:open="catOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建分类</DialogTitle>
        </DialogHeader>
        <Input v-model="catName" placeholder="分类名称（如 开发）" @keyup.enter="submitCategory" />
        <DialogFooter>
          <Button variant="outline" @click="catOpen = false">取消</Button>
          <Button @click="submitCategory" :disabled="catSaving">创建</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
