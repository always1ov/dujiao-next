<template>
  <div class="md3-container pb-10">
    <header class="pb-5 pt-5 sm:pt-6">
      <h1 class="md3-page-title">{{ t('nav.notice') }}</h1>
      <p class="md3-body-m mt-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('notice.subtitle') }}</p>
    </header>

    <div v-if="loading" class="mx-auto grid max-w-[880px] gap-3">
      <div v-for="i in 6" :key="i" class="md3-skeleton h-[96px]"></div>
    </div>

    <template v-else-if="notices.length > 0">
      <div class="mx-auto grid max-w-[880px] gap-3">
        <button
          v-for="notice in notices"
          :key="notice.id"
          type="button"
          class="md3-card-outlined md3-card-interactive group flex w-full items-center gap-4 px-5 py-4 text-left"
          @click="goToNotice(notice.slug)"
        >
          <div class="relative grid h-14 w-14 flex-none place-items-center overflow-hidden rounded-full max-[640px]:hidden" :class="notice.thumbnail ? 'bg-[color:var(--md-sys-color-surface-container)]' : 'bg-[color:var(--md-ext-warning-container)] text-[color:var(--md-ext-on-warning-container)]'">
            <img v-if="notice.thumbnail" :src="getImageUrl(notice.thumbnail)" :alt="getLocalizedText(notice.title)" loading="lazy" class="absolute inset-0 h-full w-full object-cover" />
            <Bell v-else class="h-6 w-6" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="mb-1.5 flex items-center gap-2">
              <span class="md3-badge md3-badge-warning">{{ t('nav.notice') }}</span>
              <span class="md3-label-m text-[color:var(--md-sys-color-on-surface-variant)]">{{ formatDate(notice.published_at) }}</span>
            </div>
            <h2 class="md3-title-m truncate">{{ getLocalizedText(notice.title) }}</h2>
            <p class="md3-body-m mt-0.5 truncate text-[color:var(--md-sys-color-on-surface-variant)]">{{ getLocalizedText(notice.summary) }}</p>
          </div>
          <ChevronRight class="h-5 w-5 flex-none text-[color:var(--md-sys-color-on-surface-variant)] transition group-hover:translate-x-0.5" />
        </button>
      </div>
      <Md3Pagination :page="currentPage" :total-pages="totalPages" @change="changePage" />
    </template>

    <Md3Empty v-else :icon="Bell" :message="t('notice.empty')" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Bell, ChevronRight } from 'lucide-vue-next'
import { getImageUrl } from '../../utils/image'
import { usePostList } from '../../composables/usePostList'
import Md3Pagination from './components/Md3Pagination.vue'
import Md3Empty from './components/Md3Empty.vue'

const { t } = useI18n()

const {
  loading, posts: notices, currentPage, totalPages,
  getLocalizedText, formatDate, goToPost: goToNotice, changePage,
} = usePostList('notice', { title: () => t('nav.notice'), canonicalPath: '/notice' })
</script>
