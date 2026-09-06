<template>
  <div class="md3-container pb-8">
    <header class="pb-4 pt-5 sm:pt-6">
      <RouterLink :to="isBuyNowMode ? '/' : '/cart'" class="md3-btn md3-btn-text md3-btn-sm -ml-3"><ArrowLeft /> {{ isBuyNowMode ? t('nav.home') : t('cart.title') }}</RouterLink>
      <h1 class="md3-page-title mt-1">{{ t('checkout.title') }}</h1>
      <p class="md3-body-m mt-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('checkout.subtitle') }}</p>
    </header>

    <Md3CheckoutSteps current="checkout" :skip-cart="isBuyNowMode" />

    <Md3Empty v-if="cartItems.length === 0" :icon="ShoppingCart" :message="t('checkout.empty')">
      <RouterLink to="/products" class="md3-btn md3-btn-filled md3-btn-sm">{{ t('checkout.emptyAction') }}</RouterLink>
    </Md3Empty>

    <div v-else class="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
      <div class="grid gap-4">
        <!-- 商品确认 -->
        <section class="md3-card-outlined p-5">
          <h2 class="md3-title-m mb-3.5">{{ t('checkout.itemsTitle') }}</h2>
          <div class="grid gap-3">
            <div
              v-for="item in cartItems"
              :key="cartItemKey(item)"
              class="flex gap-3.5 rounded-[var(--md-shape-md)] p-3.5"
              :class="itemStockExceeded(item) ? 'bg-[color:var(--md-ext-warning-container)] text-[color:var(--md-ext-on-warning-container)]' : 'bg-[color:var(--md-sys-color-surface-container-low)]'"
            >
              <div class="relative grid h-16 w-16 flex-none place-items-center overflow-hidden rounded-[var(--md-shape-sm)] bg-[color:var(--md-sys-color-surface-container-high)]">
                <img v-if="checkoutItemImage(item)" :src="checkoutItemImage(item)" :alt="getLocalizedText(item.title)" loading="lazy" class="absolute inset-0 h-full w-full object-cover" />
                <Package v-else class="h-7 w-7 text-[color:var(--md-sys-color-on-surface-variant)]" />
              </div>
              <div class="min-w-0 flex-1">
                <RouterLink :to="`/products/${item.slug}`" class="md3-title-s block hover:text-[color:var(--md-sys-color-primary)]">{{ getLocalizedText(item.title) }}</RouterLink>
                <div class="md3-body-s mt-0.5 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('checkout.quantityLabel') }}：{{ item.quantity }}</div>
                <div v-if="itemSkuDisplay(item)" class="md3-body-s mt-0.5 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('checkout.skuLabel') }}：{{ itemSkuDisplay(item) }}</div>
                <div v-if="itemStockHint(item)" class="md3-body-s mt-0.5" :class="itemStockExceeded(item) ? 'font-medium' : 'text-[color:var(--md-sys-color-on-surface-variant)]'">{{ itemStockHint(item) }}</div>
              </div>
              <div class="flex-none text-right">
                <span class="inline-flex items-baseline font-medium" :class="checkoutItemHasPriceDiscount(item) ? 'text-[color:var(--md-sys-color-primary)]' : ''">
                  <b class="text-[19px] font-medium">{{ checkoutItemPriceParts(item).integer }}</b><small class="text-xs font-medium">{{ checkoutItemPriceParts(item).decimal }}</small><em class="ml-0.5 text-[11px] font-medium not-italic">{{ checkoutItemCurrency }}</em>
                </span>
                <span v-if="checkoutItemHasPriceDiscount(item)" class="md3-body-s mt-0.5 block text-[color:var(--md-sys-color-outline)] line-through">
                  {{ checkoutItemOriginalPriceParts(item).integer }}{{ checkoutItemOriginalPriceParts(item).decimal }} {{ checkoutItemCurrency }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- 自定义表单（复用） -->
        <CheckoutManualForm
          v-if="manualFormProducts.length"
          :manual-form-products="manualFormProducts"
          v-model="manualFormData"
          :submit-attempted="submitAttempted"
          :get-manual-field-label="getManualFieldLabel"
          :get-manual-field-placeholder="getManualFieldPlaceholder"
          :manual-field-error="manualFieldError"
        />

        <!-- 优惠码 -->
        <section v-if="!isResellerTenant" class="md3-card-outlined p-5">
          <h2 class="md3-title-m mb-3.5">{{ t('checkout.couponTitle') }}</h2>
          <input v-model="couponCode" type="text" class="md3-input md3-input-sm" :placeholder="t('checkout.couponPlaceholder')" />
        </section>

        <!-- 下单方式 -->
        <section v-if="!userAuthStore.isAuthenticated" class="md3-card-outlined p-5">
          <h2 class="md3-title-m mb-3.5">{{ t('checkout.modeTitle') }}</h2>
          <div class="mb-3.5 flex flex-wrap gap-2">
            <button type="button" class="md3-chip" :class="{ 'md3-chip-selected': checkoutMode === 'guest' }" @click="checkoutMode = 'guest'">
              <Check v-if="checkoutMode === 'guest'" /> {{ t('checkout.guestPurchase') }}
            </button>
            <RouterLink to="/auth/login" class="md3-chip">{{ t('checkout.memberPurchase') }}</RouterLink>
          </div>

          <template v-if="checkoutMode === 'guest'">
            <div class="grid gap-3 sm:grid-cols-2">
              <input v-model="guestEmail" type="email" class="md3-input md3-input-sm" :class="{ 'md3-input-error': guestEmail && !guestEmailValid }" :placeholder="t('checkout.guestEmailPlaceholder')" />
              <input v-model="guestPassword" type="password" class="md3-input md3-input-sm" :placeholder="t('checkout.guestPasswordPlaceholder')" />
            </div>
            <p v-if="guestEmail && !guestEmailValid" class="md3-field-support md3-field-support-error">{{ t('error.email_invalid') }}</p>

            <div v-if="guestCaptchaEnabled" class="mt-3.5">
              <p class="md3-field-label">{{ t('auth.common.captchaLabel') }}</p>
              <ImageCaptcha
                v-if="captchaProvider === 'image'"
                ref="guestImageCaptchaRef"
                v-model="guestCaptchaPayload"
                :disabled="submitting"
                @config-stale="handleGuestCaptchaConfigStale"
              />
              <TurnstileCaptcha
                v-else-if="captchaProvider === 'turnstile'"
                ref="guestTurnstileRef"
                v-model="guestTurnstileToken"
                :site-key="guestTurnstileSiteKey"
              />
            </div>

            <div class="md3-banner md3-banner-info mt-3.5 flex-col gap-1.5">
              <p class="md3-label-l">{{ t('checkout.guestInstructions.title') }}</p>
              <ul class="md3-body-s grid list-disc gap-0.5 pl-4">
                <li>{{ t('checkout.guestInstructions.email') }}</li>
                <li>{{ t('checkout.guestInstructions.password') }}</li>
              </ul>
            </div>
          </template>
        </section>
      </div>

      <!-- 右栏：汇总 + 支付 -->
      <aside class="md3-card sticky top-[80px] p-5">
        <h2 class="md3-title-m mb-2">{{ t('checkout.submitTitle') }}</h2>
        <p class="md3-body-s mb-4 rounded-[var(--md-shape-sm)] bg-[color:var(--md-sys-color-surface-container)] px-3 py-2.5 leading-relaxed text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('checkout.submitHint') }}</p>

        <div class="grid gap-2.5">
          <div class="md3-kv"><span>{{ t('cart.itemsCount') }}</span><span>{{ totalItems }}</span></div>
          <div class="md3-kv"><span>{{ t('checkout.previewOriginal') }}</span><span>{{ formatPrice(previewOriginal, previewCurrency) }}</span></div>
          <template v-if="!isResellerTenant">
            <div class="md3-kv"><span>{{ t('checkout.previewCoupon') }}</span><span :class="hasPositiveAmount(previewCoupon) ? '!text-[color:var(--md-sys-color-primary)]' : ''">{{ formatDiscountPrice(previewCoupon, previewCurrency) }}</span></div>
            <div class="md3-kv"><span>{{ t('checkout.previewPromotion') }}</span><span :class="hasPositiveAmount(previewPromotion) ? '!text-[color:var(--md-sys-color-primary)]' : ''">{{ formatDiscountPrice(previewPromotion, previewCurrency) }}</span></div>
            <div class="md3-kv"><span>{{ t('checkout.previewWholesale') }}</span><span :class="hasPositiveAmount(previewWholesale) ? '!text-[color:var(--md-ext-success)]' : ''">{{ formatDiscountPrice(previewWholesale, previewCurrency) }}</span></div>
          </template>
          <div v-if="Number(previewMemberDiscount) > 0" class="md3-kv"><span>{{ t('checkout.previewMemberDiscount') }}</span><span class="!text-[color:var(--md-sys-color-tertiary)]">-{{ formatPrice(previewMemberDiscount, previewCurrency) }}</span></div>
          <div class="mt-1 flex items-center justify-between border-t border-[color:var(--md-sys-color-outline-variant)] pt-3">
            <span class="md3-title-s">{{ t('checkout.previewTotal') }}</span>
            <span class="md3-headline-s font-medium tabular-nums text-[color:var(--md-sys-color-primary)]">{{ formatPrice(previewTotal, previewCurrency) }}</span>
          </div>
        </div>

        <div v-if="previewLoading || couponRefreshing" class="md3-body-s mt-3 text-[color:var(--md-sys-color-on-surface-variant)]">{{ previewStatusText }}</div>
        <div v-if="checkoutAlert" class="md3-banner mt-3.5" :class="checkoutAlert.level === 'error' ? 'md3-banner-error' : 'md3-banner-warning'">
          <component :is="checkoutAlert.level === 'error' ? AlertCircle : AlertTriangle" /> <span>{{ checkoutAlert.message }}</span>
        </div>

        <!-- 支付方式 -->
        <div class="my-4 border-t border-[color:var(--md-sys-color-outline-variant)] pt-4">
          <h3 class="md3-title-s mb-3">{{ t('checkout.paymentMethod') }}</h3>

          <div v-if="showBalanceOption" class="mb-3 rounded-[var(--md-shape-md)] bg-[color:var(--md-sys-color-surface-container)] p-3.5">
            <div class="flex items-start justify-between gap-2.5">
              <div>
                <div class="md3-tile-label">{{ t('payment.walletBalanceLabel') }}</div>
                <div class="md3-tile-value">{{ walletLoading ? t('common.loading') : formatPrice(walletBalance, previewCurrency) }}</div>
              </div>
              <label class="md3-body-s inline-flex items-center gap-1.5 text-[color:var(--md-sys-color-on-surface-variant)]">
                <input v-model="useBalance" type="checkbox" class="h-4 w-4 accent-[var(--md-sys-color-primary)]" :disabled="walletOnlyPayment" />
                <span>{{ t('payment.useBalance') }}</span>
              </label>
            </div>
            <div v-if="walletOnlyPayment" class="md3-body-s mt-2 text-[color:var(--md-ext-warning)]">{{ t('payment.walletOnlyHint') }}</div>
            <div v-if="useBalance" class="md3-body-s mt-2.5 grid gap-0.5 text-[color:var(--md-sys-color-on-surface-variant)]">
              <div>{{ t('payment.walletDeductLabel') }}：{{ expectedWalletPaidDisplay }}</div>
              <div v-if="!walletOnlyPayment">{{ t('payment.onlinePayLabel') }}：{{ expectedOnlinePayDisplay }}</div>
              <div v-if="walletOnlyPayment && expectedOnlinePayCents > 0" class="text-[color:var(--md-ext-warning)]">{{ t('payment.walletInsufficientHint') }}</div>
            </div>
          </div>

          <template v-if="!walletOnlyPayment">
            <div v-if="requiresOnlineChannel && paymentChannels.length > 0" class="grid gap-2.5 sm:grid-cols-2">
              <button
                v-for="channel in paymentChannels"
                :key="channel.id"
                type="button"
                class="md3-state rounded-[var(--md-shape-md)] border p-3 text-left transition-colors"
                :class="[
                  selectedChannelId === channel.id && !isChannelDisabledForAmount(channel)
                    ? 'border-[color:var(--md-sys-color-primary)] bg-[color:var(--md-sys-color-primary-container)] text-[color:var(--md-sys-color-on-primary-container)]'
                    : 'border-[color:var(--md-sys-color-outline-variant)]',
                  isChannelDisabledForAmount(channel) ? 'cursor-not-allowed opacity-50' : '',
                ]"
                :disabled="isChannelDisabledForAmount(channel)"
                :title="isChannelDisabledForAmount(channel) ? channelAmountLimitHint(channel) : ''"
                @click="handleSelectChannel(channel)"
              >
                <div class="flex items-center gap-2">
                  <img v-if="channel.icon" :src="getImageUrl(channel.icon)" loading="lazy" class="h-5 w-5 flex-none rounded-[4px] object-contain" />
                  <span class="md3-label-l truncate">{{ channel.name }}</span>
                  <Check v-if="selectedChannelId === channel.id && !isChannelDisabledForAmount(channel)" class="ml-auto h-4 w-4 flex-none" />
                </div>
                <div v-if="channel.fee_policy === 'customer_surcharge'" class="md3-body-s mt-1.5 grid gap-0.5 opacity-90">
                  <div>{{ t('payment.feeLabel') }}：{{ formatChannelFeeRate(channel) }}</div>
                  <div>{{ t('payment.fixedFeeLabel') }}：{{ formatChannelFixedFee(channel) }}</div>
                </div>
                <div v-if="isChannelDisabledForAmount(channel)" class="md3-body-s mt-1 text-[color:var(--md-ext-warning)]">{{ channelAmountLimitHint(channel) }}</div>
              </button>
            </div>
            <div v-else-if="requiresOnlineChannel && paymentChannels.length === 0" class="md3-body-s text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('checkout.noPaymentChannels') }}</div>
          </template>
          <div v-if="!requiresOnlineChannel" class="md3-body-s text-[color:var(--md-ext-success)]">{{ t('checkout.walletCoversAll') }}</div>
        </div>

        <button type="button" class="md3-btn md3-btn-filled md3-btn-lg md3-btn-block" :disabled="!canSubmit" @click="handleSubmit">
          {{ submitting ? t('checkout.submitting') : t('checkout.submitButton') }}
        </button>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AlertCircle, AlertTriangle, ArrowLeft, Check, Package, ShoppingCart } from 'lucide-vue-next'
