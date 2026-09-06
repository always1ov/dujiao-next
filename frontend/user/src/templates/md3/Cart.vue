<template>
  <div class="md3-container pb-8 pt-4">
    <nav class="md3-crumbs" :aria-label="t('nav.home')" data-test="crumbs">
      <RouterLink to="/">{{ t('nav.home') }}</RouterLink>
      <ChevronRight />
      <span class="is-current">{{ t('cart.title') }}</span>
    </nav>

    <div class="mt-3 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="md3-title-l">{{ t('cart.title') }}</h1>
        <p class="md3-body-s text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('cart.subtitle') }}</p>
      </div>
      <Md3CheckoutSteps current="cart" class="!mb-0" />
    </div>

    <Md3Empty v-if="cartItems.length === 0" :icon="ShoppingCart" :message="t('cart.empty')">
      <RouterLink to="/products" class="md3-btn md3-btn-filled md3-btn-sm" data-test="cart-empty-action">{{ t('cart.emptyAction') }}</RouterLink>
    </Md3Empty>

    <div v-else class="mt-4 grid items-start gap-5 lg:grid-cols-[1fr_320px]">
      <section class="min-w-0" data-test="cart-list">
        <div class="md3-table-head hidden lg:grid lg:grid-cols-[1fr_120px_150px_120px_56px]">
          <span>{{ t('md3.cart.colProduct') }}</span>
          <span>{{ t('md3.cart.colPrice') }}</span>
          <span>{{ t('md3.cart.colQty') }}</span>
          <span>{{ t('md3.cart.colSubtotal') }}</span>
          <span class="text-right">{{ t('md3.cart.colAction') }}</span>
        </div>

        <article v-for="item in cartItems" :key="cartItemKey(item)" class="md3-panel mt-2 grid gap-3 p-4 lg:grid-cols-[1fr_120px_150px_120px_56px] lg:items-center" data-test="cart-item">
          <div class="flex min-w-0 gap-3">
            <RouterLink :to="`/products/${item.slug}`" class="relative grid h-[72px] w-[72px] flex-none place-items-center overflow-hidden rounded-[var(--md-shape-sm)] bg-[color:var(--md-sys-color-surface-container-high)]">
              <img v-if="cartItemImage(item)" :src="cartItemImage(item)" :alt="getLocalizedText(item.title)" loading="lazy" class="absolute inset-0 h-full w-full object-cover" />
              <Package v-else class="h-8 w-8 text-[color:var(--md-sys-color-on-surface-variant)]" />
            </RouterLink>
            <div class="min-w-0 flex-1">
              <RouterLink :to="`/products/${item.slug}`" class="md3-body-m line-clamp-2 font-medium hover:text-[color:var(--md-sys-color-primary)]">{{ getLocalizedText(item.title) }}</RouterLink>
              <p v-if="itemSkuDisplay(item)" class="md3-body-s mt-0.5 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('cart.skuLabel') }}：{{ itemSkuDisplay(item) }}</p>
              <div class="mt-1.5 flex flex-wrap gap-1.5">
                <span class="md3-badge md3-badge-neutral">{{ item.fulfillmentType === 'auto' ? t('products.fulfillmentType.auto') : t('products.fulfillmentType.manual') }}</span>
                <span v-if="item.purchaseType !== 'guest'" class="md3-badge md3-badge-primary">{{ t('productPurchase.member') }}</span>
              </div>
              <p v-if="itemStockHint(item)" class="md3-body-s mt-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ itemStockHint(item) }}</p>
            </div>
          </div>

          <div class="flex items-center justify-between lg:block">
            <span class="md3-body-s text-[color:var(--md-sys-color-on-surface-variant)] lg:hidden">{{ t('md3.cart.colPrice') }}</span>
            <span class="md3-body-m tabular-nums">{{ formatPrice(item.priceAmount, totalCurrency) }}</span>
          </div>

          <div class="flex items-center justify-between lg:block">
            <span class="md3-body-s text-[color:var(--md-sys-color-on-surface-variant)] lg:hidden">{{ t('md3.cart.colQty') }}</span>
            <div class="md3-stepper-qty !h-9" data-test="cart-qty">
              <button type="button" class="!w-9" :aria-label="t('cart.remove')" :disabled="item.quantity <= itemPurchaseMin(item)" data-test="cart-qty-minus" @click="updateQty(item, item.quantity - 1)"><Minus /></button>
              <input type="number" class="!w-12" :value="item.quantity" :min="itemPurchaseMin(item)" :max="itemMaxQuantity(item)" data-test="cart-qty-input" @change="handleQtyChange(item, $event)" />
              <button type="button" class="!w-9" :aria-label="t('cart.remove')" :disabled="item.quantity >= itemMaxQuantity(item)" data-test="cart-qty-plus" @click="updateQty(item, item.quantity + 1)"><Plus /></button>
            </div>
          </div>

          <div class="flex items-center justify-between lg:block">
            <span class="md3-body-s text-[color:var(--md-sys-color-on-surface-variant)] lg:hidden">{{ t('md3.cart.colSubtotal') }}</span>
            <strong class="md3-price text-[16px]" data-test="cart-subtotal">{{ itemSubtotal(item) }}</strong>
          </div>

          <div class="flex justify-end">
            <button type="button" class="md3-btn md3-btn-text md3-btn-sm hover:text-[color:var(--md-sys-color-error)] lg:!px-2" :aria-label="t('cart.remove')" data-test="cart-remove" @click="removeWithUndo(item)"><Trash2 /> <span class="lg:hidden">{{ t('cart.remove') }}</span></button>
          </div>

          <div v-if="quantityWarning(item)" class="md3-banner md3-banner-warning lg:col-span-full"><AlertTriangle /> <span>{{ quantityWarning(item) }}</span></div>
        </article>

        <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
          <RouterLink to="/products" class="md3-btn md3-btn-text md3-btn-sm -ml-3" data-test="cart-continue"><ArrowLeft /> {{ t('md3.cart.continue') }}</RouterLink>
          <p class="md3-body-s text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('cart.disclaimer') }}</p>
        </div>
      </section>

      <!-- 桌面：右侧结算卡 -->
      <aside class="md3-panel hidden p-5 lg:sticky lg:top-[92px] lg:block" data-test="cart-summary">
        <h2 class="md3-title-m">{{ t('md3.cart.summaryTitle') }}</h2>
        <div class="mt-3 grid gap-2 border-b border-[color:var(--md-sys-color-outline-variant)] pb-3">
          <div class="md3-kv"><span>{{ t('cart.itemsCount') }}</span><span>{{ totalItems }}</span></div>
        </div>
        <div class="mt-3 flex items-baseline justify-between">
          <span class="md3-title-s">{{ t('cart.totalLabel') }}</span>
          <span class="md3-price text-[24px] leading-8" data-test="cart-total">{{ formatPrice(totalAmount, totalCurrency) }}</span>
        </div>
        <RouterLink to="/checkout" class="md3-btn md3-btn-filled md3-btn-lg md3-btn-block mt-4" data-test="cart-checkout">{{ t('cart.checkout') }} <ArrowRight /></RouterLink>
      </aside>

      <!-- 手机：吸底汇总条 -->
      <div class="sticky z-30 bottom-[calc(84px+env(safe-area-inset-bottom,0px))] lg:hidden">
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-[var(--md-shape-lg)] bg-[color:var(--md-sys-color-surface-container-high)] p-4 shadow-[var(--md-elev-2)]">
          <div>
            <div class="md3-label-m text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('md3.cart.summaryBar') }} · {{ t('cart.itemsCount') }} {{ totalItems }}</div>
            <div class="md3-price text-[22px] leading-7">{{ formatPrice(totalAmount, totalCurrency) }}</div>
          </div>
          <RouterLink to="/checkout" class="md3-btn md3-btn-filled md3-btn-lg" data-test="cart-checkout-mobile">{{ t('cart.checkout') }} <ArrowRight /></RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AlertTriangle, ArrowLeft, ArrowRight, ChevronRight, Minus, Package, Plus, ShoppingCart, Trash2 } from 'lucide-vue-next'
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
