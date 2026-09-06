<template>
  <div class="md3-container pb-10">
    <header class="pb-4 pt-5 sm:pt-6">
      <h1 class="md3-page-title">{{ t('nav.blog') }}</h1>
      <p class="md3-body-m mt-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('blog.subtitle') }}</p>
    </header>

    <label class="md3-search md3-search-sm mb-6 max-w-[520px]">
      <Search />
      <input v-model="searchKeyword" type="search" :placeholder="t('blog.searchPlaceholder')" />
      <button v-if="searchKeyword" type="button" class="md3-btn md3-btn-text md3-btn-sm -mr-2" @click="searchKeyword = ''">{{ t('blog.searchClear') }}</button>
    </label>

    <div v-if="loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="i in 6" :key="i" class="md3-skeleton h-[280px]"></div>
    </div>

    <template v-else-if="posts.length > 0">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <RouterLink v-for="post in posts" :key="post.id" class="md3-card md3-card-interactive group flex flex-col overflow-hidden" :to="`/blog/${post.slug}`">
          <div v-if="post.thumbnail" class="aspect-[16/9] w-full overflow-hidden">
            <img :src="getImageUrl(post.thumbnail)" :alt="getLocalizedText(post.title)" loading="lazy" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
          </div>
          <div class="flex flex-1 flex-col p-5">
            <div class="mb-2 flex items-center gap-2">
              <span class="md3-badge" :class="post.type === 'blog' ? 'md3-badge-info' : 'md3-badge-warning'">{{ post.type === 'blog' ? t('nav.blog') : t('nav.notice') }}</span>
              <span class="md3-label-m text-[color:var(--md-sys-color-on-surface-variant)]">{{ formatDate(post.published_at) }}</span>
            </div>
            <h3 class="md3-title-m">{{ getLocalizedText(post.title) }}</h3>
            <p class="md3-body-m mt-1.5 flex-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ getLocalizedText(post.summary) }}</p>
            <span class="md3-label-l mt-3 inline-flex items-center gap-1 text-[color:var(--md-sys-color-primary)]">
              {{ t('blog.readMore') }} <ArrowRight class="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </div>
        </RouterLink>
      </div>
      <Md3Pagination :page="currentPage" :total-pages="totalPages" @change="changePage" />
    </template>

    <Md3Empty v-else :icon="BookOpen" :message="searchKeyword.trim() ? t('blog.noResults') : t('blog.empty')" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ArrowRight, BookOpen, Search } from 'lucide-vue-next'
import { getImageUrl } from '../../utils/image'
import { usePostList } from '../../composables/usePostList'
import Md3Pagination from './components/Md3Pagination.vue'
import Md3Empty from './components/Md3Empty.vue'

const { t } = useI18n()

const {
  loading, posts, currentPage, totalPages, searchKeyword,
  getLocalizedText, formatDate, changePage,
} = usePostList('blog', { title: () => t('nav.blog'), canonicalPath: '/blog' })
</script>
