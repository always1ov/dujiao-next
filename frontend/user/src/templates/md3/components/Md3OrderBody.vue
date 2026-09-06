<template>
  <div class="grid gap-4">
    <!-- 子订单（含卡密） -->
    <section v-if="order.children && order.children.length > 0" class="md3-card-outlined p-5">
      <h2 class="md3-title-m mb-4">{{ t('orderDetail.childOrdersTitle') }}</h2>
      <div class="grid gap-4">
        <div v-for="child in order.children" :key="child.id" class="rounded-[var(--md-shape-md)] bg-[color:var(--md-sys-color-surface-container-low)] p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="md3-body-s text-[color:var(--md-sys-color-on-surface-variant)]">
              <div>{{ t('orderDetail.childOrderNo') }}：{{ child.order_no }}</div>
              <div>{{ t('orderDetail.childOrderAmount') }}：{{ formatMoney(child.total_amount, child.currency || order.currency) }}</div>
            </div>
            <span class="md3-badge" :class="toneClass(statusVariant(resolvedChildStatus(child)))">{{ statusLabel(resolvedChildStatus(child)) }}</span>
          </div>

          <h3 class="md3-title-s my-2.5 mt-4">{{ t('orderDetail.childItemsTitle') }}</h3>
          <div v-if="child.items && child.items.length" class="grid">
            <Md3OrderItem v-for="(item, cidx) in child.items" :key="cidx" :item="item" :currency="child.currency || order.currency" />
          </div>
          <div v-else class="md3-body-s text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('orderDetail.noItems') }}</div>

          <div class="mt-3.5 border-t border-[color:var(--md-sys-color-outline-variant)] pt-3.5">
            <Md3OrderFulfillment
              v-if="child.fulfillment"
              :title="t('orderDetail.childFulfillmentTitle')"
              :fulfillment="child.fulfillment"
              :items="child.items"
              :order-no="child.order_no || order.order_no"
              :downloading="fulfillmentDownloading"
              @download="emit('download', $event)"
            />
            <div v-else class="md3-body-s text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('orderDetail.childFulfillmentEmpty') }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 主订单发货（含卡密） -->
    <section v-if="order.fulfillment" class="md3-card-outlined p-5">
      <h2 class="md3-title-m mb-4">{{ t('orderDetail.fulfillmentTitle') }}</h2>
      <Md3OrderFulfillment
        :fulfillment="order.fulfillment"
        :items="order.items"
        :order-no="order.order_no"
        :downloading="fulfillmentDownloading"
        @download="emit('download', $event)"
      />
    </section>

    <!-- 商品 -->
    <section class="md3-card-outlined p-5">
      <h2 class="md3-title-m mb-4">{{ t('orderDetail.itemsTitle') }}</h2>
      <div v-if="order.items && order.items.length > 0" class="grid">
        <Md3OrderItem v-for="(item, idx) in order.items" :key="idx" :item="item" :currency="order.currency" />
      </div>
      <div v-else class="md3-body-s text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('orderDetail.noItems') }}</div>
    </section>

    <!-- 金额明细 -->
    <section class="md3-card-outlined p-5">
      <h2 class="md3-title-m mb-4">{{ t('orderDetail.amountTitle') }}</h2>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
        <div class="md3-tile"><div class="md3-tile-label">{{ t('orderDetail.amountOriginal') }}</div><div class="md3-tile-value">{{ formatMoney(order.original_amount, order.currency) }}</div></div>
        <div class="md3-tile"><div class="md3-tile-label">{{ t('orderDetail.amountDiscount') }}</div><div class="md3-tile-value" :class="{ 'text-[color:var(--md-sys-color-error)]': hasDiscountAmount(order.discount_amount) }">{{ formatDiscountMoney(order.discount_amount, order.currency) }}</div></div>
        <div class="md3-tile"><div class="md3-tile-label">{{ t('orderDetail.amountTotal') }}</div><div class="md3-tile-value">{{ formatMoney(order.total_amount, order.currency) }}</div></div>
        <template v-if="variant === 'user'">
          <div v-if="hasAmount(order.wallet_paid_amount)" class="md3-tile"><div class="md3-tile-label">{{ t('orderDetail.amountWalletPaid') }}</div><div class="md3-tile-value">{{ formatMoney(order.wallet_paid_amount, order.currency) }}</div></div>
          <div v-if="hasAmount(order.online_paid_amount)" class="md3-tile"><div class="md3-tile-label">{{ t('orderDetail.amountOnlinePaid') }}</div><div class="md3-tile-value">{{ formatMoney(order.online_paid_amount, order.currency) }}</div></div>
          <div v-if="hasAmount(order.refunded_amount)" class="md3-tile"><div class="md3-tile-label">{{ t('orderDetail.amountRefunded') }}</div><div class="md3-tile-value">{{ formatMoney(order.refunded_amount, order.currency) }}</div></div>
        </template>
        <div v-if="hasDiscountAmount(order.member_discount_amount)" class="md3-tile bg-[color:var(--md-sys-color-tertiary-container)] text-[color:var(--md-sys-color-on-tertiary-container)]">
          <div class="md3-tile-label text-inherit">{{ t('orderDetail.amountMemberDiscount') }}</div>
          <div class="md3-tile-value text-inherit">{{ formatDiscountMoney(order.member_discount_amount, order.currency) }}</div>
        </div>
        <div v-if="hasDiscountAmount(order.wholesale_discount_amount)" class="md3-tile bg-[color:var(--md-ext-success-container)] text-[color:var(--md-ext-on-success-container)]">
          <div class="md3-tile-label text-inherit">{{ t('orderDetail.amountWholesaleDiscount') }}</div>
          <div class="md3-tile-value text-inherit">{{ formatDiscountMoney(order.wholesale_discount_amount, order.currency) }}</div>
        </div>
      </div>
    </section>

    <!-- 退款记录 -->
    <section v-if="showRefundRecordsCard" class="md3-card-outlined p-5">
      <h2 class="md3-title-m mb-4">{{ t('orderDetail.refundRecordsTitle') }}</h2>
      <div v-if="refundRecords.length > 0" class="overflow-hidden rounded-[var(--md-shape-md)] bg-[color:var(--md-sys-color-surface-container-low)]">
        <div class="md3-label-m grid grid-cols-[1.2fr_1fr_1.6fr] gap-3 bg-[color:var(--md-sys-color-surface-container)] px-3.5 py-2.5 text-[color:var(--md-sys-color-on-surface-variant)] max-[640px]:hidden">
          <span>{{ t('orderDetail.refundRecordTime') }}</span>
          <span>{{ t('orderDetail.refundRecordAmount') }}</span>
          <span>{{ t('orderDetail.refundRecordReason') }}</span>
        </div>
        <div v-for="(record, idx) in refundRecords" :key="`refund-${idx}`" class="md3-body-s grid grid-cols-[1.2fr_1fr_1.6fr] gap-3 border-t border-[color:var(--md-sys-color-outline-variant)] px-3.5 py-2.5 max-[640px]:grid-cols-1 max-[640px]:gap-1">
          <span class="text-[color:var(--md-sys-color-on-surface-variant)]">{{ formatDate(record.created_at) }}</span>
          <span class="tabular-nums">{{ formatMoney(record.amount, record.currency || order.currency) }}</span>
          <span class="whitespace-pre-wrap break-words text-[color:var(--md-sys-color-on-surface-variant)]">{{ refundReasonText(record.remark) }}</span>
        </div>
      </div>
      <div v-else class="md3-body-s text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('orderDetail.refundRecordsEmpty') }}</div>
    </section>

    <!-- 时间信息 -->
    <section v-if="showTimeCard" class="md3-card-outlined p-5">
      <h2 class="md3-title-m mb-4">{{ t('orderDetail.timeTitle') }}</h2>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
        <div class="md3-tile"><div class="md3-tile-label">{{ t('orderDetail.createdAtLabel') }}</div><div class="md3-tile-value">{{ formatDate(order.created_at) }}</div></div>
        <div v-if="order.paid_at" class="md3-tile"><div class="md3-tile-label">{{ t('orderDetail.paidAtLabel') }}</div><div class="md3-tile-value">{{ formatDate(order.paid_at) }}</div></div>
        <div v-if="order.expires_at" class="md3-tile"><div class="md3-tile-label">{{ t('orderDetail.expiresAtLabel') }}</div><div class="md3-tile-value">{{ formatDate(order.expires_at) }}</div></div>
        <div v-if="order.canceled_at" class="md3-tile"><div class="md3-tile-label">{{ t('orderDetail.canceledAtLabel') }}</div><div class="md3-tile-value">{{ formatDate(order.canceled_at) }}</div></div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import Md3OrderItem from './Md3OrderItem.vue'
import Md3OrderFulfillment from './Md3OrderFulfillment.vue'
import { useOrderDisplayHelpers } from '../../../composables/useOrderDisplayHelpers'
import { toneClass } from '../utils'

const props = defineProps<{
  order: any
  variant: 'user' | 'guest'
  fulfillmentDownloading: boolean
}>()

const emit = defineEmits<{ (e: 'download', orderNo: string): void }>()

const { t } = useI18n()

const {
  showTimeCard, showRefundRecordsCard, refundRecords, resolvedChildStatus,
  statusLabel, statusVariant, formatDate, refundReasonText,
  formatMoney, formatDiscountMoney, hasDiscountAmount, hasAmount,
} = useOrderDisplayHelpers(toRef(props, 'order'))
</script>
