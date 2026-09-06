<template>
  <div class="mx-auto w-full max-w-[860px] px-4 pb-10 pt-4 sm:px-6">
    <div v-if="loading" class="flex justify-center py-20">
      <Loader2 class="h-10 w-10 animate-spin text-[color:var(--md-sys-color-primary)] motion-reduce:animate-none" />
    </div>

    <article v-else class="md3-card mt-4 p-6 sm:p-9">
      <h1 class="md3-page-title mb-6 border-b border-[color:var(--md-sys-color-outline-variant)] pb-5">{{ title }}</h1>
      <div v-if="content" class="md3-prose prose max-w-none dark:prose-invert prose-a:text-primary prose-img:rounded-md" v-html="content"></div>
      <Md3Empty v-else :icon="FileText" :message="t('common.noContent')" />
    </article>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { FileText, Loader2 } from 'lucide-vue-next'
import Md3Empty from './components/Md3Empty.vue'
import { useLegal } from '../../composables/useLegal'

const { t } = useI18n()

const props = defineProps<{ type: 'terms' | 'privacy' }>()

const { loading, title, content } = useLegal(() => props.type)
</script>
