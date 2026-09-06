<template>
  <div class="md3-container pb-8">
    <div class="mx-auto max-w-[760px]">
      <header class="pb-5 pt-6 text-center sm:pt-8">
        <span class="md3-badge md3-badge-primary"><ClipboardList /> {{ t('guestOrders.title') }}</span>
        <h1 class="md3-page-title mt-3">{{ t('md3.guest.lookupTitle') }}</h1>
        <p class="md3-body-m mt-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('guestOrders.subtitle') }}</p>
      </header>

      <!-- 居中查询卡 -->
      <form class="md3-card p-5 sm:p-6" @submit.prevent="handleSearch">
        <div v-if="hasSavedAuth" class="md3-body-s mb-4 flex flex-wrap items-center justify-between gap-2 rounded-[var(--md-shape-md)] bg-[color:var(--md-sys-color-surface-container)] px-3.5 py-2.5 text-[color:var(--md-sys-color-on-surface-variant)]">
          <span>{{ t('guestOrders.savedHint', { email: savedAuth.email || '-' }) }}</span>
          <button type="button" class="md3-btn md3-btn-text md3-btn-sm" @click="clearSaved">{{ t('guestOrders.clearSaved') }}</button>
        </div>
        <div class="grid gap-3">
          <div class="grid gap-3 sm:grid-cols-2">
            <input v-model="email" type="email" autocomplete="email" class="md3-input md3-input-sm" :placeholder="t('guestOrders.emailPlaceholder')" />
            <input v-model="orderPassword" type="password" autocomplete="off" class="md3-input md3-input-sm" :placeholder="t('guestOrders.passwordPlaceholder')" />
          </div>
          <input v-model="orderNo" type="text" class="md3-input md3-input-sm" :placeholder="t('guestOrders.orderNoPlaceholder')" />
          <button type="submit" class="md3-btn md3-btn-filled md3-btn-lg md3-btn-block" :disabled="loading">
            <Search /> {{ loading ? t('guestOrders.searching') : t('guestOrders.search') }}
          </button>
        </div>
        <p class="md3-body-s mt-3 text-center text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('guestOrders.tip') }}</p>
        <div v-if="error" class="md3-banner md3-banner-error mt-3.5"><AlertCircle /> <span>{{ error }}</span></div>
      </form>

      <!-- 结果 -->
      <section class="mt-6">
        <Md3Empty v-if="orders.length === 0 && !loading" :icon="ClipboardList" :message="emptyMessage" />
        <template v-else>
          <h2 class="md3-title-m mb-3">{{ t('md3.guest.resultsTitle') }}</h2>
          <div class="grid gap-3">
            <div v-for="order in orders" :key="order.order_no" class="md3-card-outlined p-4">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="md3-label-m text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('orders.orderNo') }}：{{ order.order_no }}</div>
                  <div class="md3-title-l mt-0.5 font-medium tabular-nums">{{ formatMoney(order.total_amount, order.currency) }}</div>
                  <div v-if="hasDiscount(order)" class="md3-body-s mt-0.5 flex flex-wrap gap-2 text-[color:var(--md-sys-color-error)]">
                    <span v-if="hasDiscountAmount(order.discount_amount)">{{ t('orderDetail.couponDiscountLabel') }}：{{ formatDiscountMoney(order.discount_amount, order.currency) }}</span>
                    <span v-if="hasDiscountAmount(order.promotion_discount_amount)">{{ t('orderDetail.promotionDiscountLabel') }}：{{ formatDiscountMoney(order.promotion_discount_amount, order.currency) }}</span>
                  </div>
                  <div class="md3-body-s mt-0.5 text-[color:var(--md-sys-color-on-surface-variant)]">{{ formatDate(order.created_at) }}</div>
                </div>
                <span class="md3-badge" :class="toneClass(statusVariant(order.status))">{{ statusLabel(order.status) }}</span>
              </div>
              <div class="mt-3 flex flex-wrap gap-2 border-t border-[color:var(--md-sys-color-outline-variant)] pt-3">
                <RouterLink :to="{ name: 'guest-order-detail', params: { order_no: order.order_no } }" class="md3-btn md3-btn-outlined md3-btn-sm"><Eye /> {{ t('guestOrders.viewDetails') }}</RouterLink>
                <RouterLink v-if="order.status === 'pending_payment'" :to="`/pay?guest=1&order_no=${order.order_no}`" class="md3-btn md3-btn-filled md3-btn-sm"><CreditCard /> {{ t('guestOrders.payNow') }}</RouterLink>
              </div>
            </div>
          </div>
          <Md3Pagination :page="pagination.page" :total-pages="pagination.total_page" :disabled="loading" @change="changePage" />
        </template>
      </section>
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
