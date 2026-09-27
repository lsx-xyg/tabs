<script setup lang="ts">
import { ref } from 'vue'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

const sampleUrl = ref('')
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="border-b">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <h1 class="text-lg font-semibold">Tabs</h1>
        <span class="text-sm text-muted-foreground">跨设备书签导航</span>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-8">
      <Card class="max-w-md">
        <CardHeader>
          <CardTitle>应用壳已就绪</CardTitle>
          <CardDescription>
            Vite · Vue 3 · TypeScript · Tailwind · ShadCN Vue · Pinia · Vitest
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger as-child>
              <Button>打开示例对话框</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加书签（占位）</DialogTitle>
                <DialogDescription>
                  书签的增删改查将在后续迭代接入。
                </DialogDescription>
              </DialogHeader>
              <div class="grid gap-4 py-4">
                <Input v-model="sampleUrl" placeholder="https://example.com" />
              </div>
              <DialogFooter>
                <Button variant="outline" type="button">取消</Button>
                <Button type="submit">保存</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </main>
  </div>
</template>
