<template>
  <nav v-if="totalPages > 1" class="mt-8 flex flex-wrap items-center justify-center gap-2" :aria-label="t('pagination.label')">
    <button type="button" class="md3-icon-btn md3-icon-btn-outlined" :disabled="disabled || page <= 1" :aria-label="t('pagination.previous')" @click="$emit('change', page - 1)">
      <ChevronLeft />
    </button>
    <button
      v-for="p in pageWindow"
      :key="p"
      type="button"
      class="md3-chip min-w-[40px] justify-center px-3"
      :class="{ 'md3-chip-selected': p === page }"
      :aria-current="p === page ? 'page' : undefined"
      :disabled="disabled"
      @click="$emit('change', p)"
    >{{ p }}</button>
    <button type="button" class="md3-icon-btn md3-icon-btn-outlined" :disabled="disabled || page >= totalPages" :aria-label="t('pagination.next')" @click="$emit('change', page + 1)">
      <ChevronRight />
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = withDefaults(defineProps<{ page: number; totalPages: number; disabled?: boolean }>(), { disabled: false })
defineEmits<{ change: [page: number] }>()

const { t } = useI18n()

// 当前页前后各 2 页的滑动窗口
const pageWindow = computed(() => {
  const total = props.totalPages
  const cur = props.page
  const start = Math.max(1, cur - 2)
  const end = Math.min(total, start + 4)
  const realStart = Math.max(1, end - 4)
  const pages: number[] = []
  for (let p = realStart; p <= end; p++) pages.push(p)
  return pages
})
</script>
