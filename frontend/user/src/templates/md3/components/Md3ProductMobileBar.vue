<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="visible"
      class="fixed left-0 right-0 z-30 bg-[color:var(--md-sys-color-surface-container-high)] shadow-[var(--md-elev-2)] lg:hidden"
      :style="{ bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }"
    >
      <div class="flex items-center gap-3 px-4 py-3">
        <div class="min-w-0 flex-1">
          <span v-if="showMemberPrice" class="md3-title-l block truncate font-medium tabular-nums text-[color:var(--md-sys-color-tertiary)]">{{ memberPriceDisplay }}</span>
          <span v-else-if="showSkuPromotionPrice" class="md3-title-l block truncate font-medium tabular-nums text-[color:var(--md-sys-color-primary)]">{{ skuPromotionPriceDisplay }}</span>
          <span v-else-if="showSkuPrice" class="md3-title-l block truncate font-medium tabular-nums text-[color:var(--md-sys-color-primary)]">{{ skuPriceDisplay }}</span>
          <span v-else-if="showProductPromotionPrice" class="md3-title-l block truncate font-medium tabular-nums text-[color:var(--md-sys-color-primary)]">{{ productPromotionPriceDisplay }}</span>
          <span v-else class="md3-title-l block truncate font-medium tabular-nums text-[color:var(--md-sys-color-primary)]">{{ productPriceDisplay }}</span>
        </div>
        <button v-if="requiresLogin" type="button" class="md3-btn md3-btn-filled flex-none" @click="$emit('goLogin')">{{ t('productDetail.loginToBuy') }}</button>
        <template v-else>
          <button type="button" class="md3-icon-btn md3-icon-btn-tonal flex-none" :disabled="!canPurchase" :aria-label="t('productDetail.addToCart')" @click="$emit('addToCart')"><ShoppingCart /></button>
          <button type="button" class="md3-btn md3-btn-filled flex-none" :disabled="!canPurchase" @click="$emit('buyNow')"><Zap /> {{ t('productDetail.buyNow') }}</button>
        </template>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ShoppingCart, Zap } from 'lucide-vue-next'

const { t } = useI18n()

defineProps<{
  visible: boolean
  requiresLogin: boolean
  canPurchase: boolean
  showMemberPrice: boolean
  memberPriceDisplay: string
  showSkuPromotionPrice: boolean
  skuPromotionPriceDisplay: string
  showSkuPrice: boolean
  skuPriceDisplay: string
  showProductPromotionPrice: boolean
  productPromotionPriceDisplay: string
  productPriceDisplay: string
}>()

defineEmits<{ addToCart: []; buyNow: []; goLogin: [] }>()
</script>
