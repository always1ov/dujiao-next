<template>
  <div class="md3-container pb-8">
    <header class="pb-3 pt-5 sm:pt-6">
      <RouterLink to="/" class="md3-btn md3-btn-text md3-btn-sm -ml-3"><ArrowLeft /> {{ t('nav.home') }}</RouterLink>
      <div class="mt-1 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="md3-page-title break-words">{{ pageTitle }}</h1>
          <p class="md3-body-m mt-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('products.subtitle') }}</p>
        </div>
        <span v-if="!loading && products.length" class="md3-badge md3-badge-neutral">{{ t('md3.products.resultCount', { n: products.length }) }}</span>
      </div>
    </header>

    <!-- 工具栏：搜索 + 视图切换 -->
    <div class="sticky top-16 z-20 -mx-4 lg:top-0 bg-[color:var(--md-sys-color-surface)]/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6" :aria-label="t('md3.products.toolbarLabel')">
      <div class="flex items-center gap-2">
        <label class="md3-search md3-search-sm min-w-0 flex-1">
          <Search />
          <input v-model="searchQuery" type="search" :placeholder="t('products.searchBoxPlaceholder')" :aria-label="t('products.searchLabel')" />
          <button v-if="searchQuery" type="button" class="md3-icon-btn md3-icon-btn-sm" :aria-label="t('blog.searchClear')" @click="clearSearch"><X /></button>
        </label>
        <div class="flex flex-none overflow-hidden rounded-full border border-[color:var(--md-sys-color-outline)]" role="group">
          <button type="button" class="md3-icon-btn rounded-none" :class="view === 'grid' ? 'bg-[color:var(--md-sys-color-secondary-container)] text-[color:var(--md-sys-color-on-secondary-container)]' : ''" :aria-pressed="view === 'grid'" :aria-label="t('md3.products.viewGrid')" :title="t('md3.products.viewGrid')" @click="setView('grid')"><LayoutGrid /></button>
          <button type="button" class="md3-icon-btn rounded-none" :class="view === 'list' ? 'bg-[color:var(--md-sys-color-secondary-container)] text-[color:var(--md-sys-color-on-secondary-container)]' : ''" :aria-pressed="view === 'list'" :aria-label="t('md3.products.viewList')" :title="t('md3.products.viewList')" @click="setView('list')"><List /></button>
        </div>
      </div>

      <!-- 分类 chips：一级横向滚动，选中一级且有子分类时再出一行 -->
      <div class="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
        <button type="button" class="md3-chip flex-none" :class="{ 'md3-chip-selected': selectedCategory === null }" @click="selectCategory(null)">
          <Check v-if="selectedCategory === null" /> {{ t('products.allCategories') }}
        </button>
        <button
          v-for="grp in categoryGroups"
          :key="grp.id"
          type="button"
          class="md3-chip max-w-[60vw] flex-none"
          :class="{ 'md3-chip-selected': isGroupActive(grp) }"
          @click="selectCategory(grp.id)"
        >
          <Check v-if="isGroupActive(grp)" />
          <img v-else-if="grp.icon" :src="getImageUrl(grp.icon)" :alt="catName(grp)" loading="lazy" class="-ml-1 h-[18px] w-[18px] rounded-[4px] object-cover" />
          <span class="truncate">{{ catName(grp) }}</span>
          <span v-if="grp.children.length" class="md3-body-s opacity-70">{{ grp.children.length }}</span>
        </button>
      </div>
      <div v-if="activeChildren.length" class="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
        <button
          v-for="child in activeChildren"
          :key="child.id"
          type="button"
          class="md3-chip md3-chip-sm max-w-[60vw] flex-none"
          :class="{ 'md3-chip-selected': selectedCategory === child.id }"
          @click="selectCategory(child.id)"
        >
          <Check v-if="selectedCategory === child.id" />
          <span class="truncate">{{ catName(child) }}</span>
        </button>
      </div>
    </div>

    <section class="mt-4 min-w-0">
      <div v-if="loading" :class="view === 'grid' ? 'grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid gap-2'">
        <div v-for="i in 10" :key="i" class="md3-skeleton" :class="view === 'grid' ? 'h-[300px]' : 'h-[96px]'"></div>
      </div>

      <template v-else-if="products.length">
        <div v-if="view === 'grid'" class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <Md3ProductCard v-for="(product, idx) in products" :key="product.id" :product="product" :index="idx" @quick-buy="openQuickBuy" />
        </div>
        <div v-else class="grid gap-2">
          <Md3ProductListItem v-for="(product, idx) in products" :key="product.id" :product="product" :index="idx" @quick-buy="openQuickBuy" />
        </div>
        <Md3Pagination :page="currentPage" :total-pages="totalPages" @change="changePage" />
      </template>

      <Md3Empty
        v-else
        :icon="searchQuery || selectedCategory ? SearchX : PackageOpen"
        :message="(searchQuery || selectedCategory) ? t('products.emptyFiltered') : t('products.empty')"
      >
        <button v-if="searchQuery || selectedCategory" type="button" class="md3-btn md3-btn-outlined md3-btn-sm" @click="resetFilters">{{ t('products.clearFilters') }}</button>
      </Md3Empty>
    </section>

    <ProductQuickBuy v-if="quickBuyProduct" :product="quickBuyProduct" :visible="quickBuyVisible" @update:visible="quickBuyVisible = $event" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Check, LayoutGrid, List, PackageOpen, Search, SearchX, X } from 'lucide-vue-next'
