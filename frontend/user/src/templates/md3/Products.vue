<template>
  <div class="md3-container pb-8">
    <div class="pb-4 pt-5 sm:pt-6">
      <RouterLink to="/" class="md3-btn md3-btn-text md3-btn-sm -ml-3"><ArrowLeft /> {{ t('nav.home') }}</RouterLink>
      <h1 class="md3-page-title mt-1 break-words">{{ pageTitle }}</h1>
    </div>

    <div class="grid items-start gap-5 lg:grid-cols-[260px_1fr] lg:gap-8">
      <div class="grid min-w-0 gap-3 lg:gap-4">
        <label class="md3-search md3-search-sm">
          <Search />
          <input v-model="searchQuery" type="search" :placeholder="t('products.searchBoxPlaceholder')" :aria-label="t('products.searchLabel')" />
          <button v-if="searchQuery" type="button" class="md3-icon-btn md3-icon-btn-sm" :aria-label="t('blog.searchClear')" @click="clearSearch"><X /></button>
        </label>
        <Md3CategoryChips
          :category-groups="categoryGroups"
          :selected-category="selectedCategory"
          :expanded-parent-ids="expandedParentIds"
          @select="selectCategory"
          @toggle="toggleParentCategory"
        />
      </div>

      <section class="min-w-0">
        <div v-if="loading" class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          <div v-for="i in 8" :key="i" class="md3-skeleton h-[300px]"></div>
        </div>

        <template v-else-if="products.length">
          <div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            <Md3ProductCard v-for="(product, idx) in products" :key="product.id" :product="product" :index="idx" @quick-buy="openQuickBuy" />
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
    </div>

    <ProductQuickBuy v-if="quickBuyProduct" :product="quickBuyProduct" :visible="quickBuyVisible" @update:visible="quickBuyVisible = $event" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, PackageOpen, Search, SearchX, X } from 'lucide-vue-next'
import { useProductList } from '../../composables/useProductList'
import { usePageSeo } from '../../composables/usePageSeo'
import { useLocalized } from '../../composables/useProduct'
import type { PublicCategory } from '../../utils/category'
import Md3ProductCard from './components/Md3ProductCard.vue'
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
} = useProductList({ pageSize: 12, homeRouteName: 'products' })

const catName = (cat: PublicCategory) => getLocalizedText(cat.name) || cat.slug || ''

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

onMounted(() => { void initialize() })
onUnmounted(() => cleanup())
</script>
