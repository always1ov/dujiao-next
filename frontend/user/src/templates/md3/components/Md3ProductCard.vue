<template>
  <RouterLink
    :to="`/products/${product.slug}`"
    class="md3-card md3-card-interactive group flex h-full flex-col overflow-hidden"
    :class="{ 'opacity-60': soldOut }"
  >
    <!-- 封面 -->
    <span class="relative block aspect-[4/3] w-full overflow-hidden" :class="coverClass">
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
        <span
          v-for="(tag, i) in product.tags.slice(0, 2)"
          :key="i"
          class="md3-badge truncate bg-[color:var(--md-sys-color-surface)]/90 text-[color:var(--md-sys-color-on-surface)] backdrop-blur-sm"
        >{{ tag }}</span>
      </span>
      <span v-if="soldOut" class="absolute inset-0 z-[2] grid place-items-center bg-[color:var(--md-sys-color-scrim)]/45">
        <span class="md3-badge md3-badge-neutral">{{ t('products.stockStatus.outOfStock') }}</span>
      </span>
    </span>

    <!-- 内容 -->
    <span class="flex flex-1 flex-col gap-2 p-4">
      <span v-if="categoryName" class="md3-label-m truncate text-[color:var(--md-sys-color-on-surface-variant)]">{{ categoryName }}</span>
      <h3 class="md3-title-m line-clamp-2">{{ title }}</h3>

      <span class="flex flex-wrap items-center gap-1.5">
        <span class="md3-badge md3-badge-neutral">
          <component :is="product.fulfillment_type === 'auto' ? Zap : Pencil" />
          {{ getFulfillmentTypeLabel(product.fulfillment_type) }}
        </span>
        <span class="md3-badge" :class="product.purchase_type === 'guest' ? 'md3-badge-tertiary' : 'md3-badge-primary'">
          <component :is="product.purchase_type === 'guest' ? UserPlus : Lock" />
          {{ getPurchaseTypeLabel(product.purchase_type) }}
        </span>
        <span class="md3-badge" :class="stockPill.tone">
          <component :is="stockPill.icon" />
          {{ stockPill.label }}
        </span>
      </span>

      <span class="mt-auto flex items-center justify-between gap-2 pt-2">
        <span class="flex min-w-0 flex-col gap-1">
          <span class="flex flex-wrap items-baseline gap-x-1.5">
            <template v-if="promo">
              <span class="whitespace-nowrap text-[18px] font-medium leading-6 tabular-nums text-[color:var(--md-sys-color-primary)]">{{ formatPrice(getPromotionPriceAmount(product), siteCurrency) }}</span>
              <span class="md3-body-s text-[color:var(--md-sys-color-outline)] line-through">{{ formatPrice(product.price_amount, siteCurrency) }}</span>
            </template>
            <span v-else class="whitespace-nowrap text-[18px] font-medium leading-6 tabular-nums">{{ formatPrice(product.price_amount, siteCurrency) }}</span>
          </span>
          <span v-if="priceSignal" class="md3-badge w-fit" :class="priceSignal.tone">{{ priceSignal.label }}</span>
        </span>
        <button
          v-if="!soldOut"
          type="button"
          class="md3-icon-btn md3-icon-btn-tonal flex-none"
          :aria-label="t('products.quickBuyAria')"
          :title="t('products.quickBuy')"
          @click.prevent.stop="$emit('quickBuy', product)"
        >
          <ShoppingCart />
        </button>
      </span>
    </span>
  </RouterLink>
</template>

<script setup lang="ts">
import { Lock, Package, Pencil, ShoppingCart, UserPlus, Zap } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { useProductCard } from '../useProductCard'

const props = withDefaults(defineProps<{ product: any; index?: number }>(), { index: 0 })

defineEmits<{ quickBuy: [product: any] }>()

const { t } = useI18n()

const {
  title, categoryName, soldOut, promo, coverClass, coverImage, imageErrored, stockPill, priceSignal,
  siteCurrency, formatPrice, getPromotionPriceAmount, getPurchaseTypeLabel, getFulfillmentTypeLabel,
} = useProductCard(() => props.product, () => props.index ?? 0)
</script>
