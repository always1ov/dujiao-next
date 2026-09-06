<template>
  <div class="flex min-h-[70vh] items-center justify-center px-4 py-10">
    <div class="w-full max-w-[480px]">
      <div class="mb-3 flex items-center justify-between">
        <RouterLink to="/" class="md3-btn md3-btn-text md3-btn-sm -ml-3"><ArrowLeft /> {{ t('auth.login.backHome') }}</RouterLink>
        <span class="md3-badge md3-badge-neutral">{{ t('auth.register.title') }}</span>
      </div>

      <div class="md3-card p-6 sm:p-8">
        <div v-if="!registrationEnabled" class="py-6 text-center">
          <p class="md3-body-m text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('auth.register.registrationDisabled') }}</p>
          <RouterLink to="/auth/login" class="md3-btn md3-btn-text mt-4">{{ t('auth.register.hasAccount') }}</RouterLink>
        </div>

        <template v-else>
          <div class="mb-6 text-center">
            <p class="md3-label-l text-[color:var(--md-sys-color-primary)]">{{ brandSiteName }}</p>
            <h1 class="md3-headline-s mt-2">{{ t('auth.register.title') }}</h1>
            <p class="md3-body-m mt-2 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('auth.register.subtitle') }}</p>
          </div>

          <form class="grid gap-4" @submit.prevent="handleRegister">
            <!-- 邮箱 -->
            <div>
              <label class="md3-field-label flex items-center gap-1.5"><Mail class="h-3.5 w-3.5" /> {{ t('auth.register.emailLabel') }}</label>
              <div v-if="emailDomainSelectionRequired" class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(9rem,auto)]">
                <input
                  v-model="emailLocalPart"
                  type="text"
                  required
                  autocomplete="username"
                  class="md3-input"
                  :class="{ 'md3-input-error': formValidation.hasError('email') }"
                  :placeholder="t('auth.register.emailLocalPlaceholder')"
                  @blur="touchRegistrationEmail"
                />
                <select v-model="selectedEmailDomain" class="md3-input" :class="{ 'md3-input-error': formValidation.hasError('email') }" @change="touchRegistrationEmail">
                  <option v-for="domain in allowedEmailDomains" :key="domain" :value="domain">@{{ domain }}</option>
                </select>
              </div>
              <input
                v-else
                v-model="email"
                type="email"
                required
                class="md3-input"
                :class="{ 'md3-input-error': formValidation.hasError('email') }"
                :placeholder="t('auth.register.emailPlaceholder')"
                @blur="touchRegistrationEmail"
              />
              <p v-if="formValidation.hasError('email')" class="md3-field-support md3-field-support-error">{{ formValidation.getError('email') }}</p>
              <p v-else-if="emailDomainSelectionRequired" class="md3-field-support">{{ t('auth.register.emailDomainSelectHint') }}</p>
              <p v-else-if="emailDomainAllowlistEnabled" class="md3-field-support">
                {{ allowedEmailDomains.length > 0
                  ? t('auth.register.allowedEmailDomainsHint', { domains: allowedEmailDomainsText })
                  : t('auth.register.noAllowedEmailDomainsHint') }}
              </p>
            </div>

            <!-- 密码 -->
            <div>
              <label class="md3-field-label flex items-center gap-1.5"><Lock class="h-3.5 w-3.5" /> {{ t('auth.register.passwordLabel') }}</label>
              <div class="relative">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  class="md3-input pr-12"
                  :class="{ 'md3-input-error': formValidation.hasError('password') }"
                  :placeholder="t('auth.register.passwordPlaceholder')"
                  @blur="formValidation.touchField('password', password)"
                />
                <button type="button" class="md3-icon-btn absolute right-1.5 top-1/2 -translate-y-1/2" :aria-label="showPassword ? t('auth.common.hidePassword') : t('auth.common.showPassword')" @click="showPassword = !showPassword">
                  <EyeOff v-if="showPassword" /><Eye v-else />
                </button>
              </div>
              <p v-if="formValidation.hasError('password')" class="md3-field-support md3-field-support-error">{{ formValidation.getError('password') }}</p>
              <div v-if="password && !formValidation.hasError('password')" class="mt-2 flex items-center gap-2">
                <div class="flex flex-1 gap-1.5">
                  <div class="h-1 flex-1 rounded-full transition-colors" :class="strengthBar(1)" />
                  <div class="h-1 flex-1 rounded-full transition-colors" :class="strengthBar(2)" />
                  <div class="h-1 flex-1 rounded-full transition-colors" :class="strengthBar(3)" />
                </div>
                <span class="md3-label-m" :class="strengthText">{{ t(`formValidation.passwordStrength.${passwordStrength}`) }}</span>
              </div>
            </div>

            <!-- 图形验证 -->
            <div v-if="emailVerificationEnabled && sendCodeCaptchaEnabled">
              <label class="md3-field-label flex items-center gap-1.5"><ShieldCheck class="h-3.5 w-3.5" /> {{ t('auth.common.captchaLabel') }}</label>
              <ImageCaptcha v-if="captchaProvider === 'image'" ref="imageCaptchaRef" v-model="captchaPayload" :disabled="sending || countdown > 0" @config-stale="handleCaptchaConfigStale" />
              <TurnstileCaptcha v-else-if="captchaProvider === 'turnstile'" ref="turnstileRef" v-model="turnstileToken" :site-key="turnstileSiteKey" />
            </div>

            <!-- 邮箱验证码 -->
            <div v-if="emailVerificationEnabled">
              <label class="md3-field-label flex items-center gap-1.5"><ShieldCheck class="h-3.5 w-3.5" /> {{ t('auth.register.codeLabel') }}</label>
              <div class="flex gap-2">
                <input v-model="code" type="text" required class="md3-input min-w-0 flex-1" :placeholder="t('auth.register.codePlaceholder')" />
                <button type="button" class="md3-btn md3-btn-tonal h-14 shrink-0" :disabled="sending || countdown > 0" @click="handleSendCode">
                  {{ countdown > 0 ? t('auth.common.countdown', { seconds: countdown }) : t('auth.common.sendCode') }}
                </button>
              </div>
            </div>

            <!-- 协议 -->
            <label class="md3-body-m flex items-start gap-3 rounded-[var(--md-shape-md)] bg-[color:var(--md-sys-color-surface-container)] px-4 py-3 leading-6 text-[color:var(--md-sys-color-on-surface-variant)]">
              <input v-model="agreed" type="checkbox" class="mt-1 h-4 w-4 shrink-0 accent-[var(--md-sys-color-primary)]" />
              <span>
                {{ t('auth.register.agreementPrefix') }}
                <RouterLink to="/privacy" target="_blank" rel="noopener noreferrer" class="font-medium text-[color:var(--md-sys-color-primary)]">{{ t('footer.privacy') }}</RouterLink>
                {{ t('auth.register.agreementAnd') }}
                <RouterLink to="/terms" target="_blank" rel="noopener noreferrer" class="font-medium text-[color:var(--md-sys-color-primary)]">{{ t('footer.terms') }}</RouterLink>
              </span>
            </label>

            <div v-if="error" class="md3-banner md3-banner-error"><AlertCircle /> <span>{{ error }}</span></div>

            <button type="submit" :disabled="userAuthStore.loading || !agreed" class="md3-btn md3-btn-filled md3-btn-lg md3-btn-block">
              <UserPlus v-if="!userAuthStore.loading" />
              {{ userAuthStore.loading ? t('auth.register.creating') : t('auth.register.create') }}
            </button>
          </form>
        </template>
      </div>

      <div class="mt-4 text-center">
        <RouterLink to="/auth/login" class="md3-btn md3-btn-text md3-btn-sm">{{ t('auth.register.hasAccount') }}</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlertCircle, ArrowLeft, Mail, Lock, ShieldCheck, Eye, EyeOff, UserPlus } from 'lucide-vue-next'
