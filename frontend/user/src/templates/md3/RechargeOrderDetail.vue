<template>
  <div class="md3-container pb-8">
    <header class="flex items-start justify-between gap-4 pb-4 pt-5 sm:pt-6">
      <div>
        <h1 class="md3-page-title">{{ t('rechargeOrder.title') }}</h1>
        <p class="md3-body-m mt-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('rechargeOrder.subtitle') }}</p>
      </div>
      <RouterLink class="md3-btn md3-btn-text md3-btn-sm flex-none" to="/me/orders"><ArrowLeft /> {{ t('rechargeOrder.backList') }}</RouterLink>
    </header>

    <div v-if="loading" class="md3-card-outlined p-5">
      <div class="md3-skeleton mb-4 h-5 w-[35%]"></div>
      <div class="md3-skeleton h-[180px]"></div>
    </div>

    <Md3Empty v-else-if="!recharge" :icon="AlertCircle" :message="t('rechargeOrder.notFound')">
      <button type="button" class="md3-btn md3-btn-filled md3-btn-sm" @click="loadDetail()">{{ t('errorBoundary.retry') }}</button>
    </Md3Empty>

    <template v-else>
      <div class="md3-card mb-4 flex flex-wrap items-start justify-between gap-4 p-5">
        <div>
          <div class="md3-tile-label">{{ t('personalCenter.wallet.rechargeNoLabel') }}</div>
          <div class="md3-tile-value">{{ recharge.recharge_no }}</div>
          <div class="md3-body-s mt-1.5 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('rechargeOrder.createdAtLabel') }}：{{ formatDate(recharge.created_at) }}</div>
        </div>
        <div>
          <div class="md3-tile-label">{{ t('rechargeOrder.rechargeAmount') }}</div>
          <div class="md3-headline-s mt-1 font-medium tabular-nums">{{ formatMoney(recharge.amount, recharge.currency) }}</div>
        </div>
        <span class="md3-badge" :class="toneClass(rechargeStatusVariant(recharge.status))">{{ rechargeStatusText(recharge.status) }}</span>
      </div>

      <section class="md3-card-outlined mb-4 p-5">
        <h2 class="md3-title-m mb-4">{{ t('rechargeOrder.amountTitle') }}</h2>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
          <div class="md3-tile"><div class="md3-tile-label">{{ t('rechargeOrder.rechargeAmount') }}</div><div class="md3-tile-value">{{ formatMoney(recharge.amount, recharge.currency) }}</div></div>
          <div v-if="customerFeeApplied" class="md3-tile bg-[color:var(--md-ext-warning-container)] text-[color:var(--md-ext-on-warning-container)]"><div class="md3-tile-label text-inherit">{{ t('payment.feeAmountLabel') }}</div><div class="md3-tile-value text-inherit">{{ formatMoney(recharge.fee_amount, recharge.currency) }}</div></div>
          <div class="md3-tile bg-[color:var(--md-sys-color-primary-container)] text-[color:var(--md-sys-color-on-primary-container)]"><div class="md3-tile-label text-inherit">{{ t('personalCenter.wallet.payAmountLabel') }}</div><div class="md3-tile-value text-inherit">{{ formatMoney(recharge.payable_amount, recharge.currency) }}</div></div>
        </div>
      </section>

      <section class="md3-card-outlined mb-4 p-5">
        <h2 class="md3-title-m mb-4">{{ t('rechargeOrder.timeTitle') }}</h2>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
          <div class="md3-tile"><div class="md3-tile-label">{{ t('rechargeOrder.createdAtLabel') }}</div><div class="md3-tile-value">{{ formatDate(recharge.created_at) }}</div></div>
          <div v-if="recharge.paid_at" class="md3-tile"><div class="md3-tile-label">{{ t('rechargeOrder.paidAtLabel') }}</div><div class="md3-tile-value">{{ formatDate(recharge.paid_at) }}</div></div>
          <div v-if="payment?.expires_at" class="md3-tile"><div class="md3-tile-label">{{ t('payment.expiresAt') }}</div><div class="md3-tile-value">{{ formatDate(payment.expires_at) }}</div></div>
        </div>
      </section>

      <section v-if="recharge.remark" class="md3-card-outlined mb-4 p-5">
        <h2 class="md3-title-m mb-3">{{ t('rechargeOrder.remarkLabel') }}</h2>
        <p class="md3-body-m text-[color:var(--md-sys-color-on-surface-variant)]">{{ recharge.remark }}</p>
      </section>

      <section v-if="isPending" class="md3-card-outlined mb-4 p-5">
        <h2 class="md3-title-m mb-3">{{ t('rechargeOrder.paymentTitle') }}</h2>
        <div class="md3-body-s mb-3.5 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('personalCenter.wallet.pendingHint') }}</div>
        <div class="grid gap-4 md:grid-cols-2">
          <div v-if="showQRCode" class="flex flex-col items-center rounded-[var(--md-shape-lg)] bg-[color:var(--md-sys-color-surface-container-low)] p-5 text-center">
            <div class="md3-body-s mb-3 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('payment.qrTitle') }}</div>
            <div class="aspect-square w-full max-w-[220px] overflow-hidden rounded-[var(--md-shape-md)] bg-[#ffffff] p-2"><img :src="qrImageUrl" alt="Recharge QR" class="h-full w-full object-contain" /></div>
            <div v-if="qrUsingPayLinkFallback" class="md3-body-s mt-3 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('payment.qrFallbackHint') }}</div>
          </div>
          <div class="rounded-[var(--md-shape-lg)] bg-[color:var(--md-sys-color-surface-container-low)] p-4">
            <div v-if="hasCryptoPaymentDetails" class="grid gap-2 rounded-[var(--md-shape-md)] bg-[color:var(--md-sys-color-surface)] p-3">
              <div v-for="item in cryptoPaymentDetails" :key="item.key" class="md3-kv border-b border-[color:var(--md-sys-color-outline-variant)] pb-1.5 last:border-b-0 last:pb-0">
                <span class="flex-none">{{ item.label }}</span>
                <span class="break-all">{{ item.value }}<span v-if="item.detail" class="font-normal text-[color:var(--md-sys-color-on-surface-variant)]"> ({{ item.detail }})</span></span>
              </div>
              <div v-if="cryptoWalletAddress" class="flex items-center justify-end gap-2 pt-1.5">
                <button type="button" class="md3-btn md3-btn-outlined md3-btn-sm" @click="handleCopyWalletAddress">{{ t('payment.copyWalletAddress') }}</button>
                <span v-if="walletAddressCopied" class="md3-body-s text-[color:var(--md-ext-success)]">{{ t('payment.copied') }}</span>
              </div>
            </div>
            <div class="mt-3.5 flex flex-wrap gap-2">
              <button v-if="payLink" type="button" class="md3-btn md3-btn-outlined md3-btn-sm" @click="handleOpenPayLink"><ExternalLink /> {{ t('payment.openPayLink') }}</button>
              <button type="button" class="md3-btn md3-btn-filled md3-btn-sm" :disabled="checkingPayment" @click="checkPayment">
                {{ checkingPayment ? t('personalCenter.wallet.checkingPayStatus') : t('personalCenter.wallet.checkPayStatus') }}
              </button>
            </div>
            <div v-if="showTelegramPayHint" class="md3-body-s mt-3 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('payment.telegramExternalHint') }}</div>
          </div>
        </div>
      </section>

      <div v-if="recharge.status === 'success'" class="md3-banner md3-banner-success mb-4 items-center">
        <CheckCircle2 />
        <p class="md3-label-l">{{ t('personalCenter.wallet.rechargeSuccess') }}</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AlertCircle, ArrowLeft, CheckCircle2, ExternalLink } from 'lucide-vue-next'
import Md3Empty from './components/Md3Empty.vue'
import { useRechargeOrderDetail } from '../../composables/useRechargeOrderDetail'
import { toneClass } from './utils'

const { t } = useI18n()

const {
  loading, checkingPayment, recharge, payment, walletAddressCopied, qrImageUrl,
  isPending, payLink, showTelegramPayHint, qrUsingPayLinkFallback, showQRCode,
  cryptoWalletAddress, cryptoPaymentDetails, hasCryptoPaymentDetails, customerFeeApplied,
  rechargeStatusText, rechargeStatusVariant, formatMoney, formatDate,
  loadDetail, checkPayment, handleOpenPayLink, handleCopyWalletAddress,
} = useRechargeOrderDetail()
</script>
