<template>
  <div class="md3-container pb-8">
    <!-- Loading -->
    <div v-if="loading" class="grid gap-8 py-6 lg:grid-cols-2 lg:gap-12">
      <div class="md3-skeleton aspect-[4/3] w-full rounded-[var(--md-shape-xl)]"></div>
      <div class="grid content-start gap-4 pt-2">
        <div class="md3-skeleton h-8 w-3/5"></div>
        <div class="md3-skeleton h-12 w-2/5"></div>
        <div class="md3-skeleton h-[120px]"></div>
      </div>
    </div>

    <!-- Content -->
    <template v-else-if="product">
      <nav class="md3-body-s flex flex-wrap items-center gap-1 pb-2 pt-5 text-[color:var(--md-sys-color-on-surface-variant)]">
        <RouterLink to="/" class="hover:text-[color:var(--md-sys-color-primary)]">{{ t('nav.home') }}</RouterLink>
        <ChevronRight class="h-4 w-4 flex-none" />
        <RouterLink to="/products" class="hover:text-[color:var(--md-sys-color-primary)]">{{ t('nav.products') }}</RouterLink>
        <ChevronRight class="h-4 w-4 flex-none" />
        <span class="min-w-0 truncate text-[color:var(--md-sys-color-on-surface)]">{{ getLocalizedText(product.title) }}</span>
      </nav>

      <section class="grid gap-8 py-3 lg:grid-cols-2 lg:gap-12">
        <!-- 图区 -->
        <div>
          <div class="relative grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-[var(--md-shape-xl)]" :class="images.length ? 'bg-[color:var(--md-sys-color-surface-container)]' : coverTone(0)">
            <img v-if="currentImage" :src="currentImage" :alt="getLocalizedText(product.title)" class="absolute inset-0 h-full w-full object-cover" />
            <Package v-else class="h-24 w-24 opacity-70" />
          </div>
          <div v-if="images.length > 1" class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="(img, idx) in images"
              :key="idx"
              type="button"
              class="h-16 w-20 overflow-hidden rounded-[var(--md-shape-md)] border-2 bg-[color:var(--md-sys-color-surface-container)]"
              :class="img === currentImage ? 'border-[color:var(--md-sys-color-primary)]' : 'border-transparent'"
              @click="currentImage = img"
            >
              <img :src="img" :alt="`${idx + 1}`" loading="lazy" class="h-full w-full object-cover" />
            </button>
          </div>
        </div>

        <!-- 购买区 -->
        <div>
          <span v-if="categoryName" class="md3-label-l block truncate text-[color:var(--md-sys-color-on-surface-variant)]">{{ categoryName }}</span>
          <h1 class="md3-headline-s sm:md3-headline-m my-2 font-medium">{{ getLocalizedText(product.title) }}</h1>

          <div class="mb-2 flex flex-wrap gap-1.5">
            <span class="md3-badge" :class="stockTone">{{ getStockStatusLabel(product) }}</span>
            <span class="md3-badge md3-badge-neutral">
              <component :is="product.fulfillment_type === 'auto' ? Zap : Pencil" />
              {{ getFulfillmentTypeLabel(product.fulfillment_type) }}
            </span>
            <span class="md3-badge" :class="product.purchase_type === 'guest' ? 'md3-badge-tertiary' : 'md3-badge-primary'">
              <component :is="product.purchase_type === 'guest' ? UserPlus : Lock" />
              {{ getPurchaseTypeLabel(product.purchase_type) }}
            </span>
          </div>
          <div v-if="product.tags && product.tags.length" class="mb-1 flex flex-wrap gap-1.5">
            <span v-for="(tag, i) in product.tags" :key="i" class="md3-badge md3-badge-neutral">{{ tag }}</span>
          </div>

          <!-- 价格 -->
          <div class="my-5 rounded-[var(--md-shape-lg)] bg-[color:var(--md-sys-color-surface-container-low)] p-5">
            <div class="mb-2 flex flex-wrap items-center gap-2">
              <span class="md3-label-m text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('products.price') }}</span>
              <span v-if="(selectedSku && hasSkuPromotionPrice(selectedSku)) || (!selectedSku && hasPromotionPrice(product))" class="md3-badge md3-badge-error">{{ t('products.promotionTag') }}</span>
              <span v-if="showSelectedSkuMemberBadge" class="md3-badge md3-badge-tertiary">{{ t('products.memberPriceTag') }}</span>
              <span v-if="hasSelectedSkuWholesalePrice" class="md3-badge md3-badge-success">{{ t('products.wholesaleTag') }}</span>
            </div>

            <!-- 1. SKU 批发价 -->
            <template v-if="selectedSku && hasSelectedSkuWholesalePrice">
              <div class="flex flex-wrap items-baseline gap-3">
                <span class="md3-display-s font-medium tabular-nums" :class="selectedSkuWholesaleFinalIsMember ? 'text-[color:var(--md-sys-color-tertiary)]' : 'text-[color:var(--md-ext-success)]'">{{ formatPrice(selectedSkuWholesaleFinalPrice!, siteCurrency) }}</span>
                <span class="md3-body-m text-[color:var(--md-sys-color-outline)] line-through">{{ formatPrice(selectedSku.price_amount, siteCurrency) }}</span>
              </div>
              <p class="md3-label-l mt-2" :class="selectedSkuWholesaleFinalIsMember ? 'text-[color:var(--md-sys-color-tertiary)]' : 'text-[color:var(--md-ext-success)]'">
                {{ selectedSkuWholesaleFinalIsMember ? t('products.memberPriceTag') : t('products.wholesaleTag') }} · {{ t('products.saveAmount') }} {{ formatPrice(Number(selectedSku.price_amount) - Number(selectedSkuWholesaleFinalPrice), siteCurrency) }}
              </p>
            </template>
            <!-- 2. SKU 促销价 -->
            <template v-else-if="selectedSku && hasSkuPromotionPrice(selectedSku)">
              <div class="flex flex-wrap items-baseline gap-3">
                <span v-if="selectedSkuPromotionFinalIsMember" class="md3-display-s font-medium tabular-nums text-[color:var(--md-sys-color-tertiary)]">{{ formatPrice(selectedSkuPromotionFinalPrice!, siteCurrency) }}</span>
                <span v-else class="md3-display-s font-medium tabular-nums text-[color:var(--md-sys-color-primary)]">{{ formatPrice(selectedSkuPromotionPrice!, siteCurrency) }}</span>
                <span class="md3-body-m text-[color:var(--md-sys-color-outline)] line-through">{{ formatPrice(selectedSku.price_amount, siteCurrency) }}</span>
              </div>
              <p v-if="selectedSkuPromotionFinalIsMember" class="md3-label-l mt-2 text-[color:var(--md-sys-color-tertiary)]">{{ t('products.memberPriceTag') }} · {{ t('products.saveAmount') }} {{ formatPrice(Number(selectedSku.price_amount) - Number(selectedSkuPromotionFinalPrice), siteCurrency) }}</p>
              <p v-else class="md3-label-l mt-2 text-[color:var(--md-sys-color-error)]">{{ t('products.saveAmount') }} {{ formatPrice(getSkuPromotionSaveAmount(selectedSku), siteCurrency) }}</p>
            </template>
            <!-- 3. SKU 会员价 -->
            <template v-else-if="selectedSku && hasMemberPrice">
              <div class="flex flex-wrap items-baseline gap-3">
                <span class="md3-display-s font-medium tabular-nums text-[color:var(--md-sys-color-tertiary)]">{{ formatPrice(selectedSkuMemberPrice!, siteCurrency) }}</span>
                <span class="md3-body-m text-[color:var(--md-sys-color-outline)] line-through">{{ formatPrice(selectedSku.price_amount, siteCurrency) }}</span>
              </div>
              <p class="md3-label-l mt-2 text-[color:var(--md-sys-color-tertiary)]">{{ t('products.memberPriceTag') }} · {{ t('products.saveAmount') }} {{ formatPrice(Number(selectedSku.price_amount) - selectedSkuMemberPrice!, siteCurrency) }}</p>
            </template>
            <!-- 4. SKU 原价 -->
            <div v-else-if="selectedSku" class="flex flex-wrap items-baseline gap-3">
              <span class="md3-display-s font-medium tabular-nums text-[color:var(--md-sys-color-primary)]">{{ formatPrice(selectedSku.price_amount, siteCurrency) }}</span>
            </div>
            <!-- 5. 产品级促销 -->
            <template v-else-if="hasPromotionPrice(product)">
              <div class="flex flex-wrap items-baseline gap-3">
                <span class="md3-display-s font-medium tabular-nums text-[color:var(--md-sys-color-primary)]">{{ formatPrice(getPromotionPriceAmount(product), siteCurrency) }}</span>
                <span class="md3-body-m text-[color:var(--md-sys-color-outline)] line-through">{{ formatPrice(product.price_amount, siteCurrency) }}</span>
              </div>
              <p class="md3-label-l mt-2 text-[color:var(--md-sys-color-error)]">{{ t('products.saveAmount') }} {{ formatPrice(getPromotionSaveAmount(product), siteCurrency) }}</p>
            </template>
            <!-- 6. 产品级原价 -->
            <div v-else class="flex flex-wrap items-baseline gap-3">
              <span class="md3-display-s font-medium tabular-nums text-[color:var(--md-sys-color-primary)]">{{ formatPrice(product.price_amount, siteCurrency) }}</span>
            </div>
          </div>

          <!-- 批发规则 -->
          <div v-if="selectedSkuWholesaleRules.length" class="md3-banner md3-banner-success mb-4 flex-col gap-2">
            <div class="md3-label-l">{{ t('products.wholesaleRulesTitle') }}</div>
            <div class="flex flex-wrap gap-1.5">
              <span v-for="tier in selectedSkuWholesaleRules" :key="`${tier.sku_id || tier.sku_code || 'all'}-${tier.min_quantity}`" class="md3-badge bg-[color:var(--md-sys-color-surface)]/70 text-inherit">{{ formatWholesaleTier(tier) }}</span>
            </div>
          </div>

          <!-- 活动规则 -->
          <div v-if="hasPromotionRules(product)" class="md3-banner md3-banner-primary mb-4 flex-col gap-2">
            <div class="md3-label-l flex items-center gap-1.5"><Tag class="h-4 w-4" /> {{ t('products.promotionRulesTitle') }}</div>
            <ul class="grid gap-1 pl-0">
              <li v-for="rule in getPromotionRules(product)" :key="rule.id" class="md3-body-s list-none">{{ formatPromotionRule(rule) }}</li>
            </ul>
          </div>

          <!-- 规格 -->
          <div v-if="activeSkus.length" class="my-5">
            <div class="md3-label-m mb-2.5 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('productDetail.skuTitle') }}</div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="sku in activeSkus"
                :key="sku.id"
                type="button"
                class="md3-chip h-auto min-w-[88px] flex-col items-start gap-0 py-2"
                :class="[
                  normalizeSkuId(sku.id) === selectedSkuId ? 'md3-chip-selected' : '',
                  !isSkuPurchasable(sku) ? 'cursor-not-allowed opacity-40' : '',
                ]"
                :disabled="!isSkuPurchasable(sku)"
                @click="selectedSkuId = normalizeSkuId(sku.id)"
              >
                <span>{{ skuDisplayText(sku) }}</span>
                <span class="md3-body-s font-normal opacity-80">{{ skuStockText(sku) }}</span>
              </button>
            </div>
            <p v-if="requiresSKUSelection" class="md3-body-s mt-2 text-[color:var(--md-ext-warning)]">{{ t('productDetail.skuRequired') }}</p>
          </div>

          <!-- 数量 -->
          <div class="my-5">
            <div class="md3-label-m mb-2.5 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('productDetail.quantity') }}</div>
            <div class="md3-stepper-qty">
              <button type="button" :aria-label="t('productDetail.quantity')" :disabled="quantity <= quantityEffectiveMin" @click="quantity = Math.max(quantityEffectiveMin, quantity - 1)"><Minus /></button>
              <input inputmode="numeric" :value="quantity" :aria-label="t('productDetail.quantity')" @change="handleQuantityInput($event)" @keydown.enter.prevent="($event.target as HTMLInputElement)?.blur()" />
              <button type="button" :aria-label="t('productDetail.quantity')" :disabled="quantityEffectiveLimit !== null && quantity >= quantityEffectiveLimit" @click="quantity = quantity + 1"><Plus /></button>
            </div>
          </div>

          <!-- 提示 -->
          <div v-if="cannotPurchaseReason" class="md3-banner md3-banner-error my-3"><AlertCircle /> <span>{{ cannotPurchaseReason }}</span></div>
          <div v-if="purchaseWarning" class="md3-banner md3-banner-warning my-3"><AlertTriangle /> <span>{{ purchaseWarning }}</span></div>

          <!-- 操作 -->
          <div ref="purchaseActionsRef" class="mt-5 flex flex-wrap gap-3">
            <button v-if="requiresLogin" type="button" class="md3-btn md3-btn-filled md3-btn-lg md3-btn-block" @click="goLogin">{{ t('productDetail.loginToBuy') }}</button>
            <template v-else>
              <button type="button" class="md3-btn md3-btn-filled md3-btn-lg flex-1" :disabled="!canPurchase" @click="buyNow"><Zap /> {{ t('productDetail.buyNow') }}</button>
              <button type="button" class="md3-btn md3-btn-tonal md3-btn-lg" :disabled="!canPurchase" @click="addToCart"><ShoppingCart /> {{ t('productDetail.addToCart') }}</button>
            </template>
          </div>

          <div class="md3-banner md3-banner-success mt-4 items-center">
            <TicketCheck />
            <span class="md3-label-l">{{ t('productDetail.deliveryReassurance') }}</span>
          </div>
        </div>
      </section>

      <!-- 描述 / 详情 -->
      <section v-if="getLocalizedText(product.description) || product.content" class="py-8">
        <div class="mb-5 flex gap-6 border-b border-[color:var(--md-sys-color-outline-variant)]">
          <span class="md3-title-s -mb-px border-b-[3px] border-[color:var(--md-sys-color-primary)] px-1 py-3 text-[color:var(--md-sys-color-primary)]">{{ t('productDetail.details') }}</span>
        </div>
        <div class="md3-prose prose max-w-none dark:prose-invert prose-a:text-primary prose-img:rounded-md">
          <p v-if="getLocalizedText(product.description)">{{ getLocalizedText(product.description) }}</p>
          <div v-if="product.content" v-html="processHtmlForDisplay(getLocalizedText(product.content))"></div>
        </div>
      </section>

      <!-- 相关文章 -->
      <section v-if="relatedPosts.length" class="py-8">
        <h2 class="md3-section-title mb-5">{{ t('productDetail.relatedPosts') }}</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <RouterLink v-for="rp in relatedPosts" :key="rp.id" class="md3-card-outlined md3-card-interactive block h-full p-5" :to="`/blog/${rp.slug}`">
            <span class="md3-label-m text-[color:var(--md-sys-color-on-surface-variant)]">{{ formatRelatedPostDate(rp.published_at) }}</span>
            <h3 class="md3-title-m mt-2 line-clamp-2">{{ getLocalizedText(rp.title) }}</h3>
            <p v-if="rp.summary" class="md3-body-m mt-2 line-clamp-2 text-[color:var(--md-sys-color-on-surface-variant)]">{{ getLocalizedText(rp.summary) }}</p>
            <span class="md3-label-l mt-4 inline-flex items-center gap-1 text-[color:var(--md-sys-color-primary)]">{{ t('blog.readMore') }} <ChevronRight class="h-4 w-4" /></span>
          </RouterLink>
        </div>
      </section>

      <div class="py-6 text-center">
        <RouterLink to="/products" class="md3-btn md3-btn-text"><ArrowLeft /> {{ t('productDetail.backToProducts') }}</RouterLink>
      </div>

      <!-- 移动端固定购买条 -->
      <Md3ProductMobileBar
        :visible="showMobileBar && !!product && !loading"
        :requires-login="requiresLogin"
        :can-purchase="canPurchase"
        :show-member-price="mobileBarShowMemberPrice"
        :member-price-display="mobileBarMemberPriceDisplay"
        :show-sku-promotion-price="mobileBarShowSkuPromotionPrice"
        :sku-promotion-price-display="mobileBarSkuPromotionPriceDisplay"
        :show-sku-price="mobileBarShowSkuPrice"
        :sku-price-display="mobileBarSkuPriceDisplay"
        :show-product-promotion-price="mobileBarShowProductPromotionPrice"
        :product-promotion-price-display="mobileBarProductPromotionPriceDisplay"
        :product-price-display="mobileBarProductPriceDisplay"
        @add-to-cart="addToCart"
        @buy-now="buyNow"
        @go-login="goLogin"
      />
    </template>

    <!-- 错误 -->
    <div v-else class="my-10">
      <Md3Empty :icon="AlertCircle" :message="t('productDetail.notFound')">
        <button type="button" class="md3-btn md3-btn-filled md3-btn-sm" @click="loadProduct"><RotateCw /> {{ t('errorBoundary.retry') }}</button>
        <RouterLink to="/products" class="md3-btn md3-btn-outlined md3-btn-sm">{{ t('productDetail.backToProducts') }}</RouterLink>
      </Md3Empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  AlertCircle, AlertTriangle, ArrowLeft, ChevronRight, Lock, Minus, Package, Pencil, Plus,
  RotateCw, ShoppingCart, Tag, TicketCheck, UserPlus, Zap,
} from 'lucide-vue-next'
import { processHtmlForDisplay } from '../../utils/content'
import { useProductDetail } from '../../composables/useProductDetail'
import Md3ProductMobileBar from './components/Md3ProductMobileBar.vue'
import Md3Empty from './components/Md3Empty.vue'
import { coverTone } from './utils'

