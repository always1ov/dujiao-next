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
import { computed, ref, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlarmClock, Lock, Package, Pencil, ShoppingCart, UserPlus, XCircle, Zap } from 'lucide-vue-next'
import { getFirstImageUrl, getImageUrl } from '../../../utils/image'
import { useLocalized, useProductLabels } from '../../../composables/useProduct'
import { coverTone } from '../utils'

const props = withDefaults(defineProps<{ product: any; index?: number }>(), { index: 0 })

defineEmits<{ quickBuy: [product: any] }>()

const { t } = useI18n()
const { getLocalizedText, siteCurrency, formatPrice } = useLocalized()
const {
  getStockStatusLabel, getPurchaseTypeLabel, getFulfillmentTypeLabel,
  isSoldOut, hasPromotionPrice, getPromotionPriceAmount, hasWholesalePrices, hasPromotionRules,
} = useProductLabels()

const coverClass = computed(() => coverTone(props.index ?? 0))
const title = computed(() => getLocalizedText(props.product?.title))
const categoryName = computed(() => getLocalizedText(props.product?.category?.name))
const soldOut = computed(() => isSoldOut(props.product))
const promo = computed(() => hasPromotionPrice(props.product))

const imageErrored = ref(false)
const coverImage = computed(() => {
  if (imageErrored.value) return ''
  const primary = getFirstImageUrl(props.product?.images)
  if (primary) return primary
  const icon = props.product?.category?.icon
  return icon ? getImageUrl(icon) : ''
})

const stockPill = computed<{ tone: string; icon: Component; label: string }>(() => {
  if (soldOut.value) return { tone: 'md3-badge-neutral', icon: XCircle, label: t('products.stockStatus.outOfStock') }
  if (props.product?.stock_status === 'low_stock') return { tone: 'md3-badge-warning', icon: AlarmClock, label: getStockStatusLabel(props.product) }
  return { tone: 'md3-badge-success', icon: Zap, label: getStockStatusLabel(props.product) }
})

const priceSignal = computed<{ tone: string; label: string } | null>(() => {
  if (promo.value) return { tone: 'md3-badge-error', label: t('products.promotionTag') }
  if (hasWholesalePrices(props.product)) return { tone: 'md3-badge-success', label: t('products.wholesaleTag') }
  if (hasPromotionRules(props.product)) return { tone: 'md3-badge-tertiary', label: t('products.promotionBadge') }
  return null
})
</script>
