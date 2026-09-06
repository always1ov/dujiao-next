import { computed, ref, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlarmClock, XCircle, Zap } from 'lucide-vue-next'
import { getFirstImageUrl, getImageUrl } from '../../utils/image'
import { useLocalized, useProductLabels } from '../../composables/useProduct'
import { coverTone } from './utils'

export interface ProductPill {
  tone: string
  icon: Component
  label: string
}

/**
 * 商品卡 / 列表项共用的展示逻辑：标题、分类、封面兜底、库存 chip、价签徽章。
 * Md3ProductCard 与 Md3ProductListItem 只负责各自的版式，逻辑都在这里，改一处两处生效。
 */
export const useProductCard = (product: () => any, index: () => number = () => 0) => {
  const { t } = useI18n()
  const { getLocalizedText, siteCurrency, formatPrice } = useLocalized()
  const {
    getStockStatusLabel, getPurchaseTypeLabel, getFulfillmentTypeLabel,
    isSoldOut, hasPromotionPrice, getPromotionPriceAmount, hasWholesalePrices, hasPromotionRules,
  } = useProductLabels()

  const title = computed(() => getLocalizedText(product()?.title))
  const categoryName = computed(() => getLocalizedText(product()?.category?.name))
  const soldOut = computed(() => isSoldOut(product()))
  const promo = computed(() => hasPromotionPrice(product()))
  const coverClass = computed(() => coverTone(index()))

  // 封面：商品首图 → 分类图标 → 按索引轮换的容器色占位
  const imageErrored = ref(false)
  const coverImage = computed(() => {
    if (imageErrored.value) return ''
    const primary = getFirstImageUrl(product()?.images)
    if (primary) return primary
    const icon = product()?.category?.icon
    return icon ? getImageUrl(icon) : ''
  })

  const stockPill = computed<ProductPill>(() => {
    if (soldOut.value) return { tone: 'md3-badge-neutral', icon: XCircle, label: t('products.stockStatus.outOfStock') }
    if (product()?.stock_status === 'low_stock') return { tone: 'md3-badge-warning', icon: AlarmClock, label: getStockStatusLabel(product()) }
    return { tone: 'md3-badge-success', icon: Zap, label: getStockStatusLabel(product()) }
  })

  // 价签徽章：促销 / 批发 / 活动，择一，优先级与 classic 一致
  const priceSignal = computed<{ tone: string; label: string } | null>(() => {
    if (promo.value) return { tone: 'md3-badge-error', label: t('products.promotionTag') }
    if (hasWholesalePrices(product())) return { tone: 'md3-badge-success', label: t('products.wholesaleTag') }
    if (hasPromotionRules(product())) return { tone: 'md3-badge-tertiary', label: t('products.promotionBadge') }
    return null
  })

  return {
    title, categoryName, soldOut, promo, coverClass, coverImage, imageErrored, stockPill, priceSignal,
    siteCurrency, formatPrice, getPromotionPriceAmount, getPurchaseTypeLabel, getFulfillmentTypeLabel,
  }
}
