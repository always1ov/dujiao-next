<template>
  <div class="flex min-h-[60vh] items-center justify-center px-4 py-12">
    <div class="md3-card w-full max-w-[640px] p-8 text-center sm:p-12">
      <span class="md3-badge md3-badge-neutral"><Info /> {{ brandSiteName }}</span>
      <p class="md3-display-l mt-4 font-medium text-[color:var(--md-sys-color-primary)]">404</p>
      <h1 class="md3-headline-s mt-2">{{ t('notFoundPage.title') }}</h1>
      <p class="md3-body-m mx-auto mt-3 max-w-prose text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('notFoundPage.description', { site: brandSiteName }) }}</p>

      <div class="mt-7 rounded-[var(--md-shape-lg)] bg-[color:var(--md-sys-color-surface-container)] p-5 text-left">
        <p class="md3-label-m mb-3 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('notFoundPage.quickLinksTitle') }}</p>
        <div class="flex flex-wrap gap-2">
          <RouterLink to="/products" class="md3-chip"><ShoppingBag /> {{ t('nav.products') }}</RouterLink>
          <RouterLink to="/notice" class="md3-chip"><Bell /> {{ t('nav.notice') }}</RouterLink>
          <RouterLink to="/blog" class="md3-chip"><BookOpen /> {{ t('nav.blog') }}</RouterLink>
        </div>
      </div>

      <div class="mt-7 flex flex-wrap justify-center gap-3">
        <RouterLink to="/" class="md3-btn md3-btn-filled md3-btn-lg max-[640px]:w-full"><Home /> {{ t('notFoundPage.backHome') }}</RouterLink>
        <button type="button" class="md3-btn md3-btn-outlined md3-btn-lg max-[640px]:w-full" @click="goBack"><ArrowLeft /> {{ t('notFoundPage.backPrevious') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Bell, BookOpen, Home, Info, ShoppingBag } from 'lucide-vue-next'
import { useNotFound } from '../../composables/useNotFound'

const { t } = useI18n()

const { brandSiteName, goBack } = useNotFound()
</script>
