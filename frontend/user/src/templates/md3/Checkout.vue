<template>
  <div class="md3-container pb-8 pt-4">
    <nav class="md3-crumbs" :aria-label="t('nav.home')" data-test="crumbs">
      <RouterLink to="/">{{ t('nav.home') }}</RouterLink>
      <ChevronRight />
      <RouterLink v-if="!isBuyNowMode" to="/cart">{{ t('cart.title') }}</RouterLink>
      <ChevronRight v-if="!isBuyNowMode" />
      <span class="is-current">{{ t('checkout.title') }}</span>
    </nav>

    <div class="mt-3 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="md3-title-l">{{ t('checkout.title') }}</h1>
        <p class="md3-body-s text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('checkout.subtitle') }}</p>
      </div>
      <Md3CheckoutSteps current="checkout" :skip-cart="isBuyNowMode" class="!mb-0" />
    </div>

    <Md3Empty v-if="cartItems.length === 0" :icon="ShoppingCart" :message="t('checkout.empty')">
      <RouterLink to="/products" class="md3-btn md3-btn-filled md3-btn-sm" data-test="checkout-empty-action">{{ t('checkout.emptyAction') }}</RouterLink>
    </Md3Empty>

    <div v-else class="mt-4 grid items-start gap-5 lg:grid-cols-[1fr_360px]">
      <div class="grid min-w-0 gap-4">
        <!-- 1. 商品清单 -->
        <section class="md3-panel" data-test="checkout-items">
          <div class="md3-panel-title">
            <span>{{ t('md3.checkout.orderItems') }} <span class="md3-badge md3-badge-neutral ml-1">{{ t('md3.checkout.itemsCount', { n: totalItems }) }}</span></span>
          </div>
          <div class="grid gap-px">
            <div
              v-for="item in cartItems"
              :key="cartItemKey(item)"
              class="flex gap-3 px-4 py-3"
              :class="itemStockExceeded(item) ? 'bg-[color:var(--md-ext-warning-container)] text-[color:var(--md-ext-on-warning-container)]' : ''"
            >
              <div class="relative grid h-14 w-14 flex-none place-items-center overflow-hidden rounded-[var(--md-shape-sm)] bg-[color:var(--md-sys-color-surface-container-high)]">
                <img v-if="checkoutItemImage(item)" :src="checkoutItemImage(item)" :alt="getLocalizedText(item.title)" loading="lazy" class="absolute inset-0 h-full w-full object-cover" />
                <Package v-else class="h-6 w-6 text-[color:var(--md-sys-color-on-surface-variant)]" />
              </div>
              <div class="min-w-0 flex-1">
                <RouterLink :to="`/products/${item.slug}`" class="md3-body-m block truncate font-medium hover:text-[color:var(--md-sys-color-primary)]">{{ getLocalizedText(item.title) }}</RouterLink>
                <div class="md3-body-s mt-0.5 text-[color:var(--md-sys-color-on-surface-variant)]">
                  × {{ item.quantity }}<template v-if="itemSkuDisplay(item)"> · {{ itemSkuDisplay(item) }}</template>
                </div>
                <div v-if="itemStockHint(item)" class="md3-body-s mt-0.5" :class="itemStockExceeded(item) ? 'font-medium' : 'text-[color:var(--md-sys-color-on-surface-variant)]'">{{ itemStockHint(item) }}</div>
              </div>
              <div class="flex-none text-right">
                <span class="md3-label-l block tabular-nums" :class="checkoutItemHasPriceDiscount(item) ? 'md3-price' : ''">{{ checkoutItemPriceParts(item).integer }}{{ checkoutItemPriceParts(item).decimal }} {{ checkoutItemCurrency }}</span>
                <span v-if="checkoutItemHasPriceDiscount(item)" class="md3-price-strike block">{{ checkoutItemOriginalPriceParts(item).integer }}{{ checkoutItemOriginalPriceParts(item).decimal }} {{ checkoutItemCurrency }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 2. 自定义表单（复用） -->
        <CheckoutManualForm
          v-if="manualFormProducts.length"
          :manual-form-products="manualFormProducts"
          v-model="manualFormData"
          :submit-attempted="submitAttempted"
          :get-manual-field-label="getManualFieldLabel"
          :get-manual-field-placeholder="getManualFieldPlaceholder"
          :manual-field-error="manualFieldError"
        />

        <!-- 3. 联系方式与下单方式（未登录） -->
        <section v-if="!userAuthStore.isAuthenticated" class="md3-panel" data-test="checkout-contact">
          <div class="md3-panel-title">
            {{ t('md3.checkout.contactTitle') }}
            <div class="flex gap-2">
              <button type="button" class="md3-chip md3-chip-sm" :class="{ 'md3-chip-selected': checkoutMode === 'guest' }" data-test="mode-guest" @click="checkoutMode = 'guest'">
                <Check v-if="checkoutMode === 'guest'" /> {{ t('checkout.guestPurchase') }}
              </button>
              <RouterLink v-if="personalCenterEnabled" to="/auth/login" class="md3-chip md3-chip-sm" data-test="mode-member">{{ t('checkout.memberPurchase') }}</RouterLink>
            </div>
          </div>
          <div v-if="checkoutMode === 'guest'" class="p-4">
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <input v-model="guestEmail" type="email" autocomplete="email" class="md3-input md3-input-sm" :class="{ 'md3-input-error': guestEmail && !guestEmailValid }" :placeholder="t('checkout.guestEmailPlaceholder')" data-test="guest-email" />
                <p v-if="guestEmail && !guestEmailValid" class="md3-field-support md3-field-support-error">{{ t('error.email_invalid') }}</p>
              </div>
              <input v-model="guestPassword" type="password" autocomplete="new-password" class="md3-input md3-input-sm" :placeholder="t('checkout.guestPasswordPlaceholder')" data-test="guest-password" />
            </div>
            <div v-if="guestCaptchaEnabled" class="mt-3.5">
              <p class="md3-field-label">{{ t('auth.common.captchaLabel') }}</p>
              <ImageCaptcha v-if="captchaProvider === 'image'" ref="guestImageCaptchaRef" v-model="guestCaptchaPayload" :disabled="submitting" @config-stale="handleGuestCaptchaConfigStale" />
              <TurnstileCaptcha v-else-if="captchaProvider === 'turnstile'" ref="guestTurnstileRef" v-model="guestTurnstileToken" :site-key="guestTurnstileSiteKey" />
            </div>
            <ul class="md3-body-s mt-3.5 grid list-disc gap-1 pl-4 text-[color:var(--md-sys-color-on-surface-variant)]">
              <li>{{ t('checkout.guestInstructions.email') }}</li>
              <li>{{ t('checkout.guestInstructions.password') }}</li>
            </ul>
          </div>
        </section>

        <!-- 4. 优惠码 -->
        <section v-if="!isResellerTenant" class="md3-panel" data-test="checkout-coupon">
          <div class="md3-panel-title">{{ t('checkout.couponTitle') }}</div>
          <div class="p-4"><input v-model="couponCode" type="text" class="md3-input md3-input-sm" :placeholder="t('checkout.couponPlaceholder')" data-test="coupon-input" /></div>
        </section>

        <!-- 5. 支付方式：单选行 -->
        <section class="md3-panel" data-test="checkout-payment">
          <div class="md3-panel-title">{{ t('md3.checkout.payTitle') }}</div>
          <div class="p-4">
            <div v-if="showBalanceOption" class="mb-3 rounded-[var(--md-shape-md)] bg-[color:var(--md-sys-color-surface-container)] p-3.5">
              <label class="flex items-center justify-between gap-3">
                <span>
                  <span class="md3-tile-label">{{ t('payment.walletBalanceLabel') }}</span>
                  <span class="md3-tile-value">{{ walletLoading ? t('common.loading') : formatPrice(walletBalance, previewCurrency) }}</span>
                </span>
                <span class="md3-body-s inline-flex items-center gap-1.5 text-[color:var(--md-sys-color-on-surface-variant)]">
                  <input v-model="useBalance" type="checkbox" class="h-4 w-4 accent-[var(--md-sys-color-primary)]" :disabled="walletOnlyPayment" />
                  {{ t('payment.useBalance') }}
                </span>
              </label>
              <div v-if="walletOnlyPayment" class="md3-body-s mt-2 text-[color:var(--md-ext-warning)]">{{ t('payment.walletOnlyHint') }}</div>
              <div v-if="useBalance" class="md3-body-s mt-2 grid gap-0.5 text-[color:var(--md-sys-color-on-surface-variant)]">
                <div>{{ t('payment.walletDeductLabel') }}：{{ expectedWalletPaidDisplay }}</div>
                <div v-if="!walletOnlyPayment">{{ t('payment.onlinePayLabel') }}：{{ expectedOnlinePayDisplay }}</div>
                <div v-if="walletOnlyPayment && expectedOnlinePayCents > 0" class="text-[color:var(--md-ext-warning)]">{{ t('payment.walletInsufficientHint') }}</div>
              </div>
            </div>

            <template v-if="!walletOnlyPayment">
              <div v-if="requiresOnlineChannel && paymentChannels.length > 0" class="grid gap-2 sm:grid-cols-2" role="radiogroup">
                <button
                  v-for="channel in paymentChannels"
                  :key="channel.id"
                  type="button"
                  role="radio"
                  class="md3-state flex items-center gap-3 rounded-[var(--md-shape-md)] border px-3.5 py-3 text-left transition-colors"
                  :class="[
                    selectedChannelId === channel.id && !isChannelDisabledForAmount(channel)
                      ? 'border-[color:var(--md-sys-color-primary)] bg-[color:var(--md-sys-color-primary-container)] text-[color:var(--md-sys-color-on-primary-container)]'
                      : 'border-[color:var(--md-sys-color-outline-variant)]',
                    isChannelDisabledForAmount(channel) ? 'cursor-not-allowed opacity-50' : '',
                  ]"
                  :aria-checked="selectedChannelId === channel.id"
                  :disabled="isChannelDisabledForAmount(channel)"
                  :title="isChannelDisabledForAmount(channel) ? channelAmountLimitHint(channel) : ''"
                  data-test="pay-channel"
                  @click="handleSelectChannel(channel)"
                >
                  <span class="grid h-5 w-5 flex-none place-items-center rounded-full border-2" :class="selectedChannelId === channel.id && !isChannelDisabledForAmount(channel) ? 'border-[color:var(--md-sys-color-primary)]' : 'border-[color:var(--md-sys-color-outline)]'">
                    <span v-if="selectedChannelId === channel.id && !isChannelDisabledForAmount(channel)" class="h-2.5 w-2.5 rounded-full bg-[color:var(--md-sys-color-primary)]"></span>
                  </span>
                  <img v-if="channel.icon" :src="getImageUrl(channel.icon)" loading="lazy" class="h-6 w-6 flex-none rounded-[4px] object-contain" />
                  <span class="min-w-0 flex-1">
                    <span class="md3-label-l block truncate">{{ channel.name }}</span>
                    <span v-if="channel.fee_policy === 'customer_surcharge'" class="md3-body-s block opacity-80">{{ t('payment.feeLabel') }} {{ formatChannelFeeRate(channel) }} · {{ t('payment.fixedFeeLabel') }} {{ formatChannelFixedFee(channel) }}</span>
                    <span v-if="isChannelDisabledForAmount(channel)" class="md3-body-s block text-[color:var(--md-ext-warning)]">{{ channelAmountLimitHint(channel) }}</span>
                  </span>
                </button>
              </div>
              <div v-else-if="requiresOnlineChannel && paymentChannels.length === 0" class="md3-body-s text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('checkout.noPaymentChannels') }}</div>
            </template>
            <div v-if="!requiresOnlineChannel" class="md3-body-s text-[color:var(--md-ext-success)]">{{ t('checkout.walletCoversAll') }}</div>
          </div>
        </section>
      </div>

      <!-- 右侧：金额摘要 + 提交（桌面吸顶） -->
      <aside class="md3-panel p-5 lg:sticky lg:top-[92px]" data-test="checkout-summary">
        <h2 class="md3-title-m">{{ t('md3.checkout.summaryTitle') }}</h2>
        <div class="mt-3 grid gap-2 border-b border-[color:var(--md-sys-color-outline-variant)] pb-3">
          <div class="md3-kv"><span>{{ t('checkout.previewOriginal') }}</span><span>{{ formatPrice(previewOriginal, previewCurrency) }}</span></div>
          <template v-if="!isResellerTenant">
            <div v-if="hasPositiveAmount(previewCoupon)" class="md3-kv"><span>{{ t('checkout.previewCoupon') }}</span><span class="!text-[color:var(--md-sys-color-primary)]">{{ formatDiscountPrice(previewCoupon, previewCurrency) }}</span></div>
            <div v-if="hasPositiveAmount(previewPromotion)" class="md3-kv"><span>{{ t('checkout.previewPromotion') }}</span><span class="!text-[color:var(--md-sys-color-primary)]">{{ formatDiscountPrice(previewPromotion, previewCurrency) }}</span></div>
            <div v-if="hasPositiveAmount(previewWholesale)" class="md3-kv"><span>{{ t('checkout.previewWholesale') }}</span><span class="!text-[color:var(--md-ext-success)]">{{ formatDiscountPrice(previewWholesale, previewCurrency) }}</span></div>
          </template>
          <div v-if="Number(previewMemberDiscount) > 0" class="md3-kv"><span>{{ t('checkout.previewMemberDiscount') }}</span><span class="!text-[color:var(--md-sys-color-tertiary)]">-{{ formatPrice(previewMemberDiscount, previewCurrency) }}</span></div>
        </div>
        <div class="mt-3 flex items-baseline justify-between">
          <span class="md3-title-s">{{ t('md3.checkout.payableLabel') }}</span>
          <span class="md3-price text-[24px] leading-8" data-test="checkout-total">{{ formatPrice(previewTotal, previewCurrency) }}</span>
        </div>
        <div v-if="previewLoading || couponRefreshing" class="md3-body-s mt-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ previewStatusText }}</div>

        <div v-if="checkoutAlert" class="md3-banner mt-3" :class="checkoutAlert.level === 'error' ? 'md3-banner-error' : 'md3-banner-warning'" data-test="checkout-alert">
          <component :is="checkoutAlert.level === 'error' ? AlertCircle : AlertTriangle" /> <span>{{ checkoutAlert.message }}</span>
        </div>

        <button type="button" class="md3-btn md3-btn-filled md3-btn-lg md3-btn-block mt-4" :disabled="!canSubmit" data-test="checkout-submit" @click="handleSubmit">
          {{ submitting ? t('checkout.submitting') : t('checkout.submitButton') }}
        </button>
        <p class="md3-body-s mt-3 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('checkout.submitHint') }}</p>
      </aside>

      <!-- 手机：吸底提交条 -->
      <div class="sticky z-30 bottom-[calc(84px+env(safe-area-inset-bottom,0px))] lg:hidden">
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-[var(--md-shape-lg)] bg-[color:var(--md-sys-color-surface-container-high)] p-4 shadow-[var(--md-elev-2)]">
          <div>
            <div class="md3-label-m text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('md3.checkout.payableLabel') }}</div>
            <div class="md3-price text-[22px] leading-7">{{ formatPrice(previewTotal, previewCurrency) }}</div>
          </div>
          <button type="button" class="md3-btn md3-btn-filled md3-btn-lg" :disabled="!canSubmit" data-test="checkout-submit-mobile" @click="handleSubmit">
            {{ submitting ? t('checkout.submitting') : t('checkout.submitButton') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AlertCircle, AlertTriangle, Check, ChevronRight, Package, ShoppingCart } from 'lucide-vue-next'
import ImageCaptcha from '../../components/captcha/ImageCaptcha.vue'
import TurnstileCaptcha from '../../components/captcha/TurnstileCaptcha.vue'
import CheckoutManualForm from '../../components/checkout/CheckoutManualForm.vue'
import Md3CheckoutSteps from './components/Md3CheckoutSteps.vue'
import Md3Empty from './components/Md3Empty.vue'
import { useCheckout } from '../../composables/useCheckout'
import { useNavConfig } from '../../composables/useNavConfig'

const { t } = useI18n()
const { personalCenterEnabled } = useNavConfig()

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