const { t } = useI18n()

// 移动端固定购买条：IntersectionObserver 监听桌面购买区是否出屏
const purchaseActionsRef = ref<HTMLElement | null>(null)
const showMobileBar = ref(false)
let observer: IntersectionObserver | null = null

const setupMobileBarObserver = () => {
  if (observer) observer.disconnect()
  if (!purchaseActionsRef.value) return
  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry) showMobileBar.value = !entry.isIntersecting
    },
    { threshold: 0.1 },
  )
  observer.observe(purchaseActionsRef.value)
}

const {
  getLocalizedText, siteCurrency, formatPrice,
  getFulfillmentTypeLabel, getPurchaseTypeLabel, getStockStatusLabel, getStockBadgeVariant,
  hasPromotionPrice, getPromotionPriceAmount, getPromotionSaveAmount,
  hasSkuPromotionPrice, getSkuPromotionSaveAmount,
  hasPromotionRules, getPromotionRules,
  formatPromotionRule, formatWholesaleTier, formatRelatedPostDate, normalizeSkuId,
  loading, product, relatedPosts, currentImage, selectedSkuId, quantity, purchaseWarning,
  activeSkus, selectedSku,
  selectedSkuMemberPrice, hasMemberPrice,
  hasSelectedSkuWholesalePrice, selectedSkuWholesaleFinalIsMember, selectedSkuWholesaleFinalPrice,
  selectedSkuWholesaleRules,
  selectedSkuPromotionPrice, selectedSkuPromotionFinalIsMember, selectedSkuPromotionFinalPrice,
  showSelectedSkuMemberBadge,
  isSkuPurchasable, skuDisplayText, skuStockText,
  quantityEffectiveLimit, quantityEffectiveMin, handleQuantityInput,
  requiresLogin, requiresSKUSelection, canPurchase, cannotPurchaseReason,
  categoryName, images,
  addToCart, buyNow, goLogin, loadProduct,
  mobileBarShowMemberPrice, mobileBarMemberPriceDisplay,
  mobileBarShowSkuPromotionPrice, mobileBarSkuPromotionPriceDisplay,
  mobileBarShowSkuPrice, mobileBarSkuPriceDisplay,
  mobileBarShowProductPromotionPrice, mobileBarProductPromotionPriceDisplay, mobileBarProductPriceDisplay,
} = useProductDetail({ onLoaded: () => setupMobileBarObserver() })

const stockTone = computed(() => {
  const variant = getStockBadgeVariant(product.value?.stock_status)
  if (variant === 'destructive') return 'md3-badge-neutral'
  if (variant === 'warning') return 'md3-badge-warning'
  return 'md3-badge-success'
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>