import ImageCaptcha from '../../../components/captcha/ImageCaptcha.vue'
import TurnstileCaptcha from '../../../components/captcha/TurnstileCaptcha.vue'
import { useRegister } from '../../../composables/useRegister'

const { t } = useI18n()

const {
  userAuthStore, brandSiteName,
  email, emailLocalPart, selectedEmailDomain, password, showPassword, code, agreed,
  passwordStrength, error, sending, countdown,
  captchaPayload, turnstileToken, imageCaptchaRef, turnstileRef,
  captchaProvider, sendCodeCaptchaEnabled, turnstileSiteKey,
  registrationEnabled, emailVerificationEnabled,
  emailDomainAllowlistEnabled, allowedEmailDomains, allowedEmailDomainsText, emailDomainSelectionRequired,
  touchRegistrationEmail, formValidation, handleCaptchaConfigStale, handleSendCode, handleRegister,
} = useRegister()

const strengthLevel = computed(() => (passwordStrength.value === 'strong' ? 3 : passwordStrength.value === 'medium' ? 2 : 1))
const strengthColor = computed(() => {
  if (passwordStrength.value === 'strong') return 'bg-[color:var(--md-ext-success)]'
  if (passwordStrength.value === 'medium') return 'bg-[color:var(--md-ext-warning)]'
  return 'bg-[color:var(--md-sys-color-error)]'
})
const strengthBar = (idx: number) => (idx <= strengthLevel.value ? strengthColor.value : 'bg-[color:var(--md-sys-color-surface-container-highest)]')
const strengthText = computed(() => {
  if (passwordStrength.value === 'strong') return 'text-[color:var(--md-ext-success)]'
  if (passwordStrength.value === 'medium') return 'text-[color:var(--md-ext-warning)]'
  return 'text-[color:var(--md-sys-color-error)]'
})

// imageCaptchaRef / turnstileRef 仅通过字符串模板 ref 绑定，显式标记避免 noUnusedLocals 误报。
void imageCaptchaRef
void turnstileRef
</script>
