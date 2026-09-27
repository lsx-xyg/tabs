<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'confirm'): void
}>()

function close() {
  emit('update:open', false)
}
function onConfirm() {
  emit('confirm')
  close()
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>
      <p v-if="description" class="text-sm text-muted-foreground -mt-2">
        {{ description }}
      </p>
      <DialogFooter>
        <Button variant="outline" @click="close">{{ cancelText ?? '取消' }}</Button>
        <Button :variant="destructive ? 'destructive' : 'default'" @click="onConfirm">
          {{ confirmText ?? '确认' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
