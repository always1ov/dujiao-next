<template>
  <div>
    <!-- 站长配置的横幅轮播（两种模式共用） -->
    <Md3BannerHero />

    <!-- ==================== 列表模式 ==================== -->
    <template v-if="isListMode">
      <section class="md3-container py-5 sm:py-6">
        <div class="grid items-start gap-5 lg:grid-cols-[260px_1fr] lg:gap-8">
          <Md3CategoryChips
            :category-groups="categoryGroups"
            :selected-category="selectedCategory"
            :expanded-parent-ids="expandedParentIds"
            @select="selectCategory"
            @toggle="toggleParentCategory"
          />

          <main class="min-w-0">
            <label class="md3-search md3-search-sm mb-4">
              <Search />
              <input v-model="searchQuery" type="search" :placeholder="t('products.searchBoxPlaceholder')" :aria-label="t('products.searchLabel')" />
              <button v-if="searchQuery" type="button" class="md3-icon-btn md3-icon-btn-sm" :aria-label="t('blog.searchClear')" @click="clearSearch"><X /></button>
            </label>

            <div v-if="listLoading" class="space-y-2.5">
              <div v-for="i in 8" :key="i" class="md3-skeleton h-[88px]"></div>
            </div>

            <div v-else-if="listProductGroups.length" class="space-y-7">
              <div v-for="group in listProductGroups" :key="group.categoryId ?? 'uncategorized'">
                <div class="mb-3 flex items-center gap-2 px-1">
                  <img v-if="group.categoryIcon" :src="getImageUrl(group.categoryIcon)" :alt="group.categoryName" loading="lazy" class="h-6 w-6 flex-none rounded-[6px] object-cover" />
                  <span v-else class="h-6 w-1.5 flex-none rounded-full bg-[color:var(--md-sys-color-primary)]"></span>
                  <h2 class="md3-title-m min-w-0 truncate">{{ group.categoryName }}</h2>
                  <span class="md3-badge md3-badge-neutral">{{ group.products.length }}</span>
                </div>
                <div class="space-y-2">
                  <Md3ProductListItem
                    v-for="(product, idx) in group.products"
                    :key="product.id"
                    :product="product"
                    :index="idx"
                    @quick-buy="openQuickBuy"
                  />
                </div>
              </div>
              <Md3Pagination :page="listCurrentPage" :total-pages="listTotalPages" @change="listChangePage" />
            </div>

            <Md3Empty
              v-else
              :icon="(searchQuery || selectedCategory) ? SearchX : PackageOpen"
              :message="(searchQuery || selectedCategory) ? t('products.emptyFiltered') : t('products.empty')"
            >
              <button v-if="searchQuery || selectedCategory" type="button" class="md3-btn md3-btn-outlined md3-btn-sm" @click="resetFilters">{{ t('products.clearFilters') }}</button>
            </Md3Empty>
          </main>
        </div>
      </section>
    </template>

    <!-- ==================== 卡片模式（默认） ==================== -->
    <template v-else>
      <!-- 分类 -->
      <section v-if="topCategories.length" class="md3-container py-8 sm:py-10">
        <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
          <h2 class="md3-section-title">{{ t('vault.categoriesTitle') }}</h2>
          <RouterLink to="/products" class="md3-btn md3-btn-text md3-btn-sm">{{ t('vault.allCategories') }} <ChevronRight /></RouterLink>
        </div>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          <RouterLink
            v-for="(cat, idx) in topCategories"
            :key="cat.id"
            class="md3-state flex min-h-[112px] flex-col justify-between gap-3 rounded-[var(--md-shape-lg)] p-4 transition-shadow hover:shadow-[var(--md-elev-2)]"
            :class="catTone(idx)"
            :to="`/categories/${cat.slug}`"
          >
            <span class="grid h-11 w-11 place-items-center rounded-full bg-[color:var(--md-sys-color-surface)]/60">
              <img v-if="cat.icon" :src="getImageUrl(cat.icon)" :alt="catName(cat)" loading="lazy" class="h-6 w-6 object-contain" />
              <Tag v-else class="h-5 w-5" />
            </span>
            <span class="md3-title-s line-clamp-2 break-words">{{ catName(cat) }}</span>
          </RouterLink>
        </div>
      </section>

      <!-- 热门商品 -->
      <section class="md3-container py-8 sm:py-10">
        <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
          <h2 class="md3-section-title">{{ t('home.featured.title') }}</h2>
          <RouterLink to="/products" class="md3-btn md3-btn-outlined md3-btn-sm">{{ t('home.featured.viewAll') }}</RouterLink>
        </div>
        <div v-if="productsLoading" class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <div v-for="i in 10" :key="i" class="md3-skeleton h-[300px]"></div>
        </div>
        <div v-else-if="products.length" class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <Md3ProductCard v-for="(product, idx) in products" :key="product.id" :product="product" :index="idx" @quick-buy="openQuickBuy" />
        </div>
        <Md3Empty v-else :icon="PackageOpen" :message="t('home.featured.empty')" />
      </section>

      <!-- 最新动态 -->
      <section v-if="latestVisible && posts.length" class="md3-container py-8 sm:py-10">
        <div class="mb-5"><h2 class="md3-section-title">{{ t('home.latest.title') }}</h2></div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <RouterLink v-for="post in posts" :key="post.id" class="md3-card-outlined md3-card-interactive block h-full p-5" :to="`/blog/${post.slug}`">
            <span class="md3-label-m text-[color:var(--md-sys-color-on-surface-variant)]">{{ formatDate(post.published_at) }}</span>
            <h3 class="md3-title-m mt-2 line-clamp-2">{{ getLocalizedText(post.title) }}</h3>
            <p class="md3-body-m mt-2 line-clamp-2 text-[color:var(--md-sys-color-on-surface-variant)]">{{ getLocalizedText(post.summary) }}</p>
            <span class="md3-label-l mt-4 inline-flex items-center gap-1 text-[color:var(--md-sys-color-primary)]">{{ t('blog.readMore') }} <ChevronRight class="h-4 w-4" /></span>
          </RouterLink>
        </div>
      </section>
    </template>

    <ProductQuickBuy v-if="quickBuyProduct" :product="quickBuyProduct" :visible="quickBuyVisible" @update:visible="quickBuyVisible = $event" />
    <AnnouncementModal v-if="activeAnnouncement" :announcement="activeAnnouncement" :visible="announcementVisible" @update:visible="announcementVisible = $event" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ChevronRight, PackageOpen, Search, SearchX, Tag, X } from 'lucide-vue-next'
