<template>
  <div class="md3-container pb-8">
    <!-- Loading -->
    <div v-if="loading" class="grid gap-6 py-6">
      <div class="md3-skeleton h-24 w-full rounded-[var(--md-shape-xl)]"></div>
      <div class="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div class="md3-skeleton aspect-[16/10] w-full rounded-[var(--md-shape-xl)]"></div>
        <div class="md3-skeleton h-[420px] rounded-[var(--md-shape-xl)]"></div>
      </div>
    </div>

    <template v-else-if="product">
      <!-- 面包屑 chips -->
      <nav class="flex flex-wrap items-center gap-1 pb-3 pt-4 sm:pt-5" :aria-label="t('nav.home')">
        <RouterLink to="/" class="md3-btn md3-btn-text md3-btn-sm -ml-3"><ArrowLeft /> {{ t('nav.home') }}</RouterLink>
        <span class="text-[color:var(--md-sys-color-outline-variant)]">/</span>
        <RouterLink to="/products" class="md3-btn md3-btn-text md3-btn-sm">{{ t('nav.products') }}</RouterLink>
        <template v-if="categoryName">
          <span class="text-[color:var(--md-sys-color-outline-variant)]">/</span>
          <span class="md3-label-l px-2 text-[color:var(--md-sys-color-on-surface-variant)]">{{ categoryName }}</span>
        </template>
      </nav>

      <!-- 全宽摘要条 -->
      <header class="rounded-[var(--md-shape-xl)] bg-[color:var(--md-sys-color-surface-container-low)] p-5 sm:p-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <h1 class="md3-headline-s sm:md3-headline-m font-medium">{{ getLocalizedText(product.title) }}</h1>
            <p v-if="getLocalizedText(product.description)" class="md3-body-m mt-2 max-w-[70ch] text-[color:var(--md-sys-color-on-surface-variant)]">{{ getLocalizedText(product.description) }}</p>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <span class="md3-badge" :class="stockTone">{{ getStockStatusLabel(product) }}</span>
            <span class="md3-badge md3-badge-neutral">
              <component :is="product.fulfillment_type === 'auto' ? Zap : Pencil" />
              {{ getFulfillmentTypeLabel(product.fulfillment_type) }}
            </span>
            <span class="md3-badge" :class="product.purchase_type === 'guest' ? 'md3-badge-tertiary' : 'md3-badge-primary'">
              <component :is="product.purchase_type === 'guest' ? UserPlus : Lock" />
              {{ getPurchaseTypeLabel(product.purchase_type) }}
            </span>
            <span v-for="(tag, i) in product.tags || []" :key="i" class="md3-badge md3-badge-neutral">{{ tag }}</span>
          </div>
        </div>
      </header>

      <section class="mt-4 grid items-start gap-4 lg:grid-cols-[1fr_380px] lg:grid-rows-[auto_1fr] lg:gap-6">
        <!-- 图册（手机第一屏，桌面左上） -->
        <div class="min-w-0 lg:col-start-1 lg:row-start-1">
          <div class="relative grid aspect-[16/10] w-full place-items-center overflow-hidden rounded-[var(--md-shape-xl)]" :class="images.length ? 'bg-[color:var(--md-sys-color-surface-container)]' : coverTone(0)" :aria-label="t('md3.detail.gallery')">
            <img v-if="currentImage" :src="currentImage" :alt="getLocalizedText(product.title)" class="absolute inset-0 h-full w-full object-cover" />
            <Package v-else class="h-24 w-24 opacity-70" />
          </div>
          <div v-if="images.length > 1" class="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              v-for="(img, idx) in images"
              :key="idx"
              type="button"
              class="h-16 w-20 flex-none overflow-hidden rounded-[var(--md-shape-md)] border-2 bg-[color:var(--md-sys-color-surface-container)]"
              :class="img === currentImage ? 'border-[color:var(--md-sys-color-primary)]' : 'border-transparent'"
              @click="currentImage = img"
            >
              <img :src="img" :alt="`${idx + 1}`" loading="lazy" class="h-full w-full object-cover" />
            </button>
          </div>
        </div>

        <!-- 购买卡（手机紧跟图册，桌面右侧吸顶并跨两行） -->
        <aside class="md3-card p-5 lg:sticky lg:top-[80px] lg:col-start-2 lg:row-start-1 lg:row-span-2">
          <h2 class="md3-title-s mb-3 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('md3.detail.buyCardTitle') }}</h2>

          <!-- 价格 -->
          <div class="mb-4">
            <div class="mb-1.5 flex flex-wrap items-center gap-1.5">
              <span v-if="(selectedSku && hasSkuPromotionPrice(selectedSku)) || (!selectedSku && hasPromotionPrice(product))" class="md3-badge md3-badge-error">{{ t('products.promotionTag') }}</span>
              <span v-if="showSelectedSkuMemberBadge" class="md3-badge md3-badge-tertiary">{{ t('products.memberPriceTag') }}</span>
              <span v-if="hasSelectedSkuWholesalePrice" class="md3-badge md3-badge-success">{{ t('products.wholesaleTag') }}</span>
            </div>
            <!-- 1. SKU 批发价 -->
            <template v-if="selectedSku && hasSelectedSkuWholesalePrice">
              <div class="flex flex-wrap items-baseline gap-2">
                <span class="md3-headline-m font-medium tabular-nums" :class="selectedSkuWholesaleFinalIsMember ? 'text-[color:var(--md-sys-color-tertiary)]' : 'text-[color:var(--md-ext-success)]'">{{ formatPrice(selectedSkuWholesaleFinalPrice!, siteCurrency) }}</span>
                <span class="md3-body-s text-[color:var(--md-sys-color-outline)] line-through">{{ formatPrice(selectedSku.price_amount, siteCurrency) }}</span>
              </div>
              <p class="md3-label-m mt-1" :class="selectedSkuWholesaleFinalIsMember ? 'text-[color:var(--md-sys-color-tertiary)]' : 'text-[color:var(--md-ext-success)]'">{{ t('products.saveAmount') }} {{ formatPrice(Number(selectedSku.price_amount) - Number(selectedSkuWholesaleFinalPrice), siteCurrency) }}</p>
            </template>
            <!-- 2. SKU 促销价 -->
            <template v-else-if="selectedSku && hasSkuPromotionPrice(selectedSku)">
              <div class="flex flex-wrap items-baseline gap-2">
                <span v-if="selectedSkuPromotionFinalIsMember" class="md3-headline-m font-medium tabular-nums text-[color:var(--md-sys-color-tertiary)]">{{ formatPrice(selectedSkuPromotionFinalPrice!, siteCurrency) }}</span>
                <span v-else class="md3-headline-m font-medium tabular-nums text-[color:var(--md-sys-color-primary)]">{{ formatPrice(selectedSkuPromotionPrice!, siteCurrency) }}</span>
                <span class="md3-body-s text-[color:var(--md-sys-color-outline)] line-through">{{ formatPrice(selectedSku.price_amount, siteCurrency) }}</span>
              </div>
              <p v-if="selectedSkuPromotionFinalIsMember" class="md3-label-m mt-1 text-[color:var(--md-sys-color-tertiary)]">{{ t('products.saveAmount') }} {{ formatPrice(Number(selectedSku.price_amount) - Number(selectedSkuPromotionFinalPrice), siteCurrency) }}</p>
              <p v-else class="md3-label-m mt-1 text-[color:var(--md-sys-color-error)]">{{ t('products.saveAmount') }} {{ formatPrice(getSkuPromotionSaveAmount(selectedSku), siteCurrency) }}</p>
            </template>
            <!-- 3. SKU 会员价 -->
            <template v-else-if="selectedSku && hasMemberPrice">
              <div class="flex flex-wrap items-baseline gap-2">
                <span class="md3-headline-m font-medium tabular-nums text-[color:var(--md-sys-color-tertiary)]">{{ formatPrice(selectedSkuMemberPrice!, siteCurrency) }}</span>
                <span class="md3-body-s text-[color:var(--md-sys-color-outline)] line-through">{{ formatPrice(selectedSku.price_amount, siteCurrency) }}</span>
              </div>
              <p class="md3-label-m mt-1 text-[color:var(--md-sys-color-tertiary)]">{{ t('products.saveAmount') }} {{ formatPrice(Number(selectedSku.price_amount) - selectedSkuMemberPrice!, siteCurrency) }}</p>
            </template>
            <!-- 4. SKU 原价 -->
            <div v-else-if="selectedSku" class="md3-headline-m font-medium tabular-nums text-[color:var(--md-sys-color-primary)]">{{ formatPrice(selectedSku.price_amount, siteCurrency) }}</div>
            <!-- 5. 产品级促销 -->
            <template v-else-if="hasPromotionPrice(product)">
              <div class="flex flex-wrap items-baseline gap-2">
                <span class="md3-headline-m font-medium tabular-nums text-[color:var(--md-sys-color-primary)]">{{ formatPrice(getPromotionPriceAmount(product), siteCurrency) }}</span>
                <span class="md3-body-s text-[color:var(--md-sys-color-outline)] line-through">{{ formatPrice(product.price_amount, siteCurrency) }}</span>
              </div>
              <p class="md3-label-m mt-1 text-[color:var(--md-sys-color-error)]">{{ t('products.saveAmount') }} {{ formatPrice(getPromotionSaveAmount(product), siteCurrency) }}</p>
            </template>
            <!-- 6. 产品级原价 -->
            <div v-else class="md3-headline-m font-medium tabular-nums text-[color:var(--md-sys-color-primary)]">{{ formatPrice(product.price_amount, siteCurrency) }}</div>
          </div>

          <!-- 批发 / 活动规则 -->
          <div v-if="selectedSkuWholesaleRules.length" class="md3-banner md3-banner-success mb-3 flex-col gap-1.5">
            <div class="md3-label-m">{{ t('products.wholesaleRulesTitle') }}</div>
            <div class="flex flex-wrap gap-1.5">
              <span v-for="tier in selectedSkuWholesaleRules" :key="`${tier.sku_id || tier.sku_code || 'all'}-${tier.min_quantity}`" class="md3-badge bg-[color:var(--md-sys-color-surface)]/70 text-inherit">{{ formatWholesaleTier(tier) }}</span>
            </div>
          </div>
          <div v-if="hasPromotionRules(product)" class="md3-banner md3-banner-primary mb-3 flex-col gap-1.5">
            <div class="md3-label-m flex items-center gap-1.5"><Tag class="h-4 w-4" /> {{ t('products.promotionRulesTitle') }}</div>
            <ul class="grid gap-0.5 pl-0"><li v-for="rule in getPromotionRules(product)" :key="rule.id" class="md3-body-s list-none">{{ formatPromotionRule(rule) }}</li></ul>
          </div>

          <!-- 规格 -->
          <div v-if="activeSkus.length" class="mb-4">
            <div class="md3-label-m mb-2 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('productDetail.skuTitle') }}</div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="sku in activeSkus"
                :key="sku.id"
                type="button"
                class="md3-chip h-auto min-w-[84px] flex-col items-start gap-0 py-2"
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
          <div class="mb-4 flex items-center justify-between gap-3">
            <span class="md3-label-m text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('productDetail.quantity') }}</span>
            <div class="md3-stepper-qty !h-10">
              <button type="button" class="!w-10" :aria-label="t('productDetail.quantity')" :disabled="quantity <= quantityEffectiveMin" @click="quantity = Math.max(quantityEffectiveMin, quantity - 1)"><Minus /></button>
              <input inputmode="numeric" class="!w-12" :value="quantity" :aria-label="t('productDetail.quantity')" @change="handleQuantityInput($event)" @keydown.enter.prevent="($event.target as HTMLInputElement)?.blur()" />
              <button type="button" class="!w-10" :aria-label="t('productDetail.quantity')" :disabled="quantityEffectiveLimit !== null && quantity >= quantityEffectiveLimit" @click="quantity = quantity + 1"><Plus /></button>
            </div>
          </div>

          <div v-if="cannotPurchaseReason" class="md3-banner md3-banner-error mb-3"><AlertCircle /> <span>{{ cannotPurchaseReason }}</span></div>
          <div v-if="purchaseWarning" class="md3-banner md3-banner-warning mb-3"><AlertTriangle /> <span>{{ purchaseWarning }}</span></div>

          <div ref="purchaseActionsRef" class="grid gap-2">
            <button v-if="requiresLogin" type="button" class="md3-btn md3-btn-filled md3-btn-lg md3-btn-block" @click="goLogin">{{ t('productDetail.loginToBuy') }}</button>
            <template v-else>
              <button type="button" class="md3-btn md3-btn-filled md3-btn-lg md3-btn-block" :disabled="!canPurchase" @click="buyNow"><Zap /> {{ t('productDetail.buyNow') }}</button>
              <button type="button" class="md3-btn md3-btn-tonal md3-btn-block" :disabled="!canPurchase" @click="addToCart"><ShoppingCart /> {{ t('productDetail.addToCart') }}</button>
            </template>
          </div>

          <p class="md3-body-s mt-4 flex items-start gap-2 text-[color:var(--md-sys-color-on-surface-variant)]">
            <TicketCheck class="mt-0.5 h-4 w-4 flex-none text-[color:var(--md-ext-success)]" />
            <span>{{ t('productDetail.deliveryReassurance') }}</span>
          </p>
        </aside>

        <!-- 分页签：详情 / 购买须知 / 相关文章（桌面左下） -->
        <div class="min-w-0 lg:col-start-1 lg:row-start-2">
          <div>
            <div class="flex gap-1 border-b border-[color:var(--md-sys-color-outline-variant)]" role="tablist">
              <button
                v-for="tab in tabs"
                :key="tab.key"
                type="button"
                role="tab"
                class="md3-title-s -mb-px border-b-[3px] px-3 py-3 transition-colors"
                :class="activeTab === tab.key ? 'border-[color:var(--md-sys-color-primary)] text-[color:var(--md-sys-color-primary)]' : 'border-transparent text-[color:var(--md-sys-color-on-surface-variant)]'"
                :aria-selected="activeTab === tab.key"
                @click="activeTab = tab.key"
              >{{ tab.label }}</button>
            </div>

            <div v-show="activeTab === 'details'" class="pt-5">
              <div v-if="product.content" class="md3-prose prose max-w-none dark:prose-invert prose-a:text-primary prose-img:rounded-md" v-html="processHtmlForDisplay(getLocalizedText(product.content))"></div>
              <p v-else class="md3-body-m text-[color:var(--md-sys-color-on-surface-variant)]">{{ getLocalizedText(product.description) || t('common.noContent') }}</p>
            </div>

            <div v-show="activeTab === 'notes'" class="grid gap-2 pt-5">
              <div class="md3-banner" :class="product.fulfillment_type === 'auto' ? 'md3-banner-success' : 'md3-banner-info'">
                <component :is="product.fulfillment_type === 'auto' ? Zap : Pencil" />
                <span>{{ product.fulfillment_type === 'auto' ? t('md3.detail.noteAuto') : t('md3.detail.noteManual') }}</span>
              </div>
              <div class="md3-banner md3-banner-warning"><AlertTriangle /> <span>{{ t('md3.detail.noteNoAfterSales') }}</span></div>
              <div v-if="product.purchase_type === 'guest'" class="md3-banner md3-banner-primary"><KeyRound /> <span>{{ t('md3.detail.noteLookup') }}</span></div>
              <div v-else class="md3-banner md3-banner-primary"><Lock /> <span>{{ t('md3.detail.noteMember') }}</span></div>
            </div>

            <div v-show="activeTab === 'posts'" class="pt-5">
              <div v-if="relatedPosts.length" class="grid gap-3 sm:grid-cols-2">
                <RouterLink v-for="rp in relatedPosts" :key="rp.id" class="md3-card-outlined md3-card-interactive block p-4" :to="`/blog/${rp.slug}`">
                  <span class="md3-label-m text-[color:var(--md-sys-color-on-surface-variant)]">{{ formatRelatedPostDate(rp.published_at) }}</span>
                  <h3 class="md3-title-s mt-1 line-clamp-2">{{ getLocalizedText(rp.title) }}</h3>
                  <p v-if="rp.summary" class="md3-body-s mt-1 line-clamp-2 text-[color:var(--md-sys-color-on-surface-variant)]">{{ getLocalizedText(rp.summary) }}</p>
                </RouterLink>
              </div>
              <p v-else class="md3-body-m text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('common.noContent') }}</p>
            </div>
          </div>
        </div>

      </section>

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
  AlertCircle, AlertTriangle, ArrowLeft, KeyRound, Lock, Minus, Package, Pencil, Plus,
  RotateCw, ShoppingCart, Tag, TicketCheck, UserPlus, Zap,
} from 'lucide-vue-next'
import { processHtmlForDisplay } from '../../utils/content'
import { useProductDetail } from '../../composables/useProductDetail'
import Md3ProductMobileBar from './components/Md3ProductMobileBar.vue'
import Md3Empty from './components/Md3Empty.vue'
import { coverTone } from './utils'

const { t } = useI18n()

type TabKey = 'details' | 'notes' | 'posts'
const activeTab = ref<TabKey>('details')
const tabs = computed<{ key: TabKey; label: string }[]>(() => [
  { key: 'details', label: t('md3.detail.tabDetails') },
  { key: 'notes', label: t('md3.detail.tabNotes') },
  { key: 'posts', label: t('md3.detail.tabPosts') },
])

// 移动端固定购买条：IntersectionObserver 监听购买按钮是否出屏
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
