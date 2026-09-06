<template>
  <div class="md3-container pb-8 pt-4">
    <!-- Loading -->
    <div v-if="loading" class="grid gap-5">
      <div class="md3-skeleton h-5 w-64"></div>
      <div class="grid gap-6 lg:grid-cols-[460px_1fr]">
        <div class="md3-skeleton aspect-square w-full"></div>
        <div class="md3-skeleton h-[420px]"></div>
      </div>
    </div>

    <template v-else-if="product">
      <!-- 面包屑 -->
      <nav class="md3-crumbs" :aria-label="t('nav.home')" data-test="crumbs">
        <RouterLink to="/">{{ t('nav.home') }}</RouterLink>
        <ChevronRight />
        <RouterLink to="/products">{{ t('nav.products') }}</RouterLink>
        <template v-if="categoryName">
          <ChevronRight />
          <RouterLink v-if="categorySlug" :to="`/categories/${categorySlug}`">{{ categoryName }}</RouterLink>
          <span v-else>{{ categoryName }}</span>
        </template>
        <ChevronRight />
        <span class="is-current">{{ getLocalizedText(product.title) }}</span>
      </nav>

      <!-- 商品主区：图册 | 信息与购买 -->
      <section class="md3-panel mt-3 grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,440px)_1fr] lg:gap-8" data-test="detail-main">
        <div class="min-w-0">
          <div class="relative grid aspect-square w-full place-items-center overflow-hidden rounded-[var(--md-shape-md)]" :class="images.length ? 'bg-[color:var(--md-sys-color-surface-container)]' : coverTone(0)" :aria-label="t('md3.detail.gallery')">
            <img v-if="currentImage" :src="currentImage" :alt="getLocalizedText(product.title)" class="absolute inset-0 h-full w-full object-cover" />
            <Package v-else class="h-24 w-24 opacity-70" />
          </div>
          <div v-if="images.length > 1" class="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-test="gallery-thumbs">
            <button
              v-for="(img, idx) in images"
              :key="idx"
              type="button"
              class="h-16 w-16 flex-none overflow-hidden rounded-[var(--md-shape-sm)] border-2 bg-[color:var(--md-sys-color-surface-container)]"
              :class="img === currentImage ? 'border-[color:var(--md-sys-color-primary)]' : 'border-transparent'"
              :aria-label="`${idx + 1}`"
              @click="currentImage = img"
            >
              <img :src="img" :alt="`${idx + 1}`" loading="lazy" class="h-full w-full object-cover" />
            </button>
          </div>
        </div>

        <div class="min-w-0">
          <h1 class="md3-headline-s font-medium">{{ getLocalizedText(product.title) }}</h1>
          <p v-if="getLocalizedText(product.description)" class="md3-body-m mt-2 text-[color:var(--md-sys-color-on-surface-variant)]">{{ getLocalizedText(product.description) }}</p>

          <!-- 价格块 -->
          <div class="md3-price-block mt-4" data-test="price-block">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span class="md3-body-s text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('md3.detail.priceLabel') }}</span>
              <!-- 1. SKU 批发价 -->
              <template v-if="selectedSku && hasSelectedSkuWholesalePrice">
                <span class="md3-price text-[28px] leading-8">{{ formatPrice(selectedSkuWholesaleFinalPrice!, siteCurrency) }}</span>
                <span class="md3-price-strike">{{ formatPrice(selectedSku.price_amount, siteCurrency) }}</span>
                <span class="md3-badge md3-badge-success">{{ t('products.wholesaleTag') }}</span>
                <span v-if="selectedSkuWholesaleFinalIsMember" class="md3-badge md3-badge-tertiary">{{ t('products.memberPriceTag') }}</span>
              </template>
              <!-- 2. SKU 促销价 -->
              <template v-else-if="selectedSku && hasSkuPromotionPrice(selectedSku)">
                <span class="md3-price text-[28px] leading-8">{{ formatPrice(selectedSkuPromotionFinalIsMember ? selectedSkuPromotionFinalPrice! : selectedSkuPromotionPrice!, siteCurrency) }}</span>
                <span class="md3-price-strike">{{ formatPrice(selectedSku.price_amount, siteCurrency) }}</span>
                <span class="md3-badge md3-badge-error">{{ t('products.promotionTag') }}</span>
                <span v-if="selectedSkuPromotionFinalIsMember" class="md3-badge md3-badge-tertiary">{{ t('products.memberPriceTag') }}</span>
              </template>
              <!-- 3. SKU 会员价 -->
              <template v-else-if="selectedSku && hasMemberPrice">
                <span class="md3-price text-[28px] leading-8">{{ formatPrice(selectedSkuMemberPrice!, siteCurrency) }}</span>
                <span class="md3-price-strike">{{ formatPrice(selectedSku.price_amount, siteCurrency) }}</span>
                <span class="md3-badge md3-badge-tertiary">{{ t('products.memberPriceTag') }}</span>
              </template>
              <!-- 4. SKU 原价 -->
              <span v-else-if="selectedSku" class="md3-price text-[28px] leading-8">{{ formatPrice(selectedSku.price_amount, siteCurrency) }}</span>
              <!-- 5. 产品级促销 -->
              <template v-else-if="hasPromotionPrice(product)">
                <span class="md3-price text-[28px] leading-8">{{ formatPrice(getPromotionPriceAmount(product), siteCurrency) }}</span>
                <span class="md3-price-strike">{{ formatPrice(product.price_amount, siteCurrency) }}</span>
                <span class="md3-badge md3-badge-error">{{ t('products.promotionTag') }} · {{ t('products.saveAmount') }} {{ formatPrice(getPromotionSaveAmount(product), siteCurrency) }}</span>
              </template>
              <!-- 6. 产品级原价 -->
              <span v-else class="md3-price text-[28px] leading-8">{{ formatPrice(product.price_amount, siteCurrency) }}</span>
            </div>
            <div v-if="selectedSkuWholesaleRules.length" class="mt-2 flex flex-wrap items-center gap-1.5">
              <span class="md3-body-s text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('products.wholesaleRulesTitle') }}</span>
              <span v-for="tier in selectedSkuWholesaleRules" :key="`${tier.sku_id || tier.sku_code || 'all'}-${tier.min_quantity}`" class="md3-badge md3-badge-success">{{ formatWholesaleTier(tier) }}</span>
            </div>
            <div v-if="hasPromotionRules(product)" class="mt-2 flex flex-wrap items-center gap-1.5">
              <span class="md3-body-s text-[color:var(--md-sys-color-on-surface-variant)]"><Tag class="mr-1 inline h-3.5 w-3.5" />{{ t('products.promotionRulesTitle') }}</span>
              <span v-for="rule in getPromotionRules(product)" :key="rule.id" class="md3-badge md3-badge-tertiary">{{ formatPromotionRule(rule) }}</span>
            </div>
          </div>

          <!-- 属性行 -->
          <dl class="mt-4 grid gap-2">
            <div class="flex items-center gap-3">
              <dt class="md3-body-s w-14 flex-none text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('md3.detail.deliveryLabel') }}</dt>
              <dd class="flex flex-wrap gap-1.5">
                <span class="md3-badge md3-badge-neutral"><component :is="product.fulfillment_type === 'auto' ? Zap : Pencil" /> {{ getFulfillmentTypeLabel(product.fulfillment_type) }}</span>
                <span class="md3-badge" :class="product.purchase_type === 'guest' ? 'md3-badge-tertiary' : 'md3-badge-primary'"><component :is="product.purchase_type === 'guest' ? UserPlus : Lock" /> {{ getPurchaseTypeLabel(product.purchase_type) }}</span>
              </dd>
            </div>
            <div class="flex items-center gap-3">
              <dt class="md3-body-s w-14 flex-none text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('md3.detail.stockLabel') }}</dt>
              <dd><span class="md3-badge" :class="stockTone">{{ getStockStatusLabel(product) }}</span></dd>
            </div>
            <div v-if="product.tags && product.tags.length" class="flex items-center gap-3">
              <dt class="md3-body-s w-14 flex-none text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('md3.detail.tagsLabel') }}</dt>
              <dd class="flex flex-wrap gap-1.5"><span v-for="(tag, i) in product.tags" :key="i" class="md3-badge md3-badge-neutral">{{ tag }}</span></dd>
            </div>
          </dl>

          <!-- 规格 -->
          <div v-if="activeSkus.length" class="mt-4" data-test="sku-picker">
            <div class="md3-body-s mb-2 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('productDetail.skuTitle') }}</div>
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
                data-test="sku-option"
                @click="selectedSkuId = normalizeSkuId(sku.id)"
              >
                <span>{{ skuDisplayText(sku) }}</span>
                <span class="md3-body-s font-normal opacity-80">{{ formatPrice(sku.price_amount, siteCurrency) }} · {{ skuStockText(sku) }}</span>
              </button>
            </div>
            <p v-if="requiresSKUSelection" class="md3-body-s mt-2 text-[color:var(--md-ext-warning)]">{{ t('productDetail.skuRequired') }}</p>
          </div>

          <!-- 数量 -->
          <div class="mt-4 flex items-center gap-3">
            <span class="md3-body-s w-14 flex-none text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('productDetail.quantity') }}</span>
            <div class="md3-stepper-qty !h-10" data-test="qty-stepper">
              <button type="button" class="!w-10" :aria-label="t('productDetail.quantity')" :disabled="quantity <= quantityEffectiveMin" data-test="qty-minus" @click="quantity = Math.max(quantityEffectiveMin, quantity - 1)"><Minus /></button>
              <input inputmode="numeric" class="!w-12" :value="quantity" :aria-label="t('productDetail.quantity')" data-test="qty-input" @change="handleQuantityInput($event)" @keydown.enter.prevent="($event.target as HTMLInputElement)?.blur()" />
              <button type="button" class="!w-10" :aria-label="t('productDetail.quantity')" :disabled="quantityEffectiveLimit !== null && quantity >= quantityEffectiveLimit" data-test="qty-plus" @click="quantity = quantity + 1"><Plus /></button>
            </div>
          </div>

          <div v-if="cannotPurchaseReason" class="md3-banner md3-banner-error mt-4"><AlertCircle /> <span>{{ cannotPurchaseReason }}</span></div>
          <div v-if="purchaseWarning" class="md3-banner md3-banner-warning mt-4"><AlertTriangle /> <span>{{ purchaseWarning }}</span></div>

          <div ref="purchaseActionsRef" class="mt-5 flex flex-wrap gap-3" data-test="purchase-actions">
            <button v-if="requiresLogin" type="button" class="md3-btn md3-btn-filled md3-btn-lg min-w-[200px]" data-test="login-to-buy" @click="goLogin">{{ t('productDetail.loginToBuy') }}</button>
            <template v-else>
              <button type="button" class="md3-btn md3-btn-filled md3-btn-lg min-w-[160px]" :disabled="!canPurchase" data-test="buy-now" @click="buyNow"><Zap /> {{ t('productDetail.buyNow') }}</button>
              <button type="button" class="md3-btn md3-btn-tonal md3-btn-lg min-w-[160px]" :disabled="!canPurchase" data-test="add-to-cart" @click="addToCart"><ShoppingCart /> {{ t('productDetail.addToCart') }}</button>
            </template>
          </div>

          <ul class="md3-body-s mt-5 grid gap-1.5 text-[color:var(--md-sys-color-on-surface-variant)]">
            <li class="flex items-start gap-2"><TicketCheck class="mt-0.5 h-4 w-4 flex-none text-[color:var(--md-ext-success)]" /><span>{{ t('md3.detail.guarantee1') }}</span></li>
            <li class="flex items-start gap-2"><KeyRound class="mt-0.5 h-4 w-4 flex-none text-[color:var(--md-ext-success)]" /><span>{{ t('md3.detail.guarantee2') }}</span></li>
            <li class="flex items-start gap-2"><AlertTriangle class="mt-0.5 h-4 w-4 flex-none text-[color:var(--md-ext-warning)]" /><span>{{ t('md3.detail.guarantee3') }}</span></li>
          </ul>
        </div>
      </section>

      <!-- 下半区：页签 | 同类推荐 + 购买保障 -->
      <section class="mt-5 grid items-start gap-5 lg:grid-cols-[1fr_300px]">
        <div class="md3-panel min-w-0">
          <div class="flex gap-1 border-b border-[color:var(--md-sys-color-outline-variant)] px-4" role="tablist" data-test="detail-tabs">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              type="button"
              role="tab"
              class="md3-title-s -mb-px border-b-[3px] px-3 py-3 transition-colors"
              :class="activeTab === tab.key ? 'border-[color:var(--md-sys-color-primary)] text-[color:var(--md-sys-color-primary)]' : 'border-transparent text-[color:var(--md-sys-color-on-surface-variant)]'"
              :aria-selected="activeTab === tab.key"
              :data-test="`tab-${tab.key}`"
              @click="activeTab = tab.key"
            >{{ tab.label }}</button>
          </div>

          <div v-show="activeTab === 'details'" class="p-5" data-test="tab-panel-details">
            <div v-if="product.content" class="md3-prose prose max-w-none dark:prose-invert prose-a:text-primary prose-img:rounded-md" v-html="processHtmlForDisplay(getLocalizedText(product.content))"></div>
            <p v-else class="md3-body-m text-[color:var(--md-sys-color-on-surface-variant)]">{{ getLocalizedText(product.description) || t('common.noContent') }}</p>
          </div>

          <div v-show="activeTab === 'notes'" class="grid gap-2 p-5" data-test="tab-panel-notes">
            <div class="md3-banner" :class="product.fulfillment_type === 'auto' ? 'md3-banner-success' : 'md3-banner-info'">
              <component :is="product.fulfillment_type === 'auto' ? Zap : Pencil" />
              <span>{{ product.fulfillment_type === 'auto' ? t('md3.detail.noteAuto') : t('md3.detail.noteManual') }}</span>
            </div>
            <div class="md3-banner md3-banner-warning"><AlertTriangle /> <span>{{ t('md3.detail.noteNoAfterSales') }}</span></div>
            <div v-if="product.purchase_type === 'guest'" class="md3-banner md3-banner-primary"><KeyRound /> <span>{{ t('md3.detail.noteLookup') }}</span></div>
            <div v-else class="md3-banner md3-banner-primary"><Lock /> <span>{{ t('md3.detail.noteMember') }}</span></div>
          </div>

          <div v-show="activeTab === 'posts'" class="p-5" data-test="tab-panel-posts">
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

        <aside class="grid gap-4">
          <div class="md3-panel" data-test="related-products">
            <div class="md3-panel-title">{{ t('md3.detail.related') }}</div>
            <div v-if="relatedProducts.length" class="py-1">
              <RouterLink v-for="rp in relatedProducts" :key="rp.id" :to="`/products/${rp.slug}`" class="md3-state flex items-center gap-3 px-4 py-2.5 text-[color:var(--md-sys-color-on-surface)]">
                <span class="relative grid h-14 w-14 flex-none place-items-center overflow-hidden rounded-[var(--md-shape-sm)] bg-[color:var(--md-sys-color-surface-container)]">
                  <img v-if="getFirstImageUrl(rp.images)" :src="getFirstImageUrl(rp.images)" :alt="getLocalizedText(rp.title)" loading="lazy" class="absolute inset-0 h-full w-full object-cover" />
                  <Package v-else class="h-6 w-6 opacity-60" />
                </span>
                <span class="min-w-0 flex-1">
                  <span class="md3-body-m line-clamp-2">{{ getLocalizedText(rp.title) }}</span>
                  <span class="md3-price block text-[15px]">{{ formatPrice(hasPromotionPrice(rp) ? getPromotionPriceAmount(rp) : rp.price_amount, siteCurrency) }}</span>
                </span>
              </RouterLink>
            </div>
            <p v-else class="md3-body-s px-4 py-3 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('common.noContent') }}</p>
          </div>
          <div class="md3-panel">
            <div class="md3-panel-title">{{ t('md3.detail.guarantee') }}</div>
            <div class="grid gap-3 p-4">
              <div class="md3-trust"><Zap /><div><b>{{ t('md3.footer.trust1') }}</b><span>{{ t('md3.footer.trust1Desc') }}</span></div></div>
              <div class="md3-trust"><UserPlus /><div><b>{{ t('md3.footer.trust3') }}</b><span>{{ t('md3.footer.trust3Desc') }}</span></div></div>
              <div class="md3-trust"><ShieldCheck /><div><b>{{ t('md3.footer.trust4') }}</b><span>{{ t('md3.footer.trust4Desc') }}</span></div></div>
            </div>
          </div>
        </aside>
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
import { computed, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  AlertCircle, AlertTriangle, ChevronRight, KeyRound, Lock, Minus, Package, Pencil, Plus,
  RotateCw, ShieldCheck, ShoppingCart, Tag, TicketCheck, UserPlus, Zap,
} from 'lucide-vue-next'
import { productAPI } from '../../api'
import { processHtmlForDisplay } from '../../utils/content'
import { getFirstImageUrl } from '../../utils/image'
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
  hasSkuPromotionPrice,
  hasPromotionRules, getPromotionRules,
  formatPromotionRule, formatWholesaleTier, formatRelatedPostDate, normalizeSkuId,
  loading, product, relatedPosts, currentImage, selectedSkuId, quantity, purchaseWarning,
  activeSkus, selectedSku,
  selectedSkuMemberPrice, hasMemberPrice,
  hasSelectedSkuWholesalePrice, selectedSkuWholesaleFinalIsMember, selectedSkuWholesaleFinalPrice,
  selectedSkuWholesaleRules,
  selectedSkuPromotionPrice, selectedSkuPromotionFinalIsMember, selectedSkuPromotionFinalPrice,
  isSkuPurchasable, skuDisplayText, skuStockText,
  quantityEffectiveLimit, quantityEffectiveMin, handleQuantityInput,
  requiresLogin, requiresSKUSelection, canPurchase, cannotPurchaseReason,
  categoryName, images,
  addToCart, buyNow, goLogin, loadProduct,
  mobileBarShowMemberPrice, mobileBarMemberPriceDisplay,
  mobileBarShowSkuPromotionPrice, mobileBarSkuPromotionPriceDisplay,
  mobileBarShowSkuPrice, mobileBarSkuPriceDisplay,
  mobileBarShowProductPromotionPrice, mobileBarProductPromotionPriceDisplay, mobileBarProductPriceDisplay,
} = useProductDetail({ onLoaded: () => { void loadRelatedProducts() } })