import ImageCaptcha from '../../components/captcha/ImageCaptcha.vue'
import TurnstileCaptcha from '../../components/captcha/TurnstileCaptcha.vue'
import CheckoutManualForm from '../../components/checkout/CheckoutManualForm.vue'
import Md3CheckoutSteps from './components/Md3CheckoutSteps.vue'
import Md3Empty from './components/Md3Empty.vue'
import { useCheckout } from '../../composables/useCheckout'

const { t } = useI18n()

const {
  userAuthStore, getLocalizedText, formatPrice, getImageUrl,
  isBuyNowMode, cartItems, totalItems, cartItemKey, checkoutItemImage, itemSkuDisplay,
  itemStockExceeded, itemStockHint,
  checkoutItemCurrency, checkoutItemPriceParts, checkoutItemOriginalPriceParts, checkoutItemHasPriceDiscount,
  manualFormProducts, manualFormData, submitAttempted, getManualFieldLabel, getManualFieldPlaceholder, manualFieldError,
  couponCode, isResellerTenant,
  checkoutMode, guestEmail, guestPassword, guestEmailValid,
  guestCaptchaEnabled, captchaProvider, guestCaptchaPayload, guestTurnstileToken, guestTurnstileSiteKey,
  guestImageCaptchaRef, guestTurnstileRef, handleGuestCaptchaConfigStale,
  previewCurrency, previewOriginal, previewCoupon, previewPromotion, previewWholesale, previewMemberDiscount, previewTotal,
  previewLoading, couponRefreshing, previewStatusText, hasPositiveAmount, formatDiscountPrice, checkoutAlert,
  showBalanceOption, walletLoading, walletBalance, useBalance, walletOnlyPayment,
  expectedWalletPaidDisplay, expectedOnlinePayDisplay, expectedOnlinePayCents,
  requiresOnlineChannel, paymentChannels, selectedChannelId, isChannelDisabledForAmount, channelAmountLimitHint,
  handleSelectChannel, formatChannelFeeRate, formatChannelFixedFee,
  submitting, canSubmit, handleSubmit,
} = useCheckout()

// 字符串模板 ref，逻辑在 composable 内，显式标记避免 noUnusedLocals 误报。
void guestImageCaptchaRef
void guestTurnstileRef
</script>