import { categoryAPI, postAPI, productAPI } from '../../api'
import { buildCategoryGroups, type PublicCategory } from '../../utils/category'
import { getImageUrl } from '../../utils/image'
import { useLocalized } from '../../composables/useProduct'
import { useProductList } from '../../composables/useProductList'
import { useProductListGroups } from '../../composables/useProductListGroups'
import { usePageSeo } from '../../composables/usePageSeo'
import { useAppStore } from '../../stores/app'
import { useNavConfig } from '../../composables/useNavConfig'
import Md3ProductCard from './components/Md3ProductCard.vue'
import Md3ProductListItem from './components/Md3ProductListItem.vue'
import Md3CategoryChips from './components/Md3CategoryChips.vue'
import Md3BannerHero from './components/Md3BannerHero.vue'
import Md3Pagination from './components/Md3Pagination.vue'
import Md3Empty from './components/Md3Empty.vue'
import ProductQuickBuy from '../../components/ProductQuickBuy.vue'
import AnnouncementModal from '../../components/AnnouncementModal.vue'
import { useAnnouncement, type HomeAnnouncement } from '../../composables/useAnnouncement'
import { coverTone } from './utils'

const route = useRoute()
const { t } = useI18n()
const { getLocalizedText } = useLocalized()
const appStore = useAppStore()

