<template>
  <aside class="min-w-0 lg:sticky lg:top-6">
    <!-- 移动端 / 平板：横向滚动的 filter chips -->
    <div class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:hidden [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        class="md3-chip flex-none"
        :class="{ 'md3-chip-selected': selectedCategory === null }"
        @click="$emit('select', null)"
      >
        <Check v-if="selectedCategory === null" />
        {{ t('products.allCategories') }}
      </button>
      <template v-for="grp in categoryGroups" :key="`chip-${grp.id}`">
        <button
          type="button"
          class="md3-chip max-w-[60vw] flex-none"
          :class="{ 'md3-chip-selected': selectedCategory === grp.id }"
          @click="$emit('select', grp.id)"
        >
          <Check v-if="selectedCategory === grp.id" />
          <img v-else-if="grp.icon" :src="getImageUrl(grp.icon)" :alt="catName(grp)" loading="lazy" class="-ml-1 h-[18px] w-[18px] rounded-[4px] object-cover" />
          <span class="truncate">{{ catName(grp) }}</span>
        </button>
        <button
          v-for="child in grp.children"
          :key="`chip-${child.id}`"
          type="button"
          class="md3-chip max-w-[60vw] flex-none"
          :class="{ 'md3-chip-selected': selectedCategory === child.id }"
          @click="$emit('select', child.id)"
        >
          <Check v-if="selectedCategory === child.id" />
          <span class="truncate">{{ catName(child) }}</span>
        </button>
      </template>
    </div>

    <!-- 桌面：导航抽屉风格列表 -->
    <div class="hidden rounded-[var(--md-shape-lg)] bg-[color:var(--md-sys-color-surface-container-low)] p-3 lg:block">
      <div class="md3-title-s px-4 pb-2 pt-2 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('products.categories') }}</div>
      <div class="grid gap-0.5">
        <button type="button" class="md3-list-item min-h-[48px] py-0 text-left" :class="{ 'is-active': selectedCategory === null }" @click="$emit('select', null)">
          <LayoutGrid />
          <span class="md3-label-l min-w-0 flex-1 truncate">{{ t('products.allCategories') }}</span>
        </button>
        <template v-for="grp in categoryGroups" :key="grp.id">
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="md3-list-item min-h-[48px] min-w-0 flex-1 py-0 text-left"
              :class="{ 'is-active': selectedCategory === grp.id }"
              @click="$emit('select', grp.id)"
            >
              <img v-if="grp.icon" :src="getImageUrl(grp.icon)" :alt="catName(grp)" loading="lazy" class="h-[22px] w-[22px] flex-none rounded-[6px] object-cover" />
              <Tag v-else />
              <span class="md3-label-l min-w-0 flex-1 truncate">{{ catName(grp) }}</span>
            </button>
            <button
              v-if="grp.children.length"
              type="button"
              class="md3-icon-btn md3-icon-btn-sm"
              :class="expandedParentIds.includes(grp.id) ? 'text-[color:var(--md-sys-color-primary)]' : ''"
              :aria-expanded="expandedParentIds.includes(grp.id)"
              :aria-label="catName(grp)"
              @click="$emit('toggle', grp.id)"
            >
              <ChevronDown class="transition-transform" :class="{ 'rotate-180': expandedParentIds.includes(grp.id) }" />
            </button>
          </div>
          <template v-if="grp.children.length && expandedParentIds.includes(grp.id)">
            <button
              v-for="child in grp.children"
              :key="child.id"
              type="button"
              class="md3-list-item min-h-[44px] py-0 pl-12 text-left"
              :class="{ 'is-active': selectedCategory === child.id }"
              @click="$emit('select', child.id)"
            >
              <span class="md3-label-l min-w-0 flex-1 truncate">{{ catName(child) }}</span>
            </button>
          </template>
        </template>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Check, ChevronDown, LayoutGrid, Tag } from 'lucide-vue-next'
import { getImageUrl } from '../../../utils/image'
import { useLocalized } from '../../../composables/useProduct'
import type { PublicCategory } from '../../../utils/category'

defineProps<{
  categoryGroups: (PublicCategory & { children: PublicCategory[] })[]
  selectedCategory: number | null
  expandedParentIds: number[]
}>()

defineEmits<{ select: [id: number | null]; toggle: [id: number] }>()

const { t } = useI18n()
const { getLocalizedText } = useLocalized()
const catName = (cat: PublicCategory) => getLocalizedText(cat.name) || cat.slug || ''
</script>
