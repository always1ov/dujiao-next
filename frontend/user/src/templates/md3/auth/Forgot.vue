<template>
  <div class="flex min-h-[70vh] items-center justify-center px-4 py-10">
    <div class="w-full max-w-[460px]">
      <div class="mb-3 flex items-center justify-between">
        <RouterLink to="/" class="md3-btn md3-btn-text md3-btn-sm -ml-3"><ArrowLeft /> {{ t('auth.login.backHome') }}</RouterLink>
        <span class="md3-badge md3-badge-neutral">{{ t('auth.forgot.title') }}</span>
      </div>

      <div class="md3-card p-6 sm:p-8">
        <div class="mb-6 text-center">
          <p class="md3-label-l text-[color:var(--md-sys-color-primary)]">{{ brandSiteName }}</p>
          <h1 class="md3-headline-s mt-2">{{ t('auth.forgot.title') }}</h1>
          <p class="md3-body-m mt-2 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('auth.forgot.subtitle') }}</p>
        </div>

        <div v-if="!emailVerificationEnabled" class="md3-banner md3-banner-error flex-col items-center text-center">
          <p class="md3-label-l">{{ t('auth.forgot.disabled') }}</p>
          <RouterLink to="/auth/login" class="md3-btn md3-btn-text md3-btn-sm mt-2 text-inherit">{{ t('auth.forgot.backLogin') }}</RouterLink>
        </div>

        <form v-else class="grid gap-4" @submit.prevent="handleReset">
          <div>
            <label class="md3-field-label flex items-center gap-1.5"><Mail class="h-3.5 w-3.5" /> {{ t('auth.forgot.emailLabel') }}</label>
            <input v-model="email" type="email" required class="md3-input" :placeholder="t('auth.forgot.emailPlaceholder')" />
          </div>

          <div v-if="sendCodeCaptchaEnabled">
            <label class="md3-field-label flex items-center gap-1.5"><ShieldCheck class="h-3.5 w-3.5" /> {{ t('auth.common.captchaLabel') }}</label>
            <ImageCaptcha v-if="captchaProvider === 'image'" ref="imageCaptchaRef" v-model="captchaPayload" :disabled="sending || countdown > 0" @config-stale="handleCaptchaConfigStale" />
            <TurnstileCaptcha v-else-if="captchaProvider === 'turnstile'" ref="turnstileRef" v-model="turnstileToken" :site-key="turnstileSiteKey" />
          </div>

          <div>
            <label class="md3-field-label flex items-center gap-1.5"><ShieldCheck class="h-3.5 w-3.5" /> {{ t('auth.forgot.codeLabel') }}</label>
            <div class="flex gap-2">
              <input v-model="code" type="text" required class="md3-input min-w-0 flex-1" :placeholder="t('auth.forgot.codePlaceholder')" />
              <button type="button" class="md3-btn md3-btn-tonal h-14 shrink-0" :disabled="sending || countdown > 0" @click="handleSendCode">
                {{ countdown > 0 ? t('auth.common.countdown', { seconds: countdown }) : t('auth.common.sendCode') }}
              </button>
            </div>
          </div>

          <div>
            <label class="md3-field-label flex items-center gap-1.5"><KeyRound class="h-3.5 w-3.5" /> {{ t('auth.forgot.newPasswordLabel') }}</label>
            <input v-model="newPassword" type="password" required class="md3-input" :placeholder="t('auth.forgot.newPasswordPlaceholder')" />
          </div>

          <div v-if="error" class="md3-banner md3-banner-error"><AlertCircle /> <span>{{ error }}</span></div>

          <button type="submit" :disabled="userAuthStore.loading" class="md3-btn md3-btn-filled md3-btn-lg md3-btn-block">
            <RotateCw v-if="!userAuthStore.loading" />
            {{ userAuthStore.loading ? t('auth.forgot.submitting') : t('auth.forgot.submit') }}
          </button>
        </form>
      </div>

      <div class="mt-4 text-center">
        <RouterLink to="/auth/login" class="md3-btn md3-btn-text md3-btn-sm">{{ t('auth.forgot.backLogin') }}</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AlertCircle, ArrowLeft, Mail, ShieldCheck, KeyRound, RotateCw } from 'lucide-vue-next'
import ImageCaptcha from '../../../components/captcha/ImageCaptcha.vue'
import TurnstileCaptcha from '../../../components/captcha/TurnstileCaptcha.vue'
import { useForgot } from '../../../composables/useForgot'

const { t } = useI18n()

const {
  userAuthStore, brandSiteName, emailVerificationEnabled,
  email, code, newPassword, error, sending, countdown,
  captchaPayload, turnstileToken, imageCaptchaRef, turnstileRef,
  captchaProvider, sendCodeCaptchaEnabled, turnstileSiteKey,
  handleCaptchaConfigStale, handleSendCode, handleReset,
} = useForgot()

// imageCaptchaRef / turnstileRef 仅通过字符串模板 ref 绑定，显式标记避免 noUnusedLocals 误报。
void imageCaptchaRef
void turnstileRef
</script>