// 列表/卡片模式与内置导航开关统一走 useNavConfig，不直接读 appStore.config
const { isListMode, blogEnabled, noticeEnabled } = useNavConfig()

// ==================== 快速购买 ====================
const quickBuyProduct = ref<any>(null)
const quickBuyVisible = ref(false)
const openQuickBuy = (product: any) => {
  quickBuyProduct.value = product
  quickBuyVisible.value = true
}

// ==================== 列表模式 ====================
const {
  loading: listLoading,
  products: listProducts,
  selectedCategory,
  searchQuery,
  currentPage: listCurrentPage,
  totalPages: listTotalPages,
  expandedParentIds,
  categoryGroups,
  categoryMap: listCategoryMap,
  selectCategory,
  toggleParentCategory,
  changePage: listChangePage,
  clearSearch,
  initialize: listInitialize,
  cleanup: listCleanup,
} = useProductList({ pageSize: 20, homeRouteName: 'home' })

const listProductGroups = useProductListGroups(listProducts, listCategoryMap)

const resetFilters = () => {
  clearSearch()
  selectCategory(null)
}

// ==================== 卡片模式 ====================
const products = ref<any[]>([])
const productsLoading = ref(true)
const posts = ref<any[]>([])
const topCategories = ref<PublicCategory[]>([])

const catTone = (idx: number) => coverTone(idx)
const catName = (cat: PublicCategory) => getLocalizedText(cat.name) || cat.slug || ''

const latestVisible = computed(() => blogEnabled.value || noticeEnabled.value)

const formatDate = (value: string) => (value ? new Date(value).toLocaleDateString() : '')

// ==================== 公告弹窗 ====================
const { shouldShow } = useAnnouncement()
const activeAnnouncement = ref<HomeAnnouncement | null>(null)
const announcementVisible = ref(false)
const showAnnouncementIfNeeded = () => {
  const announcement = appStore.config?.announcement as HomeAnnouncement | undefined
  if (announcement && shouldShow(announcement)) {
    activeAnnouncement.value = announcement
    announcementVisible.value = true
  }
}

const loadProducts = async () => {
  productsLoading.value = true
  try {
    const res = await productAPI.list({ page: 1, page_size: 15 })
    products.value = res.data.data || []
  } catch (err) {
    console.error('Failed to load products:', err)
  } finally {
    productsLoading.value = false
  }
}

const loadCategories = async () => {
  try {
    const res = await categoryAPI.list()
    topCategories.value = buildCategoryGroups(res.data.data || []).slice(0, 10)
  } catch (err) {
    console.error('Failed to load categories:', err)
  }
}

const loadPosts = async () => {
  if (!latestVisible.value) return
  try {
    const params: Record<string, unknown> = { page: 1, page_size: 3 }
    if (blogEnabled.value && !noticeEnabled.value) params.type = 'blog'
    if (!blogEnabled.value && noticeEnabled.value) params.type = 'notice'
    const res = await postAPI.list(params)
    posts.value = res.data.data || []
  } catch (err) {
    console.error('Failed to load posts:', err)
  }
}

// ==================== SEO ====================
const seoCategoryName = computed(() => {
  if (!selectedCategory.value) return ''
  const cat = listCategoryMap.value.get(selectedCategory.value)
  return cat ? catName(cat) : ''
})
usePageSeo({
  canonicalPath: () => route.path,
  title: () => {
    if (route.name === 'category-products') return seoCategoryName.value || t('nav.products')
    if (route.name === 'products') return t('nav.products')
    return undefined
  },
})

onMounted(async () => {
  await appStore.loadConfig()
  if (isListMode.value) {
    await listInitialize()
  } else {
    await Promise.all([loadProducts(), loadCategories(), loadPosts()])
  }
  showAnnouncementIfNeeded()
})

onUnmounted(() => listCleanup())
</script>
