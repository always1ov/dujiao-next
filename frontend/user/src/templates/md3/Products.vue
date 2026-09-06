<template>
  <div class="md3-container pb-8 pt-4">
    <nav class="md3-crumbs" :aria-label="t('nav.home')" data-test="crumbs">
      <RouterLink to="/">{{ t('nav.home') }}</RouterLink>
      <ChevronRight />
      <RouterLink v-if="route.name === 'category-products'" to="/products">{{ t('nav.products') }}</RouterLink>
      <span v-else class="is-current">{{ t('nav.products') }}</span>
      <template v-if="route.name === 'category-products'">
        <ChevronRight />
        <span class="is-current">{{ selectedCategoryName || t('nav.products') }}</span>
      </template>
    </nav>

    <div class="mt-3 grid items-start gap-5 lg:grid-cols-[230px_1fr]">
      <Md3CategoryChips
        :category-groups="categoryGroups"
        :selected-category="selectedCategory"
        :expanded-parent-ids="expandedParentIds"
        @select="selectCategory"
        @toggle="toggleParentCategory"
      />

      <section class="min-w-0">
        <!-- 工具栏：标题 + 数量 | 搜索 + 视图切换 -->
        <div class="md3-panel flex flex-wrap items-center justify-between gap-3 px-4 py-3" :aria-label="t('md3.products.toolbarLabel')" data-test="products-toolbar">
          <div class="flex min-w-0 items-center gap-2">
            <h1 class="md3-title-l truncate">{{ pageTitle }}</h1>
            <span v-if="!loading" class="md3-badge md3-badge-neutral flex-none">{{ t('md3.products.resultCount', { n: products.length }) }}</span>
          </div>
          <!-- 手机：搜索框独占一行；桌面：靠右固定宽 -->
          <div class="flex w-full min-w-0 items-center gap-2 sm:w-auto">
            <label class="md3-search md3-search-sm min-w-0 flex-1 sm:w-[260px] sm:flex-none">
              <Search />
              <input v-model="searchQuery" type="search" :placeholder="t('products.searchBoxPlaceholder')" :aria-label="t('products.searchLabel')" data-test="products-search" />
              <button v-if="searchQuery" type="button" class="md3-icon-btn md3-icon-btn-sm" :aria-label="t('blog.searchClear')" data-test="products-search-clear" @click="clearSearch"><X /></button>
            </label>
            <div class="flex flex-none overflow-hidden rounded-full border border-[color:var(--md-sys-color-outline)]" role="group">
              <button type="button" class="md3-icon-btn rounded-none" :class="view === 'grid' ? 'bg-[color:var(--md-sys-color-secondary-container)] text-[color:var(--md-sys-color-on-secondary-container)]' : ''" :aria-pressed="view === 'grid'" :aria-label="t('md3.products.viewGrid')" :title="t('md3.products.viewGrid')" data-test="view-grid" @click="setView('grid')"><LayoutGrid /></button>
              <button type="button" class="md3-icon-btn rounded-none" :class="view === 'list' ? 'bg-[color:var(--md-sys-color-secondary-container)] text-[color:var(--md-sys-color-on-secondary-container)]' : ''" :aria-pressed="view === 'list'" :aria-label="t('md3.products.viewList')" :title="t('md3.products.viewList')" data-test="view-list" @click="setView('list')"><List /></button>
            </div>
          </div>
        </div>

        <div class="mt-4">
          <div v-if="loading" :class="view === 'grid' ? 'grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4' : 'grid gap-2'">
            <div v-for="i in 8" :key="i" class="md3-skeleton" :class="view === 'grid' ? 'h-[300px]' : 'h-[96px]'"></div>
          </div>

          <template v-else-if="products.length">
            <div v-if="view === 'grid'" class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4" data-test="products-grid">
              <Md3ProductCard v-for="(product, idx) in products" :key="product.id" :product="product" :index="idx" @quick-buy="openQuickBuy" />
            </div>
            <div v-else class="grid gap-2" data-test="products-list">
              <Md3ProductListItem v-for="(product, idx) in products" :key="product.id" :product="product" :index="idx" @quick-buy="openQuickBuy" />
            </div>
            <Md3Pagination :page="currentPage" :total-pages="totalPages" @change="changePage" />
          </template>

          <Md3Empty
            v-else
            :icon="searchQuery || selectedCategory ? SearchX : PackageOpen"
            :message="(searchQuery || selectedCategory) ? t('products.emptyFiltered') : t('products.empty')"
          >
            <button v-if="searchQuery || selectedCategory" type="button" class="md3-btn md3-btn-outlined md3-btn-sm" data-test="clear-filters" @click="resetFilters">{{ t('products.clearFilters') }}</button>
          </Md3Empty>
        </div>
      </section>
    </div>

    <ProductQuickBuy v-if="quickBuyProduct" :product="quickBuyProduct" :visible="quickBuyVisible" @update:visible="quickBuyVisible = $event" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ChevronRight, LayoutGrid, List, PackageOpen, Search, SearchX, X } from 'lucide-vue-next'
import { useProductList } from '../../composables/useProductList'
import { usePageSeo } from '../../composables/usePageSeo'
import { useLocalized } from '../../composables/useProduct'
import type { PublicCategory } from '../../utils/category'
import Md3ProductCard from './components/Md3ProductCard.vue'
import Md3ProductListItem from './components/Md3ProductListItem.vue'
import Md3CategoryChips from './components/Md3CategoryChips.vue'
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
  expandedParentIds, categoryGroups, categoryMap,
  selectCategory, toggleParentCategory, changePage, clearSearch, initialize, cleanup,
} = useProductList({ pageSize: 20, homeRouteName: 'products' })

const catName = (cat: PublicCategory) => getLocalizedText(cat.name) || cat.slug || ''

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
  return t('md3.products.allTitle')
})

const resetFilters = () => {
  clearSearch()
  selectCategory(null)
}

// 顶栏搜索框跳过来带 ?search=，进入后或再次搜索时都同步到本页筛选
watch(() => route.query.search, (value) => {
  const next = String(value || '').trim()
  if (next !== searchQuery.value.trim()) searchQuery.value = next
})

usePageSeo({
  canonicalPath: () => route.path,
  title: () => pageTitle.value,
})

onMounted(() => {
  const initial = String(route.query.search || '').trim()
  if (initial) searchQuery.value = initial
  void initialize()
})
onUnmounted(() => cleanup())
</script>
