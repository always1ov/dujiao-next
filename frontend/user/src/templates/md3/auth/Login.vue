<template>
  <div class="flex min-h-[70vh] items-center justify-center px-4 py-10">
    <div class="w-full max-w-[460px]">
      <div class="mb-3 flex items-center justify-between">
        <RouterLink to="/" class="md3-btn md3-btn-text md3-btn-sm -ml-3"><ArrowLeft /> {{ t('auth.login.backHome') }}</RouterLink>
        <span class="md3-badge md3-badge-neutral">{{ t('navbar.personalCenter') }}</span>
      </div>

      <div class="md3-card p-6 sm:p-8">
        <div class="mb-6 text-center">
          <p class="md3-label-l text-[color:var(--md-sys-color-primary)]">{{ brandSiteName }}</p>
          <h1 class="md3-headline-s mt-2">{{ step === 'totp' ? t('auth.login.totp.title') : t('auth.login.title') }}</h1>
          <p class="md3-body-m mt-2 text-[color:var(--md-sys-color-on-surface-variant)]">{{ step === 'totp' ? t('auth.login.totp.subtitle') : t('auth.login.subtitle') }}</p>
        </div>

        <!-- 2FA -->
        <form v-if="step === 'totp'" class="grid gap-4" @submit.prevent="handleVerify2FA">
          <div class="md3-body-s rounded-[var(--md-shape-md)] bg-[color:var(--md-sys-color-surface-container)] px-4 py-2 text-center text-[color:var(--md-sys-color-on-surface-variant)]">
            {{ t('auth.login.totp.countdown', { seconds: challengeRemainingSeconds }) }}
          </div>

          <div v-if="totpMode === 'code'">
            <label class="md3-field-label" for="md3-totp-code">{{ t('auth.login.totp.codeLabel') }}</label>
            <input id="md3-totp-code" v-model="totpCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" class="md3-input text-center tracking-[0.4em]" :placeholder="t('auth.login.totp.codePlaceholder')" />
          </div>
          <div v-else>
            <label class="md3-field-label" for="md3-recovery-code">{{ t('auth.login.totp.recoveryLabel') }}</label>
            <input id="md3-recovery-code" v-model="recoveryCode" autocomplete="off" class="md3-input" :placeholder="t('auth.login.totp.recoveryPlaceholder')" />
          </div>

          <div class="text-center">
            <button type="button" class="md3-btn md3-btn-text md3-btn-sm" @click="totpMode = totpMode === 'code' ? 'recovery' : 'code'">
              {{ totpMode === 'code' ? t('auth.login.totp.useRecovery') : t('auth.login.totp.useCode') }}
            </button>
          </div>

          <div v-if="error" class="md3-banner md3-banner-error"><AlertCircle /> <span>{{ error }}</span></div>

          <button type="submit" :disabled="userAuthStore.loading" class="md3-btn md3-btn-filled md3-btn-lg md3-btn-block">
            {{ userAuthStore.loading ? t('auth.login.totp.verifying') : t('auth.login.totp.submit') }}
          </button>

          <div class="text-center">
            <button type="button" class="md3-btn md3-btn-text md3-btn-sm" @click="cancel2FA">{{ t('auth.login.totp.cancel') }}</button>
          </div>
        </form>

        <!-- 密码登录 -->
        <form v-else class="grid gap-4" @submit.prevent="handleLogin">
          <div>
            <label class="md3-field-label flex items-center gap-1.5" for="md3-login-email"><Mail class="h-3.5 w-3.5" aria-hidden="true" /> {{ t('auth.login.emailLabel') }}</label>
            <input
              id="md3-login-email"
              v-model="email"
              type="email"
              required
              class="md3-input"
              :class="{ 'md3-input-error': formValidation.getError('email') }"
              :aria-invalid="!!formValidation.getError('email')"
              :placeholder="t('auth.login.emailPlaceholder')"
              @blur="formValidation.touchField('email', email)"
            />
            <p v-if="formValidation.getError('email')" class="md3-field-support md3-field-support-error">{{ formValidation.getError('email') }}</p>
          </div>

          <div>
            <label class="md3-field-label flex items-center gap-1.5" for="md3-login-password"><Lock class="h-3.5 w-3.5" aria-hidden="true" /> {{ t('auth.login.passwordLabel') }}</label>
            <div class="relative">
              <input
                id="md3-login-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="md3-input pr-12"
                :class="{ 'md3-input-error': formValidation.getError('password') }"
                :aria-invalid="!!formValidation.getError('password')"
                :placeholder="t('auth.login.passwordPlaceholder')"
                @blur="formValidation.touchField('password', password)"
              />
              <button type="button" class="md3-icon-btn absolute right-1.5 top-1/2 -translate-y-1/2" :aria-label="showPassword ? t('auth.common.hidePassword') : t('auth.common.showPassword')" @click="showPassword = !showPassword">
                <EyeOff v-if="showPassword" aria-hidden="true" /><Eye v-else aria-hidden="true" />
              </button>
            </div>
            <p v-if="formValidation.getError('password')" class="md3-field-support md3-field-support-error">{{ formValidation.getError('password') }}</p>
          </div>

          <div v-if="loginCaptchaEnabled">
            <label class="md3-field-label flex items-center gap-1.5"><ShieldCheck class="h-3.5 w-3.5" /> {{ t('auth.common.captchaLabel') }}</label>
            <ImageCaptcha v-if="captchaProvider === 'image'" ref="imageCaptchaRef" v-model="captchaPayload" :disabled="userAuthStore.loading" @config-stale="handleCaptchaConfigStale" />
            <TurnstileCaptcha v-else-if="captchaProvider === 'turnstile'" ref="turnstileRef" v-model="turnstileToken" :site-key="turnstileSiteKey" />
          </div>

          <div class="md3-body-s flex flex-wrap items-center justify-between gap-2 text-[color:var(--md-sys-color-on-surface-variant)]">
            <label class="inline-flex items-center gap-2">
              <input v-model="rememberMe" type="checkbox" class="h-4 w-4 accent-[var(--md-sys-color-primary)]" />
              {{ t('auth.login.rememberMe') }}
            </label>
            <RouterLink v-if="emailVerificationEnabled" to="/auth/forgot" class="md3-label-l text-[color:var(--md-sys-color-primary)]">{{ t('auth.login.forgot') }}</RouterLink>
          </div>

          <div v-if="info" class="md3-banner md3-banner-success"><CheckCircle2 /> <span>{{ info }}</span></div>
          <div v-if="error" class="md3-banner md3-banner-error"><AlertCircle /> <span>{{ error }}</span></div>

          <button type="submit" :disabled="userAuthStore.loading" class="md3-btn md3-btn-filled md3-btn-lg md3-btn-block">
            <LogIn v-if="!userAuthStore.loading" />
            {{ userAuthStore.loading ? t('auth.login.submitting') : t('auth.login.submit') }}
          </button>

          <!-- 第三方登录 -->
          <div v-if="showThirdPartyLogin" class="grid gap-4 pt-1">
            <div class="md3-label-m flex items-center gap-3 text-[color:var(--md-sys-color-on-surface-variant)]">
              <span class="md3-divider flex-1"></span><span>{{ t('auth.login.socialOr') }}</span><span class="md3-divider flex-1"></span>
            </div>
            <div class="grid gap-3">
              <div v-if="showTelegramWidget" class="grid gap-2">
                <div ref="telegramWidgetRef" class="flex justify-center"></div>
                <p class="md3-body-s text-center text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('auth.login.telegramHint') }}</p>
              </div>
              <div v-else-if="showTelegramOidc" class="grid gap-2">
                <button type="button" class="md3-btn md3-btn-outlined md3-btn-lg md3-btn-block" @click="startTelegramOidc">{{ t('auth.login.telegramOidcButton') }}</button>
                <p class="md3-body-s text-center text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('auth.login.telegramOidcHint') }}</p>
              </div>
              <div v-else-if="showMiniAppLoginHint" class="grid gap-2">
                <p class="md3-body-s text-center text-[color:var(--md-sys-color-on-surface-variant)]">{{ attemptingMiniAppLogin ? t('auth.login.telegramMiniAppLoggingIn') : t('auth.login.telegramMiniAppHint') }}</p>
              </div>
              <div v-if="showGoogleLogin" class="grid gap-2">
                <GoogleIdentityButton
                  :client-id="googleClientID"
                  :locale="googleButtonLocale"
                  shape="pill"
                  :ux-mode="googleIdentityUXMode"
                  :login-uri="googleRedirectLoginURI"
                  :prepare-redirect="prepareGoogleRedirectLogin"
                  :disabled="userAuthStore.loading"
                  :loading-label="t('auth.login.googleLoading')"
                  @credential="handleGoogleCredential"
                  @error="handleGoogleScriptError"
                />
                <p class="md3-body-s text-center text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('auth.login.googleHint') }}</p>
              </div>
            </div>
          </div>
          <div v-if="showTelegramMiniAppEntry" class="grid gap-2 pt-1">
            <p class="md3-body-s text-center text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('auth.login.telegramMiniAppEntryHint') }}</p>
            <button type="button" class="md3-btn md3-btn-outlined md3-btn-lg md3-btn-block" @click="openTelegramMiniAppEntry">{{ t('auth.login.telegramMiniAppEntryAction') }}</button>
          </div>
        </form>
      </div>

      <div v-if="registrationEnabled" class="mt-4 text-center">
        <RouterLink to="/auth/register" class="md3-btn md3-btn-text md3-btn-sm">{{ t('auth.login.noAccount') }}</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AlertCircle, ArrowLeft, CheckCircle2, Mail, Lock, ShieldCheck, Eye, EyeOff, LogIn } from 'lucide-vue-next'
