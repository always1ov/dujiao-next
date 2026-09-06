<template>
  <div class="flex min-h-[60vh] items-center justify-center px-4 py-12">
    <div class="md3-card w-full max-w-[420px] p-8">
      <div v-if="loading" class="grid justify-items-center gap-4 text-center">
        <span class="h-9 w-9 animate-spin rounded-full border-[3px] border-[color:var(--md-sys-color-outline-variant)] border-t-[color:var(--md-sys-color-primary)] motion-reduce:animate-none" aria-hidden="true"></span>
        <p class="md3-body-m text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('auth.telegramCallback.processing') }}</p>
      </div>
      <div v-else-if="errMsg" class="grid justify-items-center gap-4 text-center">
        <AlertCircle class="h-9 w-9 text-[color:var(--md-sys-color-error)]" />
        <p class="md3-title-m">{{ errMsg }}</p>
        <RouterLink to="/auth/login" class="md3-btn md3-btn-outlined md3-btn-sm">{{ t('auth.telegramCallback.backToLogin') }}</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AlertCircle } from 'lucide-vue-next'
import { useTelegramCallback } from '../../../composables/useTelegramCallback'

const { t } = useI18n()

const { loading, errMsg } = useTelegramCallback()
</script>
