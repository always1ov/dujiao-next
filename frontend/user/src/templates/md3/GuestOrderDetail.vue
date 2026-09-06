<template>
  <div class="md3-container pb-8">
    <header class="flex items-start justify-between gap-4 pb-4 pt-5 sm:pt-6">
      <div>
        <h1 class="md3-page-title">{{ t('guestOrderDetail.title') }}</h1>
        <p class="md3-body-m mt-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('guestOrderDetail.subtitle') }}</p>
      </div>
      <RouterLink class="md3-btn md3-btn-text md3-btn-sm flex-none" to="/guest/orders"><ArrowLeft /> {{ t('guestOrderDetail.backSearch') }}</RouterLink>
    </header>

    <!-- 游客验证 -->
    <div v-if="viewState === 'auth'" class="md3-card mb-4 p-5">
      <h2 class="md3-title-m mb-1">{{ t('guestOrderDetail.authTitle') }}</h2>
      <p class="md3-body-s mb-3.5 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('guestOrderDetail.authHint') }}</p>
      <div class="grid gap-3 sm:grid-cols-2">
        <input v-model="auth.email" type="email" class="md3-input md3-input-sm" :placeholder="t('guestOrders.emailPlaceholder')" />
        <input v-model="auth.order_password" type="password" class="md3-input md3-input-sm" :placeholder="t('guestOrders.passwordPlaceholder')" />
      </div>
      <div v-if="authError" class="md3-banner md3-banner-error mt-3.5"><AlertCircle /> <span>{{ authError }}</span></div>
      <div class="mt-3.5 flex flex-wrap gap-2">
        <button type="button" class="md3-btn md3-btn-filled" @click="handleAuthSubmit">{{ t('guestOrderDetail.authSubmit') }}</button>
        <button type="button" class="md3-btn md3-btn-text" @click="clearAuth">{{ t('guestOrderDetail.authClear') }}</button>
      </div>
    </div>

    <div v-if="viewState === 'loading'" class="md3-card-outlined p-5">
      <div class="md3-skeleton mb-4 h-5 w-[35%]"></div>
      <div class="md3-skeleton h-[200px]"></div>
    </div>

    <Md3Empty v-else-if="viewState === 'empty'" :icon="AlertCircle" :message="t('guestOrderDetail.notFound')" />

    <template v-else-if="viewState === 'detail' && order">
      <div class="md3-card mb-4 flex flex-wrap items-start justify-between gap-4 p-5">
        <div>
          <div class="md3-tile-label">{{ t('orders.orderNo') }}</div>
          <div class="md3-tile-value">{{ order.order_no }}</div>
          <div class="md3-body-s mt-1.5 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('orderDetail.createdAtLabel') }}：{{ formatDate(order.created_at) }}</div>
        </div>
        <div>
          <div class="md3-tile-label">{{ t('orderDetail.amountTotal') }}</div>
          <div class="md3-headline-s mt-1 font-medium tabular-nums">{{ formatMoney(order.total_amount, order.currency) }}</div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="md3-badge" :class="toneClass(statusVariant(order.status))">{{ statusLabel(order.status) }}</span>
          <RouterLink v-if="order.status === 'pending_payment'" :to="`/pay?guest=1&order_no=${order.order_no}`" class="md3-btn md3-btn-filled md3-btn-sm">{{ t('orders.payNow') }}</RouterLink>
        </div>
      </div>

      <Md3OrderBody :order="order" variant="guest" :fulfillment-downloading="fulfillmentDownloading" @download="handleDownloadFulfillment" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AlertCircle, ArrowLeft } from 'lucide-vue-next'
import Md3OrderBody from './components/Md3OrderBody.vue'
import Md3Empty from './components/Md3Empty.vue'
import { useGuestOrderDetail } from '../../composables/useGuestOrderDetail'
import { toneClass } from './utils'

const { t } = useI18n()

const {
  order, authError, auth, viewState, handleAuthSubmit, clearAuth,
  fulfillmentDownloading, handleDownloadFulfillment,
  statusLabel, statusVariant, formatDate, formatMoney,
} = useGuestOrderDetail()
</script>
