<script setup lang="ts">
import { computed, ref } from 'vue'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { authClient } from '@/lib/auth-client'

const sessionState = authClient.useSession()

const mode = ref<'login' | 'signup'>('login')
const email = ref('')
const password = ref('')
const name = ref('')
const submitting = ref(false)
const message = ref('')

const isSignedIn = computed(() => !!sessionState.value?.data)
const userEmail = computed(() => sessionState.value?.data?.user?.email ?? '')
function switchMode(next: 'login' | 'signup') {
  mode.value = next
  message.value = ''
}

async function handleSubmit() {
  message.value = ''
  if (!email.value || !password.value) {
    message.value = '请填写邮箱与密码'
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
      message.value = result.error.message ?? (mode.value === 'signup' ? '注册失败' : '登录失败')
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
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="border-b">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <h1 class="text-lg font-semibold">Tabs</h1>
        <div class="flex items-center gap-3 text-sm text-muted-foreground">
          <template v-if="isSignedIn">
            <span class="text-foreground">{{ userEmail }}</span>
            <Button variant="outline" size="sm" type="button" @click="handleSignOut">
              退出登录
            </Button>
          </template>
          <span v-else>未登录</span>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-8">
      <Card class="max-w-md">
        <CardHeader>
          <CardTitle>账户</CardTitle>
          <CardDescription>
            Better Auth 认证：会话与业务数据同库（Neon），登录后跨设备同步。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p v-if="sessionState.isPending" class="text-sm text-muted-foreground">正在加载会话…</p>
          <p v-else-if="sessionState.error" class="text-sm text-destructive">
            会话读取失败：{{ sessionState.error.message }}
          </p>

          <template v-else-if="isSignedIn">
            <p class="text-sm text-muted-foreground">
              已登录：{{ userEmail }}。书签与分类功能将在后续迭代接入。
            </p>
          </template>

          <form v-else class="grid gap-4" @submit.prevent="handleSubmit">
            <div class="flex gap-2">
              <Button
                :variant="mode === 'login' ? 'default' : 'outline'"
                size="sm"
                type="button"
                @click="switchMode('login')"
              >
                登录
              </Button>
              <Button
                :variant="mode === 'signup' ? 'default' : 'outline'"
                size="sm"
                type="button"
                @click="switchMode('signup')"
              >
                注册
              </Button>
            </div>

            <Input v-if="mode === 'signup'" v-model="name" placeholder="昵称（可选）" />
            <Input v-model="email" type="email" placeholder="邮箱" autocomplete="email" />
            <Input
              v-model="password"
              type="password"
              placeholder="密码"
              :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
            />

            <p v-if="message" class="text-sm text-destructive">{{ message }}</p>

            <Button type="submit" :disabled="submitting">
              {{ submitting ? '提交中…' : mode === 'login' ? '登录' : '注册' }}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  </div>
</template>