import { useProductList } from '../../composables/useProductList'
import { usePageSeo } from '../../composables/usePageSeo'
import { useLocalized } from '../../composables/useProduct'
import { getImageUrl } from '../../utils/image'
import { normalizeCategoryParentId, type CategoryGroup, type PublicCategory } from '../../utils/category'
import Md3ProductCard from './components/Md3ProductCard.vue'
import Md3ProductListItem from './components/Md3ProductListItem.vue'
import Md3Pagination from './components/Md3Pagination.vue'
import Md3Empty from './components/Md3Empty.vue'
import ProductQuickBuy from '../../components/ProductQuickBuy.vue'

const { t } = useI18n()
const route = useRoute()
const { getLocalizedText } = useLocalized()

const quickBuyProduct = ref<any>(null)
const quickBuyVisible = ref(false)
const openQuickBuy = (product: any) => {
  quickBuyProduct.value = product
  quickBuyVisible.value = true
}

const {
  loading, products, selectedCategory, searchQuery, currentPage, totalPages,
  categoryGroups, categoryMap,
  selectCategory, changePage, clearSearch, initialize, cleanup,
} = useProductList({ pageSize: 20, homeRouteName: 'products' })

const catName = (cat: PublicCategory) => getLocalizedText(cat.name) || cat.slug || ''

// 选中的一级分类（选中的是子分类时取其父级），用来决定高亮与第二行 chips
const activeGroup = computed<CategoryGroup | null>(() => {
  if (selectedCategory.value === null) return null
  const direct = categoryGroups.value.find((g) => g.id === selectedCategory.value)
  if (direct) return direct
  const selected = categoryMap.value.get(selectedCategory.value)
  const parentId = selected ? normalizeCategoryParentId(selected.parent_id) : 0
  return categoryGroups.value.find((g) => g.id === parentId) || null
})
const isGroupActive = (grp: CategoryGroup) => activeGroup.value?.id === grp.id
const activeChildren = computed(() => activeGroup.value?.children || [])

// 网格 / 列表视图，记在本机
const VIEW_KEY = 'md3-products-view'
const view = ref<'grid' | 'list'>('grid')
const setView = (next: 'grid' | 'list') => {
  view.value = next
  try { localStorage.setItem(VIEW_KEY, next) } catch { /* 忽略 */ }
}
try {
  const saved = localStorage.getItem(VIEW_KEY)
  if (saved === 'list' || saved === 'grid') view.value = saved
} catch { /* 忽略 */ }

const selectedCategoryName = computed(() => {
  if (!selectedCategory.value) return ''
  const cat = categoryMap.value.get(selectedCategory.value)
  return cat ? catName(cat) : ''
})

const pageTitle = computed(() => {
  if (route.name === 'category-products') return selectedCategoryName.value || t('nav.products')
  return t('nav.products')
})

const resetFilters = () => {
  clearSearch()
  selectCategory(null)
}

usePageSeo({
  canonicalPath: () => route.path,
  title: () => pageTitle.value,
})

onMounted(() => {
  // 首页搜索框跳过来时带 ?search=，在首次加载前写入即可生效
  const initial = String(route.query.search || '').trim()
  if (initial) searchQuery.value = initial
  void initialize()
})
onUnmounted(() => cleanup())
</script>
