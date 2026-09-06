<template>
  <div class="md3-container pb-8">
    <header class="flex items-start justify-between gap-4 pb-4 pt-5 sm:pt-6">
      <div>
        <h1 class="md3-page-title">{{ t('payment.title') }}</h1>
        <p class="md3-body-m mt-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('payment.subtitle') }}</p>
      </div>
      <RouterLink :to="backLink" class="md3-btn md3-btn-text md3-btn-sm flex-none">{{ t('payment.backToOrders') }}</RouterLink>
    </header>

    <Md3CheckoutSteps current="payment" />

    <!-- Loading -->
    <div v-if="loading" class="md3-card-outlined mb-4 p-5">
      <div class="md3-skeleton mb-4 h-5 w-[40%]"></div>
      <div class="md3-skeleton h-[180px]"></div>
    </div>

    <!-- 游客验证 -->
    <div v-else-if="showGuestAuthForm" class="md3-card-outlined mb-4 p-5">
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

    <!-- 结果视图 -->
    <div v-else-if="showResultView" class="md3-card-outlined mb-4 p-5">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 class="md3-title-m">{{ paymentResultTitle }}</h2>
          <p class="md3-body-s mt-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ paymentGuideTip }}</p>
          <p class="md3-body-s mt-1.5 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('payment.methodLabel') }}：{{ resultChannelName }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="md3-btn md3-btn-outlined md3-btn-sm" :disabled="loading" @click="handleRefresh"><RefreshCw /> {{ t('payment.refreshStatus') }}</button>
          <button type="button" class="md3-btn md3-btn-text md3-btn-sm" @click="handleChangePaymentMethod">{{ t('payment.changeMethod') }}</button>
        </div>
      </div>

      <div class="mt-5 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <!-- QR -->
          <div v-if="showQRCode" class="flex flex-col items-center rounded-[var(--md-shape-lg)] bg-[color:var(--md-sys-color-surface-container-low)] p-5 text-center">
            <div class="md3-body-s mb-3 text-[color:var(--md-sys-color-on-surface-variant)]">{{ paymentGuideTitle }}</div>
            <div class="aspect-square w-full max-w-[240px] overflow-hidden rounded-[var(--md-shape-md)] bg-white p-2"><img :src="qrImageUrl" alt="QR Code" class="h-full w-full object-contain" /></div>
            <div v-if="qrUsingPayLinkFallback" class="md3-body-s mt-2.5 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('payment.qrFallbackHint') }}</div>
            <div v-if="hasCryptoPaymentDetails" class="mt-4 grid w-full gap-2 rounded-[var(--md-shape-md)] bg-[color:var(--md-sys-color-surface)] p-3 text-left">
              <div v-for="item in cryptoPaymentDetails" :key="item.key" class="md3-kv border-b border-[color:var(--md-sys-color-outline-variant)] pb-1.5 last:border-b-0 last:pb-0">
                <span class="flex-none">{{ item.label }}</span>
                <span class="break-all">{{ item.value }}<span v-if="item.detail" class="font-normal text-[color:var(--md-sys-color-on-surface-variant)]"> ({{ item.detail }})</span></span>
              </div>
              <div v-if="cryptoWalletAddress" class="flex items-center justify-end gap-2 pt-1.5">
                <button type="button" class="md3-btn md3-btn-outlined md3-btn-sm" @click="handleCopyWalletAddress">{{ t('payment.copyWalletAddress') }}</button>
                <span v-if="walletAddressCopied" class="md3-body-s text-[color:var(--md-ext-success)]">{{ t('payment.copied') }}</span>
              </div>
            </div>
          </div>

          <!-- 跳转链接 -->
          <div v-else class="rounded-[var(--md-shape-lg)] bg-[color:var(--md-sys-color-surface-container-low)] p-5">
            <div class="md3-body-s mb-3 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('payment.openPayLink') }}</div>
            <button type="button" class="md3-btn md3-btn-filled" @click="handleOpenPayLink"><ExternalLink /> {{ t('payment.openPayLink') }}</button>
            <div v-if="openedPayWindow" class="md3-body-s mt-2.5 text-[color:var(--md-ext-success)]">{{ payLinkOpenedTip }}</div>
            <div v-if="showTelegramPayHint" class="md3-body-s mt-2.5 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('payment.telegramExternalHint') }}</div>
            <div class="mt-2.5 flex items-center gap-2">
              <button type="button" class="md3-btn md3-btn-outlined md3-btn-sm" @click="handleCopyPayLink"><Copy /> {{ t('payment.copyPayLink') }}</button>
              <span v-if="copied" class="md3-body-s text-[color:var(--md-ext-success)]">{{ t('payment.copied') }}</span>
            </div>
          </div>
        </div>

        <div class="grid content-start gap-3.5">
          <div class="md3-tile">
            <div class="md3-tile-label">{{ t('payment.orderNo') }}</div>
            <div class="md3-tile-value">{{ order.order_no }}</div>
            <div class="md3-body-s mt-2.5 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('payment.orderStatus') }}：{{ statusLabel(order.status) }}</div>
            <div class="md3-body-s mt-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('payment.methodLabel') }}：{{ resultChannelName }}</div>
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
          <div v-if="paymentResult.expires_at" class="md3-tile md3-body-s text-[color:var(--md-sys-color-on-surface-variant)]">
            {{ t('payment.expiresAt') }}：{{ formatDate(paymentResult.expires_at) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 过期 / 取消 -->
    <div v-else-if="orderExpired || orderCanceled" class="md3-card-outlined mb-4 p-5">
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

    <!-- 默认：订单 + 渠道 + 操作 -->
    <div v-else class="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
      <div class="grid gap-4">
        <!-- 订单信息 -->
        <section class="md3-card-outlined p-5">
          <h2 class="md3-title-m mb-3.5">{{ t('payment.orderInfo') }}</h2>
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div class="md3-tile-label">{{ t('payment.orderNo') }}</div>
              <div class="md3-tile-value">{{ order.order_no }}</div>
              <div class="md3-body-s mt-2 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('orderDetail.createdAtLabel') }}：{{ formatDate(order.created_at) }}</div>
            </div>
            <div class="min-w-[280px] flex-1 rounded-[var(--md-shape-lg)] bg-[color:var(--md-sys-color-primary-container)] p-4 text-[color:var(--md-sys-color-on-primary-container)]">
              <div class="md3-label-m opacity-80">{{ t('payment.payableAmountLabel') }}</div>
              <div class="md3-headline-m my-1 mb-3 font-medium tabular-nums">{{ payableAmountDisplay }}</div>
              <div class="md3-body-s grid gap-1.5">
                <div class="flex justify-between gap-3"><span class="opacity-80">{{ t('orderDetail.amountTotal') }}</span><span class="font-medium">{{ formatMoney(order.total_amount, order.currency) }}</span></div>
                <div v-if="showBalanceOption && useBalance" class="flex justify-between gap-3"><span class="opacity-80">{{ t('payment.walletDeductLabel') }}</span><span class="font-medium">{{ expectedWalletPaidDisplay }}</span></div>
                <div v-if="showBalanceOption && useBalance" class="flex justify-between gap-3"><span class="opacity-80">{{ t('payment.onlinePayLabel') }}</span><span class="font-medium">{{ expectedOnlinePayDisplay }}</span></div>
                <div class="flex justify-between gap-3 border-t border-current/20 pt-2"><span class="opacity-80">{{ t('payment.orderStatus') }}</span><span class="font-medium">{{ statusLabel(order.status) }}</span></div>
              </div>
            </div>
          </div>
          <div class="mt-4 grid gap-3 sm:grid-cols-3">
            <div class="md3-tile"><div class="md3-tile-label">{{ t('orderDetail.amountOriginal') }}</div><div class="md3-tile-value">{{ formatMoney(order.original_amount, order.currency) }}</div></div>
            <div class="md3-tile"><div class="md3-tile-label">{{ t('orderDetail.amountDiscount') }}</div><div class="md3-tile-value" :class="{ 'text-[color:var(--md-sys-color-error)]': hasDiscountAmount(order.discount_amount) }">{{ formatDiscountMoney(order.discount_amount, order.currency) }}</div></div>
            <div class="md3-tile"><div class="md3-tile-label">{{ t('orderDetail.promotionDiscountLabel') }}</div><div class="md3-tile-value" :class="{ 'text-[color:var(--md-sys-color-error)]': hasDiscountAmount(order.promotion_discount_amount) }">{{ formatDiscountMoney(order.promotion_discount_amount, order.currency) }}</div></div>
            <div v-if="hasDiscountAmount(order.wholesale_discount_amount)" class="md3-tile bg-[color:var(--md-ext-success-container)] text-[color:var(--md-ext-on-success-container)]"><div class="md3-tile-label text-inherit">{{ t('orderDetail.amountWholesaleDiscount') }}</div><div class="md3-tile-value text-inherit">{{ formatDiscountMoney(order.wholesale_discount_amount, order.currency) }}</div></div>
          </div>
          <div v-if="order.expires_at" class="md3-body-s mt-3 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('payment.expiresAt') }}：{{ formatDate(order.expires_at) }}</div>
          <div v-if="showCountdown" class="md3-badge mt-3 h-8 px-3" :class="countdownExpired ? 'md3-badge-error' : 'md3-badge-success'">
            <Timer /> <span>{{ t('payment.countdownLabel') }}</span><span class="tabular-nums">{{ countdownText }}</span>
          </div>
          <div v-if="pollingActive" class="md3-body-s mt-2.5 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('payment.pollingHint') }}</div>
        </section>

        <!-- 商品 -->
        <section v-if="orderItems.length" class="md3-card-outlined p-5">
          <h2 class="md3-title-m mb-3.5">{{ t('payment.itemsTitle') }}</h2>
          <div class="grid gap-3">
            <div v-for="(item, idx) in orderItems" :key="idx" class="flex flex-wrap justify-between gap-3 border-b border-[color:var(--md-sys-color-outline-variant)] pb-3 last:border-b-0 last:pb-0">
              <div>
                <div class="md3-title-s">{{ getLocalizedText(item.title) }}</div>
                <div class="md3-body-s mt-0.5 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('orderDetail.quantityLabel') }}：{{ item.quantity }} · {{ t('orderDetail.itemFulfillmentLabel') }}：{{ fulfillmentTypeLabelText(item.fulfillment_type) }}</div>
                <div v-if="orderItemSkuText(item)" class="md3-body-s mt-0.5 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('orderDetail.itemSkuLabel') }}：{{ orderItemSkuText(item) }}</div>
              </div>
              <div class="md3-body-s text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('orderDetail.totalPriceLabel') }}：{{ formatMoney(item.total_price, order.currency) }}</div>
            </div>
          </div>
        </section>

        <!-- 渠道选择 -->
        <section class="md3-card-outlined p-5">
          <h2 class="md3-title-m mb-3.5">{{ t('payment.channelTitle') }}</h2>
          <div v-if="!configReady" class="md3-body-s text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('common.loading') }}</div>
          <template v-else>
            <div v-if="showBalanceOption" class="mb-3 rounded-[var(--md-shape-md)] bg-[color:var(--md-sys-color-surface-container)] p-3.5">
              <div class="flex items-start justify-between gap-2.5">
                <div>
                  <div class="md3-tile-label">{{ t('payment.walletBalanceLabel') }}</div>
                  <div class="md3-tile-value">{{ walletLoading ? t('common.loading') : walletBalanceDisplay }}</div>
                </div>
                <label class="md3-body-s inline-flex items-center gap-1.5 text-[color:var(--md-sys-color-on-surface-variant)]"><input v-model="useBalance" type="checkbox" class="h-4 w-4 accent-[var(--md-sys-color-primary)]" :disabled="walletOnlyPayment" /><span>{{ t('payment.useBalance') }}</span></label>
              </div>
              <div v-if="walletOnlyPayment" class="md3-body-s mt-2 text-[color:var(--md-ext-warning)]">{{ t('payment.walletOnlyHint') }}</div>
              <div v-if="useBalance" class="md3-body-s mt-2.5 grid gap-0.5 text-[color:var(--md-sys-color-on-surface-variant)]">
                <div>{{ t('payment.walletDeductLabel') }}：{{ expectedWalletPaidDisplay }}</div>
                <div v-if="!walletOnlyPayment">{{ t('payment.onlinePayLabel') }}：{{ expectedOnlinePayDisplay }}</div>
                <div v-if="walletOnlyPayment && expectedOnlinePayCents > 0" class="text-[color:var(--md-ext-warning)]">{{ t('payment.walletInsufficientHint') }}</div>
              </div>
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
          </template>
        </section>

        <!-- 支付信息 -->
        <section v-if="paymentResult" class="md3-card-outlined p-5">
          <h2 class="md3-title-m mb-3.5">{{ t('payment.infoTitle') }}</h2>
          <div class="md3-body-s grid gap-1.5 text-[color:var(--md-sys-color-on-surface-variant)]">
            <div>{{ t('payment.methodLabel') }}：{{ resultChannelName }}</div>
            <div>{{ t('payment.interactionLabel') }}：{{ interactionLabel }}</div>
            <div v-if="paymentResult.expires_at">{{ t('payment.expiresAt') }}：{{ formatDate(paymentResult.expires_at) }}</div>
          </div>
          <div v-if="showPayLink" class="mt-3.5 flex flex-wrap gap-2">
            <button type="button" class="md3-btn md3-btn-filled md3-btn-sm" @click="handleOpenPayLink"><ExternalLink /> {{ t('payment.openPayLink') }}</button>
            <button type="button" class="md3-btn md3-btn-outlined md3-btn-sm" @click="handleCopyPayLink"><Copy /> {{ t('payment.copyPayLink') }}</button>
          </div>
        </section>
      </div>

      <!-- 右栏：操作 -->
      <aside class="md3-card sticky top-[80px] p-5">
        <h2 class="md3-title-m mb-3.5">{{ t('payment.actionTitle') }}</h2>
        <div v-if="showCountdown" class="md3-body-s mb-3 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('payment.countdownLabel') }}：<span class="tabular-nums">{{ countdownText }}</span></div>
        <div v-if="paymentAlert" class="md3-banner mb-3" :class="paymentAlert.level === 'error' ? 'md3-banner-error' : (paymentAlert.level === 'success' ? 'md3-banner-success' : 'md3-banner-warning')">
          <component :is="paymentAlert.level === 'error' ? AlertCircle : (paymentAlert.level === 'success' ? CheckCircle2 : AlertTriangle)" /> <span>{{ paymentAlert.message }}</span>
        </div>

        <div v-if="selectedChannel" class="md3-banner md3-banner-success mb-3 md3-body-s"><CheckCircle2 /> <span>{{ t('payment.methodLabel') }}：{{ selectedChannelName }}</span></div>
        <div v-else-if="!requiresOnlineChannel && !orderExpired && !orderCanceled" class="md3-banner md3-banner-success mb-3 md3-body-s"><CheckCircle2 /> <span>{{ t('payment.walletPayOnly') }}</span></div>
        <div v-else-if="walletOnlyPayment && expectedOnlinePayCents > 0 && !orderExpired && !orderCanceled" class="md3-banner md3-banner-warning mb-3 md3-body-s"><AlertTriangle /> <span>{{ t('payment.walletInsufficientHint') }}</span></div>
        <div v-else-if="!walletOnlyPayment && requiresOnlineChannel && !orderExpired && !orderCanceled" class="md3-banner md3-banner-warning mb-3 md3-body-s"><AlertTriangle /> <span>{{ t('payment.selectChannelError') }}</span></div>

        <button type="button" class="md3-btn md3-btn-filled md3-btn-lg md3-btn-block" :disabled="!canSubmitPayment" @click="handlePayment">
          {{ submitting ? t('payment.submitting') : t('payment.submitButton') }}
        </button>
        <button type="button" class="md3-btn md3-btn-outlined md3-btn-block mt-2.5" :disabled="loading" @click="handleRefresh"><RefreshCw /> {{ t('payment.refreshStatus') }}</button>
      </aside>
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