// 购买按钮所在的 DOM 在 loading 结束后才渲染，onLoaded 里拿不到 ref；
// 模板 ref 是响应式的，元素一出现就挂 IntersectionObserver，切换商品时也会重挂。
watch(purchaseActionsRef, (el) => { if (el) setupMobileBarObserver() })

const categorySlug = computed(() => String(product.value?.category?.slug || ''))

const stockTone = computed(() => {
  const variant = getStockBadgeVariant(product.value?.stock_status)
  if (variant === 'destructive') return 'md3-badge-neutral'
  if (variant === 'warning') return 'md3-badge-warning'
  return 'md3-badge-success'
})

// 同类推荐：同分类下的其它商品，最多 5 个
const relatedProducts = ref<any[]>([])
const loadRelatedProducts = async () => {
  const current = product.value
  const categoryId = Number(current?.category_id || current?.category?.id || 0)
  if (!current || !categoryId) {
    relatedProducts.value = []
    return
  }
  try {
    const res = await productAPI.list({ page: 1, page_size: 6, category_id: categoryId })
    relatedProducts.value = (res.data.data || []).filter((p: any) => p.id !== current.id).slice(0, 5)
  } catch (err) {
    console.error('Failed to load related products:', err)
    relatedProducts.value = []
  }
}

// 切换到别的商品（同类推荐）时回到顶部并重置页签
watch(() => product.value?.id, () => {
  activeTab.value = 'details'
  if (typeof window !== 'undefined') window.scrollTo({ top: 0 })
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>