import ImageCaptcha from '../../../components/captcha/ImageCaptcha.vue'
import TurnstileCaptcha from '../../../components/captcha/TurnstileCaptcha.vue'
import GoogleIdentityButton from '../../../components/auth/GoogleIdentityButton.vue'
import { useLogin } from '../../../composables/useLogin'

const { t } = useI18n()

const {
  userAuthStore, brandSiteName,
  email, password, showPassword, rememberMe,
  step, totpMode, totpCode, recoveryCode, challengeRemainingSeconds, handleVerify2FA, cancel2FA,
  error, info, formValidation,
  loginCaptchaEnabled, captchaProvider, captchaPayload, turnstileToken, turnstileSiteKey,
  imageCaptchaRef, turnstileRef, handleCaptchaConfigStale,
  registrationEnabled, emailVerificationEnabled,
  showTelegramWidget, telegramWidgetRef, showTelegramOidc, startTelegramOidc,
  showMiniAppLoginHint, attemptingMiniAppLogin, showTelegramMiniAppEntry, openTelegramMiniAppEntry,
  googleClientID, googleButtonLocale, googleIdentityUXMode, googleRedirectLoginURI,
  prepareGoogleRedirectLogin, showGoogleLogin, showThirdPartyLogin,
  handleGoogleCredential, handleGoogleScriptError,
  handleLogin,
} = useLogin()

// 以下三个引用仅通过模板字符串 ref 绑定（相关逻辑在 composable 内），显式标记避免 noUnusedLocals 误报。
void imageCaptchaRef
void turnstileRef
void telegramWidgetRef
</script>
