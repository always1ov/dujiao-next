<template>
  <div class="md3-container pb-8">
    <header class="flex items-start justify-between gap-4 pb-4 pt-5 sm:pt-6">
      <div>
        <h1 class="md3-page-title">{{ t('orderDetail.title') }}</h1>
        <p class="md3-body-m mt-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('orderDetail.subtitle') }}</p>
      </div>
      <RouterLink class="md3-btn md3-btn-text md3-btn-sm flex-none" to="/me/orders"><ArrowLeft /> {{ t('orders.title') }}</RouterLink>
    </header>

    <div v-if="loading" class="md3-card-outlined p-5">
      <div class="md3-skeleton mb-4 h-5 w-[35%]"></div>
      <div class="md3-skeleton h-[200px]"></div>
    </div>

    <Md3Empty v-else-if="!order" :icon="AlertCircle" :message="t('orderDetail.notFound')">
      <button type="button" class="md3-btn md3-btn-filled md3-btn-sm" @click="debouncedLoadOrder()">{{ t('errorBoundary.retry') }}</button>
    </Md3Empty>

    <template v-else>
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
          <RouterLink v-if="order.status === 'pending_payment'" :to="`/pay?order_no=${order.order_no}`" class="md3-btn md3-btn-filled md3-btn-sm">{{ t('orderDetail.payNow') }}</RouterLink>
          <button v-if="order.status === 'pending_payment'" type="button" class="md3-btn md3-btn-outlined md3-btn-sm border-[color:var(--md-sys-color-error)] text-[color:var(--md-sys-color-error)]" @click="cancelOrder">{{ t('orderDetail.cancel') }}</button>
        </div>
      </div>

      <Md3OrderBody :order="order" variant="user" :fulfillment-downloading="fulfillmentDownloading" @download="handleDownloadFulfillment" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AlertCircle, ArrowLeft } from 'lucide-vue-next'
import Md3OrderBody from './components/Md3OrderBody.vue'
import Md3Empty from './components/Md3Empty.vue'
import { useOrderDetail } from '../../composables/useOrderDetail'
import { toneClass } from './utils'

const { t } = useI18n()

const {
  loading, order, debouncedLoadOrder, cancelOrder, fulfillmentDownloading, handleDownloadFulfillment,
  statusLabel, statusVariant, formatDate, formatMoney,
} = useOrderDetail()
</script>
