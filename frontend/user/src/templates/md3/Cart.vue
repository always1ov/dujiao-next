<template>
  <div class="md3-container pb-8">
    <header class="pb-4 pt-5 sm:pt-6">
      <RouterLink to="/products" class="md3-btn md3-btn-text md3-btn-sm -ml-3"><ArrowLeft /> {{ t('nav.products') }}</RouterLink>
      <h1 class="md3-page-title mt-1">{{ t('cart.title') }}</h1>
      <p class="md3-body-m mt-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('cart.subtitle') }}</p>
    </header>

    <div class="mx-auto max-w-[820px]">
      <Md3CheckoutSteps current="cart" />

      <Md3Empty v-if="cartItems.length === 0" :icon="ShoppingCart" :message="t('cart.empty')">
        <RouterLink to="/products" class="md3-btn md3-btn-filled md3-btn-sm">{{ t('cart.emptyAction') }}</RouterLink>
      </Md3Empty>

      <template v-else>
        <div class="grid gap-3">
          <article v-for="item in cartItems" :key="cartItemKey(item)" class="md3-card-outlined flex gap-4 p-4">
            <RouterLink :to="`/products/${item.slug}`" class="relative grid h-20 w-20 flex-none place-items-center overflow-hidden rounded-[var(--md-shape-md)] bg-[color:var(--md-sys-color-surface-container-high)]">
              <img v-if="cartItemImage(item)" :src="cartItemImage(item)" :alt="getLocalizedText(item.title)" loading="lazy" class="absolute inset-0 h-full w-full object-cover" />
              <Package v-else class="h-9 w-9 text-[color:var(--md-sys-color-on-surface-variant)]" />
            </RouterLink>
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <RouterLink :to="`/products/${item.slug}`" class="md3-title-m block truncate hover:text-[color:var(--md-sys-color-primary)]">{{ getLocalizedText(item.title) }}</RouterLink>
                  <p class="md3-body-s mt-0.5 text-[color:var(--md-sys-color-on-surface-variant)]">
                    {{ formatPrice(item.priceAmount, totalCurrency) }}<template v-if="itemSkuDisplay(item)"> · {{ itemSkuDisplay(item) }}</template>
                  </p>
                  <p v-if="itemStockHint(item)" class="md3-body-s mt-0.5 text-[color:var(--md-sys-color-on-surface-variant)]">{{ itemStockHint(item) }}</p>
                  <div class="mt-1.5 flex flex-wrap gap-1.5">
                    <span class="md3-badge" :class="item.purchaseType === 'guest' ? 'md3-badge-tertiary' : 'md3-badge-primary'">{{ item.purchaseType === 'guest' ? t('productPurchase.guest') : t('productPurchase.member') }}</span>
                    <span class="md3-badge md3-badge-success">{{ item.fulfillmentType === 'auto' ? t('products.fulfillmentType.auto') : t('products.fulfillmentType.manual') }}</span>
                  </div>
                </div>
                <button type="button" class="md3-icon-btn flex-none hover:text-[color:var(--md-sys-color-error)]" :aria-label="t('cart.remove')" @click="removeWithUndo(item)"><Trash2 /></button>
              </div>
              <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div class="md3-stepper-qty !h-10">
                  <button type="button" class="!w-10" :aria-label="t('cart.remove')" :disabled="item.quantity <= itemPurchaseMin(item)" @click="updateQty(item, item.quantity - 1)"><Minus /></button>
                  <input type="number" class="!w-12" :value="item.quantity" :min="itemPurchaseMin(item)" :max="itemMaxQuantity(item)" @change="handleQtyChange(item, $event)" />
                  <button type="button" class="!w-10" :aria-label="t('cart.remove')" :disabled="item.quantity >= itemMaxQuantity(item)" @click="updateQty(item, item.quantity + 1)"><Plus /></button>
                </div>
                <strong class="md3-title-m tabular-nums">{{ itemSubtotal(item) }}</strong>
              </div>
              <div v-if="quantityWarning(item)" class="md3-banner md3-banner-warning mt-3"><AlertTriangle /> <span>{{ quantityWarning(item) }}</span></div>
            </div>
          </article>
        </div>

        <p class="md3-body-s mt-4 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('cart.disclaimer') }}</p>

        <!-- 吸底汇总条：手机在底部导航栏上方，桌面贴底 -->
        <div class="sticky z-30 mt-4 bottom-[calc(88px+env(safe-area-inset-bottom,0px))] lg:bottom-4">
          <div class="flex flex-wrap items-center justify-between gap-3 rounded-[var(--md-shape-lg)] bg-[color:var(--md-sys-color-surface-container-high)] p-4 shadow-[var(--md-elev-2)]">
            <div>
              <div class="md3-label-m text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('md3.cart.summaryBar') }} · {{ t('cart.itemsCount') }} {{ totalItems }}</div>
              <div class="md3-headline-s font-medium tabular-nums text-[color:var(--md-sys-color-primary)]">{{ formatPrice(totalAmount, totalCurrency) }}</div>
            </div>
            <RouterLink to="/checkout" class="md3-btn md3-btn-filled md3-btn-lg">{{ t('cart.checkout') }} <ArrowRight /></RouterLink>
          </div>
        </div>
      </template>
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
