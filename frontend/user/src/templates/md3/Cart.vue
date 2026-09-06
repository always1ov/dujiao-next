<template>
  <div class="md3-container pb-8">
    <header class="pb-4 pt-5 sm:pt-6">
      <RouterLink to="/" class="md3-btn md3-btn-text md3-btn-sm -ml-3"><ArrowLeft /> {{ t('nav.home') }}</RouterLink>
      <h1 class="md3-page-title mt-1">{{ t('cart.title') }}</h1>
      <p class="md3-body-m mt-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('cart.subtitle') }}</p>
    </header>

    <Md3CheckoutSteps current="cart" />

    <Md3Empty v-if="cartItems.length === 0" :icon="ShoppingCart" :message="t('cart.empty')">
      <RouterLink to="/products" class="md3-btn md3-btn-filled md3-btn-sm">{{ t('cart.emptyAction') }}</RouterLink>
    </Md3Empty>

    <div v-else class="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
      <!-- 商品列表 -->
      <div class="grid gap-3">
        <article v-for="item in cartItems" :key="cartItemKey(item)" class="md3-card-outlined flex gap-4 p-4">
          <RouterLink :to="`/products/${item.slug}`" class="relative grid h-[88px] w-[88px] flex-none place-items-center overflow-hidden rounded-[var(--md-shape-md)] bg-[color:var(--md-sys-color-surface-container-high)]">
            <img v-if="cartItemImage(item)" :src="cartItemImage(item)" :alt="getLocalizedText(item.title)" loading="lazy" class="absolute inset-0 h-full w-full object-cover" />
            <Package v-else class="h-10 w-10 text-[color:var(--md-sys-color-on-surface-variant)]" />
          </RouterLink>

          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <RouterLink :to="`/products/${item.slug}`" class="md3-title-m block truncate hover:text-[color:var(--md-sys-color-primary)]">{{ getLocalizedText(item.title) }}</RouterLink>
                <p class="md3-body-s mt-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('cart.priceLabel') }}：{{ formatPrice(item.priceAmount, totalCurrency) }}</p>
                <p v-if="itemSkuDisplay(item)" class="md3-body-s mt-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('cart.skuLabel') }}：{{ itemSkuDisplay(item) }}</p>
                <p v-if="itemStockHint(item)" class="md3-body-s mt-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ itemStockHint(item) }}</p>
                <div class="mt-2 flex flex-wrap gap-1.5">
                  <span class="md3-badge" :class="item.purchaseType === 'guest' ? 'md3-badge-tertiary' : 'md3-badge-primary'">{{ item.purchaseType === 'guest' ? t('productPurchase.guest') : t('productPurchase.member') }}</span>
                  <span class="md3-badge md3-badge-success">{{ item.fulfillmentType === 'auto' ? t('products.fulfillmentType.auto') : t('products.fulfillmentType.manual') }}</span>
                </div>
              </div>
              <button type="button" class="md3-icon-btn flex-none hover:text-[color:var(--md-sys-color-error)]" :aria-label="t('cart.remove')" @click="removeWithUndo(item)">
                <Trash2 />
              </button>
            </div>

            <div class="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--md-sys-color-outline-variant)] pt-3.5">
              <div class="md3-stepper-qty !h-10">
                <button type="button" class="!w-10" :aria-label="t('cart.remove')" :disabled="item.quantity <= itemPurchaseMin(item)" @click="updateQty(item, item.quantity - 1)"><Minus /></button>
                <input type="number" class="!w-12" :value="item.quantity" :min="itemPurchaseMin(item)" :max="itemMaxQuantity(item)" @change="handleQtyChange(item, $event)" />
                <button type="button" class="!w-10" :aria-label="t('cart.remove')" :disabled="item.quantity >= itemMaxQuantity(item)" @click="updateQty(item, item.quantity + 1)"><Plus /></button>
              </div>
              <div class="text-right">
                <span class="md3-label-m block text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('checkout.totalPriceLabel') }}</span>
                <strong class="md3-title-m">{{ itemSubtotal(item) }}</strong>
              </div>
            </div>

            <div v-if="quantityWarning(item)" class="md3-banner md3-banner-warning mt-3"><AlertTriangle /> <span>{{ quantityWarning(item) }}</span></div>
          </div>
        </article>
      </div>

      <!-- 汇总 -->
      <aside class="md3-card sticky top-[80px] p-5">
        <h2 class="md3-title-m mb-4">{{ t('cart.summaryTitle') }}</h2>
        <div class="grid gap-3">
          <div class="md3-kv"><span>{{ t('cart.itemsCount') }}</span><span>{{ totalItems }}</span></div>
          <div class="flex items-center justify-between border-t border-[color:var(--md-sys-color-outline-variant)] pt-3">
            <span class="md3-title-s">{{ t('cart.totalLabel') }}</span>
            <span class="md3-headline-s font-medium tabular-nums text-[color:var(--md-sys-color-primary)]">{{ formatPrice(totalAmount, totalCurrency) }}</span>
          </div>
        </div>
        <p class="md3-body-s my-4 rounded-[var(--md-shape-sm)] bg-[color:var(--md-sys-color-surface-container)] px-3 py-2.5 leading-relaxed text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('cart.disclaimer') }}</p>
        <RouterLink to="/checkout" class="md3-btn md3-btn-filled md3-btn-lg md3-btn-block">{{ t('cart.checkout') }} <ArrowRight /></RouterLink>
        <RouterLink to="/products" class="md3-btn md3-btn-outlined md3-btn-block mt-2.5">{{ t('cart.emptyAction') }}</RouterLink>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AlertTriangle, ArrowLeft, ArrowRight, Minus, Package, Plus, ShoppingCart, Trash2 } from 'lucide-vue-next'
import Md3CheckoutSteps from './components/Md3CheckoutSteps.vue'
import Md3Empty from './components/Md3Empty.vue'
import { useCart } from '../../composables/useCart'

const { t } = useI18n()

const {
  getLocalizedText, formatPrice, totalCurrency,
  cartItems, totalItems, totalAmount,
  cartItemKey, cartItemImage, itemSkuDisplay, itemSubtotal, itemStockHint, quantityWarning,
  itemPurchaseMin, itemMaxQuantity,
  removeWithUndo, updateQty, handleQtyChange,
} = useCart()
</script>
