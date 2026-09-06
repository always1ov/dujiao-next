<template>
  <div class="md3-container pb-8">
    <header class="flex items-start justify-between gap-4 pb-4 pt-5 sm:pt-6">
      <div>
        <h1 class="md3-page-title">{{ t('payment.title') }}</h1>
        <p class="md3-body-m mt-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('payment.subtitle') }}</p>
      </div>
      <RouterLink :to="backLink" class="md3-btn md3-btn-text md3-btn-sm flex-none">{{ t('payment.backToOrders') }}</RouterLink>
    </header>

    <div class="mx-auto max-w-[760px]">
      <Md3CheckoutSteps current="payment" />

      <!-- Loading -->
      <div v-if="loading" class="grid gap-4">
        <div class="md3-skeleton h-36 rounded-[var(--md-shape-xl)]"></div>
        <div class="md3-skeleton h-48"></div>
      </div>

      <!-- 游客验证 -->
      <div v-else-if="showGuestAuthForm" class="md3-card p-5">
        <h2 class="md3-title-m mb-1">{{ t('payment.guestAuthTitle') }}</h2>
        <p class="md3-body-s mb-3.5 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('payment.guestAuthHint') }}</p>
        <div class="grid gap-3 sm:grid-cols-2">
          <input v-model="guestAuth.email" type="email" class="md3-input md3-input-sm" :placeholder="t('guestOrders.emailPlaceholder')" />
          <input v-model="guestAuth.order_password" type="password" class="md3-input md3-input-sm" :placeholder="t('guestOrders.passwordPlaceholder')" />
        </div>
        <div v-if="guestAuthError" class="md3-banner md3-banner-error mt-3.5"><AlertCircle /> <span>{{ guestAuthError }}</span></div>
        <button type="button" class="md3-btn md3-btn-filled mt-3.5" @click="handleGuestAuthSubmit">{{ t('payment.guestAuthSubmit') }}</button>
      </div>

      <!-- 订单不存在 -->
      <Md3Empty v-else-if="!order" :icon="AlertCircle" :message="t('payment.orderNotFound')">
        <RouterLink :to="backLink" class="md3-btn md3-btn-filled md3-btn-sm">{{ t('payment.backToOrders') }}</RouterLink>
      </Md3Empty>

      <!-- 结果视图：二维码 / 跳转链接居中 -->
      <div v-else-if="showResultView" class="grid gap-4">
        <div class="md3-card p-5 text-center sm:p-6">
          <h2 class="md3-title-l">{{ paymentResultTitle }}</h2>
          <p class="md3-body-s mt-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ paymentGuideTip }}</p>

          <div v-if="showQRCode" class="mx-auto mt-5 max-w-[300px]">
            <div class="md3-body-s mb-3 text-[color:var(--md-sys-color-on-surface-variant)]">{{ paymentGuideTitle }}</div>
            <div class="aspect-square w-full overflow-hidden rounded-[var(--md-shape-lg)] bg-white p-3 shadow-[var(--md-elev-1)]"><img :src="qrImageUrl" alt="QR Code" class="h-full w-full object-contain" /></div>
            <div v-if="qrUsingPayLinkFallback" class="md3-body-s mt-2.5 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('payment.qrFallbackHint') }}</div>
          </div>
          <div v-else class="mx-auto mt-5 flex max-w-[360px] flex-col items-center gap-2.5">
            <button type="button" class="md3-btn md3-btn-filled md3-btn-lg md3-btn-block" @click="handleOpenPayLink"><ExternalLink /> {{ t('payment.openPayLink') }}</button>
            <div v-if="openedPayWindow" class="md3-body-s text-[color:var(--md-ext-success)]">{{ payLinkOpenedTip }}</div>
            <div v-if="showTelegramPayHint" class="md3-body-s text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('payment.telegramExternalHint') }}</div>
            <div class="flex items-center gap-2">
              <button type="button" class="md3-btn md3-btn-text md3-btn-sm" @click="handleCopyPayLink"><Copy /> {{ t('payment.copyPayLink') }}</button>
              <span v-if="copied" class="md3-body-s text-[color:var(--md-ext-success)]">{{ t('payment.copied') }}</span>
            </div>
          </div>

          <div v-if="hasCryptoPaymentDetails" class="mx-auto mt-4 grid w-full max-w-[420px] gap-2 rounded-[var(--md-shape-md)] bg-[color:var(--md-sys-color-surface-container)] p-3 text-left">
            <div v-for="item in cryptoPaymentDetails" :key="item.key" class="md3-kv border-b border-[color:var(--md-sys-color-outline-variant)] pb-1.5 last:border-b-0 last:pb-0">
              <span class="flex-none">{{ item.label }}</span>
              <span class="break-all">{{ item.value }}<span v-if="item.detail" class="font-normal text-[color:var(--md-sys-color-on-surface-variant)]"> ({{ item.detail }})</span></span>
            </div>
            <div v-if="cryptoWalletAddress" class="flex items-center justify-end gap-2 pt-1.5">
              <button type="button" class="md3-btn md3-btn-outlined md3-btn-sm" @click="handleCopyWalletAddress">{{ t('payment.copyWalletAddress') }}</button>
              <span v-if="walletAddressCopied" class="md3-body-s text-[color:var(--md-ext-success)]">{{ t('payment.copied') }}</span>
            </div>
          </div>

          <div class="mt-5 flex flex-wrap justify-center gap-2">
            <button type="button" class="md3-btn md3-btn-tonal md3-btn-sm" :disabled="loading" @click="handleRefresh"><RefreshCw /> {{ t('payment.refreshStatus') }}</button>
            <button type="button" class="md3-btn md3-btn-text md3-btn-sm" @click="handleChangePaymentMethod">{{ t('payment.changeMethod') }}</button>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="md3-tile">
            <div class="md3-tile-label">{{ t('payment.orderNo') }}</div>
            <div class="md3-tile-value">{{ order.order_no }}</div>
            <div class="md3-body-s mt-2 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('payment.orderStatus') }}：{{ statusLabel(order.status) }}</div>
            <div class="md3-body-s mt-0.5 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('payment.methodLabel') }}：{{ resultChannelName }}</div>
            <div v-if="paymentResult.expires_at" class="md3-body-s mt-0.5 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('payment.expiresAt') }}：{{ formatDate(paymentResult.expires_at) }}</div>
          </div>
          <PaymentAmountBreakdown
            :order="order"
            :payment-result="paymentResult"
            :customer-fee-applied="customerFeeApplied"
            :customer-fee-amount-display="customerFeeAmountDisplay"
            :payable-amount-display="payableAmountDisplay"
            :wallet-paid-display="paymentWalletPaidDisplay"
            :online-pay-display="paymentOnlinePayDisplay"
            :show-countdown="showCountdown"
            :countdown-text="countdownText"
            :polling-active="pollingActive"
            :format-money="formatMoney"
            :format-discount-money="formatDiscountMoney"
            :has-discount-amount="hasDiscountAmount"
          />
        </div>
      </div>

      <!-- 过期 / 取消 -->
      <div v-else-if="orderExpired || orderCanceled" class="md3-card-outlined p-5">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="md3-title-m">{{ orderCanceled ? t('payment.orderCanceled') : t('payment.orderExpired') }}</h2>
            <p class="md3-body-s mt-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ order.order_no }}</p>
          </div>
          <RouterLink :to="backLink" class="md3-btn md3-btn-outlined md3-btn-sm">{{ t('payment.backToOrders') }}</RouterLink>
        </div>
        <div class="mt-4 grid gap-3 sm:grid-cols-3">
          <div class="md3-tile"><div class="md3-tile-label">{{ t('payment.orderNo') }}</div><div class="md3-tile-value">{{ order.order_no }}</div></div>
          <div class="md3-tile"><div class="md3-tile-label">{{ t('payment.orderStatus') }}</div><div class="md3-tile-value">{{ statusLabel(order.status) }}</div></div>
          <div class="md3-tile"><div class="md3-tile-label">{{ t('orderDetail.amountTotal') }}</div><div class="md3-tile-value">{{ formatMoney(order.total_amount, order.currency) }}</div></div>
        </div>
      </div>

      <!-- 默认：金额大卡 → 支付方式 → 订单 → 吸底支付条 -->
      <div v-else class="grid gap-4">
        <section class="rounded-[var(--md-shape-xl)] bg-[color:var(--md-sys-color-primary-container)] p-5 text-[color:var(--md-sys-color-on-primary-container)] sm:p-6">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div class="md3-label-m opacity-80">{{ t('md3.payment.amountTitle') }}</div>
              <div class="md3-display-s mt-1 font-medium tabular-nums">{{ payableAmountDisplay }}</div>
              <div class="md3-body-s mt-2 opacity-80">{{ t('payment.orderNo') }} {{ order.order_no }} · {{ t('orderDetail.createdAtLabel') }} {{ formatDate(order.created_at) }}</div>
            </div>
            <div class="flex flex-col items-end gap-2">
              <span class="md3-badge bg-[color:var(--md-sys-color-surface)]/70 text-[color:var(--md-sys-color-on-surface)]">{{ statusLabel(order.status) }}</span>
              <span v-if="showCountdown" class="md3-badge h-8 px-3" :class="countdownExpired ? 'md3-badge-error' : 'bg-[color:var(--md-sys-color-surface)]/70 text-[color:var(--md-sys-color-on-surface)]'">
                <Timer /> <span class="tabular-nums">{{ countdownText }}</span>
              </span>
            </div>
          </div>
          <div class="md3-body-s mt-4 grid gap-1 border-t border-current/15 pt-3">
            <div class="flex justify-between gap-3"><span class="opacity-80">{{ t('orderDetail.amountTotal') }}</span><span class="font-medium tabular-nums">{{ formatMoney(order.total_amount, order.currency) }}</span></div>
            <div v-if="hasDiscountAmount(order.discount_amount)" class="flex justify-between gap-3"><span class="opacity-80">{{ t('orderDetail.amountDiscount') }}</span><span class="font-medium tabular-nums">{{ formatDiscountMoney(order.discount_amount, order.currency) }}</span></div>
            <div v-if="hasDiscountAmount(order.promotion_discount_amount)" class="flex justify-between gap-3"><span class="opacity-80">{{ t('orderDetail.promotionDiscountLabel') }}</span><span class="font-medium tabular-nums">{{ formatDiscountMoney(order.promotion_discount_amount, order.currency) }}</span></div>
            <div v-if="hasDiscountAmount(order.wholesale_discount_amount)" class="flex justify-between gap-3"><span class="opacity-80">{{ t('orderDetail.amountWholesaleDiscount') }}</span><span class="font-medium tabular-nums">{{ formatDiscountMoney(order.wholesale_discount_amount, order.currency) }}</span></div>
            <div v-if="showBalanceOption && useBalance" class="flex justify-between gap-3"><span class="opacity-80">{{ t('payment.walletDeductLabel') }}</span><span class="font-medium tabular-nums">{{ expectedWalletPaidDisplay }}</span></div>
            <div v-if="showBalanceOption && useBalance" class="flex justify-between gap-3"><span class="opacity-80">{{ t('payment.onlinePayLabel') }}</span><span class="font-medium tabular-nums">{{ expectedOnlinePayDisplay }}</span></div>
            <div v-if="order.expires_at" class="flex justify-between gap-3"><span class="opacity-80">{{ t('payment.expiresAt') }}</span><span class="font-medium">{{ formatDate(order.expires_at) }}</span></div>
          </div>
          <div v-if="pollingActive" class="md3-body-s mt-2 opacity-80">{{ t('payment.pollingHint') }}</div>
        </section>

        <!-- 支付方式 -->
        <section class="md3-card-outlined p-5">
          <h2 class="md3-title-m mb-3">{{ t('md3.payment.chooseChannel') }}</h2>
          <div v-if="!configReady" class="md3-body-s text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('common.loading') }}</div>
          <template v-else>
            <div v-if="showBalanceOption" class="mb-3 rounded-[var(--md-shape-md)] bg-[color:var(--md-sys-color-surface-container)] p-3.5">
              <label class="flex items-center justify-between gap-3">
                <span>
                  <span class="md3-tile-label">{{ t('payment.walletBalanceLabel') }}</span>
                  <span class="md3-tile-value">{{ walletLoading ? t('common.loading') : walletBalanceDisplay }}</span>
                </span>
                <span class="md3-body-s inline-flex items-center gap-1.5 text-[color:var(--md-sys-color-on-surface-variant)]"><input v-model="useBalance" type="checkbox" class="h-4 w-4 accent-[var(--md-sys-color-primary)]" :disabled="walletOnlyPayment" /> {{ t('payment.useBalance') }}</span>
              </label>
              <div v-if="walletOnlyPayment" class="md3-body-s mt-2 text-[color:var(--md-ext-warning)]">{{ t('payment.walletOnlyHint') }}</div>
              <div v-if="walletOnlyPayment && expectedOnlinePayCents > 0" class="md3-body-s mt-1 text-[color:var(--md-ext-warning)]">{{ t('payment.walletInsufficientHint') }}</div>
            </div>
            <div v-if="cachedPayment" class="md3-banner md3-banner-warning mb-3 flex-col gap-1.5">
              <div class="md3-label-l">{{ t('payment.cachedTitle') }}</div>
              <div class="md3-body-s">{{ t('payment.cachedHint', { channel: cachedChannelName }) }}</div>
              <div class="mt-1"><button type="button" class="md3-btn md3-btn-outlined md3-btn-sm border-current text-inherit" @click="restoreCachedPayment">{{ t('payment.useCached') }}</button></div>
            </div>
            <PaymentChannelSelector
              v-if="!walletOnlyPayment"
              :channels="channels"
              :model-value="selectedChannelId"
              :show-balance-option="showBalanceOption"
              :is-channel-disabled-for-amount="isChannelDisabledForAmount"
              :channel-amount-limit-hint="channelAmountLimitHint"
              @update:model-value="selectedChannelId = $event"
            />
            <div v-if="!requiresOnlineChannel && !orderExpired && !orderCanceled" class="md3-body-s mt-2 text-[color:var(--md-ext-success)]">{{ t('payment.walletPayOnly') }}</div>
          </template>
        </section>

        <!-- 订单商品 -->
        <section v-if="orderItems.length" class="md3-card-outlined p-5">
          <h2 class="md3-title-m mb-3">{{ t('md3.payment.orderSection') }}</h2>
          <div class="grid gap-2">
            <div v-for="(item, idx) in orderItems" :key="idx" class="flex flex-wrap items-start justify-between gap-2 border-b border-[color:var(--md-sys-color-outline-variant)] pb-2 last:border-b-0 last:pb-0">
              <div class="min-w-0">
                <div class="md3-title-s truncate">{{ getLocalizedText(item.title) }}</div>
                <div class="md3-body-s text-[color:var(--md-sys-color-on-surface-variant)]">× {{ item.quantity }} · {{ fulfillmentTypeLabelText(item.fulfillment_type) }}<template v-if="orderItemSkuText(item)"> · {{ orderItemSkuText(item) }}</template></div>
              </div>
              <div class="md3-label-l tabular-nums">{{ formatMoney(item.total_price, order.currency) }}</div>
            </div>
          </div>
        </section>

        <!-- 支付信息 -->
        <section v-if="paymentResult" class="md3-card-outlined p-5">
          <h2 class="md3-title-m mb-3">{{ t('payment.infoTitle') }}</h2>
          <div class="md3-body-s grid gap-1 text-[color:var(--md-sys-color-on-surface-variant)]">
            <div>{{ t('payment.methodLabel') }}：{{ resultChannelName }}</div>
            <div>{{ t('payment.interactionLabel') }}：{{ interactionLabel }}</div>
            <div v-if="paymentResult.expires_at">{{ t('payment.expiresAt') }}：{{ formatDate(paymentResult.expires_at) }}</div>
          </div>
          <div v-if="showPayLink" class="mt-3 flex flex-wrap gap-2">
            <button type="button" class="md3-btn md3-btn-filled md3-btn-sm" @click="handleOpenPayLink"><ExternalLink /> {{ t('payment.openPayLink') }}</button>
            <button type="button" class="md3-btn md3-btn-outlined md3-btn-sm" @click="handleCopyPayLink"><Copy /> {{ t('payment.copyPayLink') }}</button>
          </div>
        </section>

        <!-- 吸底支付条 -->
        <div class="sticky z-30 bottom-[calc(88px+env(safe-area-inset-bottom,0px))] lg:bottom-4">
          <div class="rounded-[var(--md-shape-lg)] bg-[color:var(--md-sys-color-surface-container-high)] p-4 shadow-[var(--md-elev-2)]">
            <div v-if="paymentAlert" class="md3-banner mb-3" :class="paymentAlert.level === 'error' ? 'md3-banner-error' : (paymentAlert.level === 'success' ? 'md3-banner-success' : 'md3-banner-warning')">
              <component :is="paymentAlert.level === 'error' ? AlertCircle : (paymentAlert.level === 'success' ? CheckCircle2 : AlertTriangle)" /> <span>{{ paymentAlert.message }}</span>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="min-w-0">
                <div class="md3-label-m text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('payment.methodLabel') }}</div>
                <div class="md3-title-m truncate">
                  <template v-if="selectedChannel">{{ selectedChannelName }}</template>
                  <template v-else-if="!requiresOnlineChannel && !orderExpired && !orderCanceled">{{ t('payment.walletPayOnly') }}</template>
                  <span v-else class="text-[color:var(--md-ext-warning)]">{{ t('payment.selectChannelError') }}</span>
                </div>
              </div>
              <div class="flex gap-2">
                <button type="button" class="md3-icon-btn md3-icon-btn-outlined" :disabled="loading" :aria-label="t('payment.refreshStatus')" :title="t('payment.refreshStatus')" @click="handleRefresh"><RefreshCw /></button>
                <button type="button" class="md3-btn md3-btn-filled md3-btn-lg" :disabled="!canSubmitPayment" @click="handlePayment">
                  {{ submitting ? t('payment.submitting') : t('payment.submitButton') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AlertCircle, AlertTriangle, CheckCircle2, Copy, ExternalLink, RefreshCw, Timer } from 'lucide-vue-next'
import PaymentAmountBreakdown from '../../components/payment/PaymentAmountBreakdown.vue'
import PaymentChannelSelector from '../../components/payment/PaymentChannelSelector.vue'
import Md3CheckoutSteps from './components/Md3CheckoutSteps.vue'
import Md3Empty from './components/Md3Empty.vue'
import { usePayment } from '../../composables/usePayment'

const { t } = useI18n()

const {
  loading, submitting, order, paymentResult, selectedChannelId, copied, walletAddressCopied,
  openedPayWindow, cachedPayment, guestAuth, guestAuthError, walletLoading, useBalance,
  backLink, showGuestAuthForm, walletOnlyPayment, showBalanceOption, configReady, channels,
  selectedChannel, selectedChannelName, cachedChannelName, resultChannelName, interactionLabel,
  paymentResultTitle, paymentGuideTitle, paymentGuideTip, showPayLink, showTelegramPayHint, payLinkOpenedTip,
  cryptoWalletAddress, cryptoPaymentDetails, hasCryptoPaymentDetails, qrUsingPayLinkFallback, showQRCode, qrImageUrl,
  orderExpired, orderCanceled, paymentAlert, countdownExpired, countdownText, showCountdown, showResultView, pollingActive, orderItems,
  customerFeeApplied, customerFeeAmountDisplay, payableAmountDisplay, walletBalanceDisplay,
  expectedWalletPaidDisplay, expectedOnlinePayDisplay, expectedOnlinePayCents, requiresOnlineChannel,
  paymentWalletPaidDisplay, paymentOnlinePayDisplay, isChannelDisabledForAmount, channelAmountLimitHint, canSubmitPayment,
  formatDate, statusLabel, formatMoney, hasDiscountAmount, formatDiscountMoney, getLocalizedText, orderItemSkuText, fulfillmentTypeLabelText,
  handleCopyPayLink, handleCopyWalletAddress, handleOpenPayLink, restoreCachedPayment, handleChangePaymentMethod,
  handlePayment, handleGuestAuthSubmit, handleRefresh,
} = usePayment()
</script>
