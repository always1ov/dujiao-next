<template>
  <RouterLink
    :to="`/products/${product.slug}`"
    class="md3-panel md3-card-interactive group flex h-full flex-col"
    :class="{ 'opacity-60': soldOut }"
    data-test="product-card"
  >
    <!-- 封面：电商惯用的正方形图 -->
    <span class="relative block aspect-square w-full overflow-hidden" :class="coverClass">
      <img
        v-if="coverImage"
        :src="coverImage"
        :alt="title"
        loading="lazy"
        class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-[var(--md-motion-standard)] group-hover:scale-[1.04]"
        @error="imageErrored = true"
      />
      <Package v-else class="absolute inset-0 m-auto h-14 w-14 opacity-80" />
      <span v-if="!soldOut && product.tags && product.tags.length" class="absolute left-2 top-2 z-[2] flex max-w-[85%] flex-wrap gap-1">
        <span v-for="(tag, i) in product.tags.slice(0, 2)" :key="i" class="md3-badge truncate bg-[color:var(--md-ext-price)] text-white">{{ tag }}</span>
      </span>
      <span v-if="soldOut" class="absolute inset-0 z-[2] grid place-items-center bg-[color:var(--md-sys-color-scrim)]/45">
        <span class="md3-badge md3-badge-neutral">{{ t('products.stockStatus.outOfStock') }}</span>
      </span>
    </span>

    <!-- 内容 -->
    <span class="flex flex-1 flex-col gap-1.5 p-3">
      <h3 class="md3-body-m line-clamp-2 min-h-[40px] font-medium text-[color:var(--md-sys-color-on-surface)]">{{ title }}</h3>

      <span class="flex flex-wrap items-center gap-1">
        <span class="md3-badge" :class="stockPill.tone"><component :is="stockPill.icon" /> {{ stockPill.label }}</span>
        <span class="md3-badge md3-badge-neutral"><component :is="product.fulfillment_type === 'auto' ? Zap : Pencil" /> {{ getFulfillmentTypeLabel(product.fulfillment_type) }}</span>
        <span v-if="product.purchase_type !== 'guest'" class="md3-badge md3-badge-primary"><Lock /> {{ getPurchaseTypeLabel(product.purchase_type) }}</span>
        <span v-if="priceSignal" class="md3-badge" :class="priceSignal.tone">{{ priceSignal.label }}</span>
      </span>

      <span class="mt-auto flex items-end justify-between gap-2 pt-1">
        <span class="flex min-w-0 flex-col">
          <template v-if="promo">
            <span class="md3-price whitespace-nowrap text-[18px] leading-6">{{ formatPrice(getPromotionPriceAmount(product), siteCurrency) }}</span>
            <span class="md3-price-strike">{{ formatPrice(product.price_amount, siteCurrency) }}</span>
          </template>
          <span v-else class="md3-price whitespace-nowrap text-[18px] leading-6">{{ formatPrice(product.price_amount, siteCurrency) }}</span>
        </span>
        <button
          v-if="!soldOut"
          type="button"
          class="md3-icon-btn md3-icon-btn-filled md3-icon-btn-sm flex-none"
          :aria-label="t('products.quickBuyAria')"
          :title="t('products.quickBuy')"
          data-test="quick-buy"
          @click.prevent.stop="$emit('quickBuy', product)"
        >
          <ShoppingCart />
        </button>
      </span>
    </span>
  </RouterLink>
</template>

<script setup lang="ts">
import { Lock, Package, Pencil, ShoppingCart, Zap } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useProductCard } from '../useProductCard'

const props = withDefaults(defineProps<{ product: any; index?: number }>(), { index: 0 })

defineEmits<{ quickBuy: [product: any] }>()

const { t } = useI18n()

const {
  title, soldOut, promo, coverClass, coverImage, imageErrored, stockPill, priceSignal,
  siteCurrency, formatPrice, getPromotionPriceAmount, getPurchaseTypeLabel, getFulfillmentTypeLabel,
} = useProductCard(() => props.product, () => props.index ?? 0)
</script>
