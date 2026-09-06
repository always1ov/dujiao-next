<template>
  <RouterLink
    :to="`/products/${product.slug}`"
    class="md3-card-outlined md3-card-interactive group flex items-center gap-3 p-3 sm:gap-4"
    :class="{ 'opacity-60': soldOut }"
  >
    <span class="relative grid h-16 w-16 flex-none place-items-center overflow-hidden rounded-[var(--md-shape-md)] sm:h-[72px] sm:w-[72px]" :class="coverClass">
      <img v-if="coverImage" :src="coverImage" :alt="title" loading="lazy" class="absolute inset-0 h-full w-full object-cover" @error="imageErrored = true" />
      <Package v-else class="relative z-[1] h-6 w-6 opacity-80" />
      <span v-if="soldOut" class="absolute inset-0 grid place-items-center bg-[color:var(--md-sys-color-scrim)]/50 text-[10px] font-medium text-white">{{ t('products.stockStatus.outOfStock') }}</span>
    </span>

    <span class="flex min-w-0 flex-1 flex-col gap-1">
      <span class="flex min-w-0 items-center gap-1.5">
        <span v-if="categoryName" class="md3-label-m hidden max-w-[96px] flex-none truncate text-[color:var(--md-sys-color-on-surface-variant)] sm:inline">{{ categoryName }}</span>
        <span v-if="categoryName" class="hidden flex-none text-[color:var(--md-sys-color-outline-variant)] sm:inline">·</span>
        <h3 class="md3-title-s truncate">{{ title }}</h3>
      </span>
      <span class="md3-badge w-fit" :class="stockPill.tone">
        <component :is="stockPill.icon" />
        {{ stockPill.label }}
      </span>
    </span>

    <span class="flex flex-none items-center gap-2 sm:gap-3">
      <span class="text-right">
        <template v-if="promo">
          <span class="md3-title-m block tabular-nums text-[color:var(--md-sys-color-primary)]">{{ formatPrice(getPromotionPriceAmount(product), siteCurrency) }}</span>
          <span class="md3-body-s block text-[color:var(--md-sys-color-outline)] line-through">{{ formatPrice(product.price_amount, siteCurrency) }}</span>
        </template>
        <span v-else class="md3-title-m block tabular-nums">{{ formatPrice(product.price_amount, siteCurrency) }}</span>
      </span>
      <button
        v-if="!soldOut"
        type="button"
        class="md3-icon-btn md3-icon-btn-tonal"
        :aria-label="t('products.quickBuyAria')"
        @click.prevent.stop="$emit('quickBuy', product)"
      >
        <ShoppingCart />
      </button>
      <ChevronRight class="hidden h-5 w-5 flex-none text-[color:var(--md-sys-color-on-surface-variant)] transition group-hover:translate-x-0.5 sm:block" />
    </span>
  </RouterLink>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ChevronRight, Package, ShoppingCart } from 'lucide-vue-next'
import { useProductCard } from '../useProductCard'

const props = withDefaults(defineProps<{ product: any; index?: number }>(), { index: 0 })

defineEmits<{ quickBuy: [product: any] }>()

const { t } = useI18n()

const {
  title, categoryName, soldOut, promo, coverClass, coverImage, imageErrored, stockPill,
  siteCurrency, formatPrice, getPromotionPriceAmount,
} = useProductCard(() => props.product, () => props.index ?? 0)
</script>
