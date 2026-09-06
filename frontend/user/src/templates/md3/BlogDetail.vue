<template>
  <div class="mx-auto w-full max-w-[860px] px-4 pb-10 sm:px-6">
    <div v-if="loading" class="grid gap-4 pt-6">
      <div class="md3-skeleton h-6 w-2/5"></div>
      <div class="md3-skeleton h-11 w-3/4"></div>
      <div class="md3-skeleton h-80"></div>
    </div>

    <article v-else-if="post">
      <nav class="md3-body-s flex flex-wrap items-center gap-1 pb-3 pt-5 text-[color:var(--md-sys-color-on-surface-variant)]">
        <RouterLink to="/" class="hover:text-[color:var(--md-sys-color-primary)]">{{ t('nav.home') }}</RouterLink>
        <ChevronRight class="h-4 w-4 flex-none" />
        <RouterLink :to="backLink" class="hover:text-[color:var(--md-sys-color-primary)]">{{ backText }}</RouterLink>
        <ChevronRight class="h-4 w-4 flex-none" />
        <span class="max-w-[240px] truncate text-[color:var(--md-sys-color-on-surface)]">{{ getLocalizedText(post.title) }}</span>
      </nav>

      <div class="md3-card overflow-hidden">
        <div v-if="post.thumbnail" class="aspect-[16/8] w-full overflow-hidden">
          <img :src="getImageUrl(post.thumbnail)" :alt="getLocalizedText(post.title)" loading="lazy" class="h-full w-full object-cover" />
        </div>
        <div class="p-6 sm:p-8">
          <header class="mb-6 border-b border-[color:var(--md-sys-color-outline-variant)] pb-6">
            <div class="mb-3 flex items-center gap-2">
              <span class="md3-badge" :class="post.type === 'blog' ? 'md3-badge-info' : 'md3-badge-warning'">{{ post.type === 'blog' ? t('nav.blog') : t('nav.notice') }}</span>
              <span class="md3-label-m text-[color:var(--md-sys-color-on-surface-variant)]">{{ formatDate(post.published_at) }}</span>
            </div>
            <h1 class="md3-headline-s sm:md3-headline-m font-medium">{{ getLocalizedText(post.title) }}</h1>
            <p v-if="post.summary" class="md3-body-l mt-3 text-[color:var(--md-sys-color-on-surface-variant)]">{{ getLocalizedText(post.summary) }}</p>
          </header>

          <div class="md3-prose prose max-w-none dark:prose-invert prose-a:text-primary prose-img:rounded-md" v-html="processHtmlForDisplay(getLocalizedText(post.content))"></div>

          <section v-if="relatedProducts.length" class="mt-8 border-t border-[color:var(--md-sys-color-outline-variant)] pt-6">
            <h2 class="md3-title-l mb-4">{{ t('blog.relatedProducts') }}</h2>
            <div class="grid gap-3 sm:grid-cols-2">
              <RouterLink v-for="rp in relatedProducts" :key="rp.id" :to="`/products/${rp.slug}`" class="md3-card-filled md3-card-interactive flex items-center gap-3 p-3">
                <div v-if="rp.image" class="h-14 w-14 flex-none overflow-hidden rounded-[var(--md-shape-sm)]">
                  <img :src="getImageUrl(rp.image)" :alt="getLocalizedText(rp.title)" loading="lazy" class="h-full w-full object-cover" />
                </div>
                <div class="min-w-0">
                  <div class="md3-title-s truncate">{{ getLocalizedText(rp.title) }}</div>
                  <div class="md3-label-l mt-1 text-[color:var(--md-sys-color-primary)]">{{ formatPrice(rp.price_amount) }}</div>
                </div>
              </RouterLink>
            </div>
          </section>

          <footer class="mt-8 flex justify-center border-t border-[color:var(--md-sys-color-outline-variant)] pt-6">
            <RouterLink :to="backLink" class="md3-btn md3-btn-outlined md3-btn-sm"><ArrowLeft /> {{ backText }}</RouterLink>
          </footer>
        </div>
      </div>
    </article>

    <div v-else class="my-10">
      <Md3Empty :icon="AlertCircle" :message="t('blogDetail.notFound')">
        <RouterLink to="/blog" class="md3-btn md3-btn-filled md3-btn-sm">{{ t('blogDetail.backToBlog') }}</RouterLink>
      </Md3Empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ArrowLeft, AlertCircle, ChevronRight } from 'lucide-vue-next'
import { getImageUrl } from '../../utils/image'
import { processHtmlForDisplay } from '../../utils/content'
import { useBlogDetail } from '../../composables/useBlogDetail'
import Md3Empty from './components/Md3Empty.vue'

const { t } = useI18n()

const {
  loading, post, relatedProducts, getLocalizedText, formatDate, formatPrice, backLink, backText,
} = useBlogDetail()
</script>
