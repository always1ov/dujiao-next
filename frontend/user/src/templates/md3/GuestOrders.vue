<template>
  <div class="md3-container pb-8">
    <header class="pb-4 pt-5 sm:pt-6">
      <span class="md3-badge md3-badge-primary"><ClipboardList /> {{ t('guestOrders.title') }}</span>
      <h1 class="md3-page-title mt-3">{{ t('guestOrders.title') }}</h1>
      <p class="md3-body-m mt-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('guestOrders.subtitle') }}</p>
    </header>

    <!-- 查询表单 -->
    <div class="md3-card mb-5 p-5">
      <div v-if="hasSavedAuth" class="md3-body-s mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--md-shape-md)] bg-[color:var(--md-sys-color-surface-container)] px-3.5 py-2.5 text-[color:var(--md-sys-color-on-surface-variant)]">
        <span>{{ t('guestOrders.savedHint', { email: savedAuth.email || '-' }) }}</span>
        <button type="button" class="md3-btn md3-btn-text md3-btn-sm" @click="clearSaved">{{ t('guestOrders.clearSaved') }}</button>
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <input v-model="email" type="email" class="md3-input md3-input-sm" :placeholder="t('guestOrders.emailPlaceholder')" />
        <input v-model="orderPassword" type="password" class="md3-input md3-input-sm" :placeholder="t('guestOrders.passwordPlaceholder')" />
        <input v-model="orderNo" type="text" class="md3-input md3-input-sm" :placeholder="t('guestOrders.orderNoPlaceholder')" />
        <button type="button" class="md3-btn md3-btn-filled h-11" :disabled="loading" @click="handleSearch">
          <Search /> {{ loading ? t('guestOrders.searching') : t('guestOrders.search') }}
        </button>
      </div>
      <p class="md3-body-s mt-3 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('guestOrders.tip') }}</p>
      <div v-if="error" class="md3-banner md3-banner-error mt-3.5"><AlertCircle /> <span>{{ error }}</span></div>
    </div>

    <Md3Empty v-if="orders.length === 0 && !loading" :icon="ClipboardList" :message="emptyMessage" />

    <div v-else class="grid gap-3">
      <div v-for="order in orders" :key="order.order_no" class="md3-card-outlined md3-card-interactive flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div class="grid min-w-0 gap-1">
          <div class="md3-label-m text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('orders.orderNo') }}：{{ order.order_no }}</div>
          <div class="md3-title-l font-medium tabular-nums">{{ formatMoney(order.total_amount, order.currency) }}</div>
          <div v-if="hasDiscount(order)" class="md3-body-s flex flex-wrap gap-2.5 text-[color:var(--md-sys-color-error)]">
            <span v-if="hasDiscountAmount(order.discount_amount)">{{ t('orderDetail.couponDiscountLabel') }}：{{ formatDiscountMoney(order.discount_amount, order.currency) }}</span>
            <span v-if="hasDiscountAmount(order.promotion_discount_amount)">{{ t('orderDetail.promotionDiscountLabel') }}：{{ formatDiscountMoney(order.promotion_discount_amount, order.currency) }}</span>
          </div>
          <div class="md3-body-s text-[color:var(--md-sys-color-on-surface-variant)]">{{ formatDate(order.created_at) }}</div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="md3-badge" :class="toneClass(statusVariant(order.status))">{{ statusLabel(order.status) }}</span>
          <RouterLink :to="{ name: 'guest-order-detail', params: { order_no: order.order_no } }" class="md3-btn md3-btn-outlined md3-btn-sm">
            <Eye /> {{ t('guestOrders.viewDetails') }}
          </RouterLink>
          <RouterLink v-if="order.status === 'pending_payment'" :to="`/pay?guest=1&order_no=${order.order_no}`" class="md3-btn md3-btn-filled md3-btn-sm">
            <CreditCard /> {{ t('guestOrders.payNow') }}
          </RouterLink>
        </div>
      </div>

      <Md3Pagination :page="pagination.page" :total-pages="pagination.total_page" :disabled="loading" @change="changePage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AlertCircle, ClipboardList, Search, Eye, CreditCard } from 'lucide-vue-next'
import Md3Empty from './components/Md3Empty.vue'
import Md3Pagination from './components/Md3Pagination.vue'
import { useGuestOrders } from '../../composables/useGuestOrders'
import { toneClass } from './utils'

const { t } = useI18n()

const {
  savedAuth, email, orderPassword, orderNo, loading, error, orders, pagination,
  hasSavedAuth, clearSaved, handleSearch, emptyMessage, changePage,
  statusLabel, statusVariant, formatMoney, formatDiscountMoney, hasDiscountAmount, hasDiscount, formatDate,
} = useGuestOrders()
</script>
