<template>
  <div>
    <!-- ==================== 顶部：搜索优先 ==================== -->
    <section class="md3-container pt-4 sm:pt-6">
      <div class="grid items-stretch gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6">
        <div class="flex flex-col gap-5 rounded-[var(--md-shape-xl)] bg-[color:var(--md-sys-color-surface-container-low)] p-6 sm:p-8">
          <div>
            <p class="md3-label-l text-[color:var(--md-sys-color-primary)]">{{ brandName }}</p>
            <h1 class="md3-headline-s sm:md3-headline-m mt-2 max-w-[22ch] font-medium">{{ brandDescription || t('md3.home.tagline') }}</h1>
          </div>

          <form class="md3-search" role="search" @submit.prevent="submitSearch">
            <Search />
            <input
              v-model="heroQuery"
              type="search"
              :placeholder="t('md3.home.searchPlaceholder')"
              :aria-label="t('products.searchLabel')"
            />
            <button type="submit" class="md3-btn md3-btn-filled md3-btn-sm -mr-2 flex-none">{{ t('md3.home.searchAction') }}</button>
          </form>

          <div v-if="!isListMode" class="flex flex-wrap gap-2">
            <RouterLink to="/products" class="md3-chip md3-chip-selected"><LayoutGrid /> {{ t('md3.home.browseAll') }}</RouterLink>
            <RouterLink v-for="cat in topCategories" :key="cat.id" :to="`/categories/${cat.slug}`" class="md3-chip">
              <img v-if="cat.icon" :src="getImageUrl(cat.icon)" :alt="catName(cat)" loading="lazy" class="-ml-1 h-[18px] w-[18px] rounded-[4px] object-cover" />
              {{ catName(cat) }}
            </RouterLink>
          </div>

          <p class="md3-body-s mt-auto flex items-center gap-2 text-[color:var(--md-sys-color-on-surface-variant)]">
            <ShieldCheck class="h-4 w-4 flex-none" /> {{ t('md3.home.trustLookup') }}
          </p>
        </div>

        <!-- 右栏：有横幅放横幅卡，没有就放「怎么买」 -->
        <div class="min-h-[220px]">
          <Md3BannerHero variant="card" @loaded="hasBanners = $event" />
          <div v-if="hasBanners === false" class="flex h-full flex-col justify-center gap-4 rounded-[var(--md-shape-xl)] bg-[color:var(--md-sys-color-primary-container)] p-6 text-[color:var(--md-sys-color-on-primary-container)] sm:p-8">
            <h2 class="md3-title-l">{{ t('md3.home.howTitle') }}</h2>
            <ol class="grid gap-3">
              <li v-for="(step, idx) in steps" :key="step.key" class="flex items-start gap-3">
                <span class="md3-label-l grid h-8 w-8 flex-none place-items-center rounded-full bg-[color:var(--md-sys-color-surface)]/70 text-[color:var(--md-sys-color-primary)]">{{ idx + 1 }}</span>
                <span>
                  <span class="md3-title-s block">{{ t(`md3.home.steps.${step.key}.title`) }}</span>
                  <span class="md3-body-s block opacity-85">{{ t(`md3.home.steps.${step.key}.desc`) }}</span>
                </span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </section>

    <!-- 公告条 -->
    <section v-if="latestNotice" class="md3-container pt-4">
      <RouterLink :to="`/blog/${latestNotice.slug}`" class="md3-state flex items-center gap-3 rounded-full bg-[color:var(--md-sys-color-tertiary-container)] px-4 py-2.5 text-[color:var(--md-sys-color-on-tertiary-container)]">
        <Bell class="h-4 w-4 flex-none" />
        <span class="md3-label-m flex-none">{{ t('md3.home.noticeLabel') }}</span>
        <span class="md3-body-m min-w-0 flex-1 truncate">{{ getLocalizedText(latestNotice.title) }}</span>
        <ChevronRight class="h-4 w-4 flex-none" />
      </RouterLink>
    </section>

    <!-- ==================== 列表模式：分类 chips + 分组列表 ==================== -->
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
                  <Md3ProductListItem v-for="(product, idx) in group.products" :key="product.id" :product="product" :index="idx" @quick-buy="openQuickBuy" />
                </div>
              </div>
              <Md3Pagination :page="listCurrentPage" :total-pages="listTotalPages" @change="listChangePage" />
            </div>
            <Md3Empty v-else :icon="(searchQuery || selectedCategory) ? SearchX : PackageOpen" :message="(searchQuery || selectedCategory) ? t('products.emptyFiltered') : t('products.empty')">
              <button v-if="searchQuery || selectedCategory" type="button" class="md3-btn md3-btn-outlined md3-btn-sm" @click="resetFilters">{{ t('products.clearFilters') }}</button>
            </Md3Empty>
          </main>
        </div>
      </section>
    </template>

    <!-- ==================== 卡片模式：按分类分组的商品行 ==================== -->
    <template v-else>
      <section v-if="productsLoading" class="md3-container py-8">
        <div class="md3-skeleton mb-4 h-7 w-40"></div>
        <div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <div v-for="i in 5" :key="i" class="md3-skeleton h-[300px]"></div>
        </div>
      </section>

      <template v-else-if="productGroups.length">
        <section v-for="group in productGroups" :key="group.categoryId ?? 'uncategorized'" class="md3-container py-6 sm:py-8">
          <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div class="flex min-w-0 items-center gap-2.5">
              <img v-if="group.categoryIcon" :src="getImageUrl(group.categoryIcon)" :alt="group.categoryName" loading="lazy" class="h-7 w-7 flex-none rounded-[8px] object-cover" />
              <span v-else class="h-7 w-1.5 flex-none rounded-full bg-[color:var(--md-sys-color-primary)]"></span>
              <h2 class="md3-section-title min-w-0 truncate">{{ group.categoryName }}</h2>
              <span class="md3-badge md3-badge-neutral">{{ group.products.length }}</span>
            </div>
            <RouterLink :to="groupLink(group)" class="md3-btn md3-btn-text md3-btn-sm">{{ t('md3.home.sectionMore') }} <ChevronRight /></RouterLink>
          </div>
          <!-- 手机横向滑动，桌面网格 -->
          <div class="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 lg:pb-0 xl:grid-cols-5 [&::-webkit-scrollbar]:hidden">
            <div v-for="(product, idx) in group.products.slice(0, 10)" :key="product.id" class="w-[68vw] max-w-[260px] flex-none snap-start sm:w-[240px] lg:w-auto lg:max-w-none">
              <Md3ProductCard :product="product" :index="idx" @quick-buy="openQuickBuy" />
            </div>
          </div>
        </section>
      </template>

      <section v-else class="md3-container py-8">
        <Md3Empty :icon="PackageOpen" :message="t('home.featured.empty')" />
      </section>

      <!-- 怎么买（顶部已放横幅时才在这里展示） -->
      <section v-if="hasBanners !== false" class="md3-container py-6 sm:py-8">
        <h2 class="md3-section-title mb-4">{{ t('md3.home.howTitle') }}</h2>
        <ol class="grid gap-3 sm:grid-cols-3">
          <li v-for="(step, idx) in steps" :key="step.key" class="flex items-start gap-3 rounded-[var(--md-shape-lg)] bg-[color:var(--md-sys-color-surface-container)] p-4">
            <span class="grid h-10 w-10 flex-none place-items-center rounded-full bg-[color:var(--md-sys-color-primary-container)] text-[color:var(--md-sys-color-on-primary-container)]"><component :is="step.icon" class="h-5 w-5" /></span>
            <span>
              <span class="md3-label-m block text-[color:var(--md-sys-color-on-surface-variant)]">{{ idx + 1 }}</span>
              <span class="md3-title-s block">{{ t(`md3.home.steps.${step.key}.title`) }}</span>
              <span class="md3-body-s block text-[color:var(--md-sys-color-on-surface-variant)]">{{ t(`md3.home.steps.${step.key}.desc`) }}</span>
            </span>
          </li>
        </ol>
      </section>

      <!-- 最近更新：紧凑列表 -->
      <section v-if="latestVisible && posts.length" class="md3-container py-6 sm:py-8">
        <h2 class="md3-section-title mb-4">{{ t('md3.home.latestTitle') }}</h2>
        <div class="overflow-hidden rounded-[var(--md-shape-lg)] bg-[color:var(--md-sys-color-surface-container-low)]">
          <RouterLink v-for="post in posts" :key="post.id" :to="`/blog/${post.slug}`" class="md3-state flex items-center gap-3 border-b border-[color:var(--md-sys-color-outline-variant)] px-4 py-3.5 last:border-b-0">
            <span class="md3-badge flex-none" :class="post.type === 'notice' ? 'md3-badge-warning' : 'md3-badge-info'">{{ post.type === 'notice' ? t('nav.notice') : t('nav.blog') }}</span>
            <span class="md3-body-m min-w-0 flex-1 truncate">{{ getLocalizedText(post.title) }}</span>
            <span class="md3-body-s flex-none text-[color:var(--md-sys-color-on-surface-variant)]">{{ formatDate(post.published_at) }}</span>
            <ChevronRight class="h-4 w-4 flex-none text-[color:var(--md-sys-color-on-surface-variant)]" />
          </RouterLink>
        </div>
      </section>
    </template>

    <ProductQuickBuy v-if="quickBuyProduct" :product="quickBuyProduct" :visible="quickBuyVisible" @update:visible="quickBuyVisible = $event" />
    <AnnouncementModal v-if="activeAnnouncement" :announcement="activeAnnouncement" :visible="announcementVisible" @update:visible="announcementVisible = $event" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Bell, ChevronRight, CreditCard, LayoutGrid, PackageOpen, Search, SearchX, ShieldCheck, ShoppingBag, Zap } from 'lucide-vue-next'
import { categoryAPI, postAPI, productAPI } from '../../api'
import { buildCategoryGroups, createCategoryMap, type PublicCategory } from '../../utils/category'
import { getImageUrl } from '../../utils/image'
import { useLocalized } from '../../composables/useProduct'
import { useProductList } from '../../composables/useProductList'
import { useProductListGroups, type ProductGroup } from '../../composables/useProductListGroups'
import { useNavConfig } from '../../composables/useNavConfig'
import { usePageSeo } from '../../composables/usePageSeo'
import { useAppStore } from '../../stores/app'
import Md3ProductCard from './components/Md3ProductCard.vue'
import Md3ProductListItem from './components/Md3ProductListItem.vue'
import Md3CategoryChips from './components/Md3CategoryChips.vue'
import Md3BannerHero from './components/Md3BannerHero.vue'
import Md3Pagination from './components/Md3Pagination.vue'
import Md3Empty from './components/Md3Empty.vue'
import ProductQuickBuy from '../../components/ProductQuickBuy.vue'
import AnnouncementModal from '../../components/AnnouncementModal.vue'
import { useAnnouncement, type HomeAnnouncement } from '../../composables/useAnnouncement'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { getLocalizedText } = useLocalized()
const appStore = useAppStore()
const { isListMode, blogEnabled, noticeEnabled } = useNavConfig()

const brandName = computed(() => String(appStore.config?.brand?.site_name || '').trim())
const brandDescription = computed(() => {
  const desc = appStore.config?.brand?.site_description
  if (desc && typeof desc === 'object') {
    const val = (desc as Record<string, string>)[appStore.locale] || (desc as Record<string, string>)['zh-CN'] || ''
    return typeof val === 'string' ? val.trim() : ''
  }
  return ''
})

const steps: { key: string; icon: Component }[] = [
  { key: 'pick', icon: ShoppingBag },
  { key: 'pay', icon: CreditCard },
  { key: 'get', icon: Zap },
]

// ==================== 快速购买 ====================
const quickBuyProduct = ref<any>(null)
const quickBuyVisible = ref(false)
const openQuickBuy = (product: any) => {
  quickBuyProduct.value = product
  quickBuyVisible.value = true
}

// ==================== 列表模式（复用商品列表 composable） ====================
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

// ==================== 顶部搜索 ====================
// 列表模式：直接驱动本页的 searchQuery；卡片模式：跳到商品列表页带 search 参数
const heroQuery = ref('')
watch(heroQuery, (value) => {
  if (isListMode.value) searchQuery.value = value
})
const submitSearch = () => {
  if (isListMode.value) return
  const q = heroQuery.value.trim()
  void router.push(q ? { path: '/products', query: { search: q } } : { path: '/products' })
}

// ==================== 卡片模式：分类分组 ====================
const products = ref<any[]>([])
const productsLoading = ref(true)
const categories = ref<PublicCategory[]>([])
const categoryMap = computed(() => createCategoryMap(categories.value))
const productGroups = useProductListGroups(products, categoryMap)
const topCategories = computed(() => buildCategoryGroups(categories.value).slice(0, 8))
const catName = (cat: PublicCategory) => getLocalizedText(cat.name) || cat.slug || ''
const groupLink = (group: ProductGroup) => {
  const cat = group.categoryId !== null ? categoryMap.value.get(group.categoryId) : undefined
  return cat?.slug ? `/categories/${cat.slug}` : '/products'
}

const hasBanners = ref<boolean | null>(null)

const posts = ref<any[]>([])
const latestNotice = ref<any>(null)
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
    const res = await productAPI.list({ page: 1, page_size: 48 })
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
    categories.value = res.data.data || []
  } catch (err) {
    console.error('Failed to load categories:', err)
  }
}

const loadPosts = async () => {
  if (!latestVisible.value) return
  try {
    const params: Record<string, unknown> = { page: 1, page_size: 5 }
    if (blogEnabled.value && !noticeEnabled.value) params.type = 'blog'
    if (!blogEnabled.value && noticeEnabled.value) params.type = 'notice'
    const res = await postAPI.list(params)
    posts.value = res.data.data || []
  } catch (err) {
    console.error('Failed to load posts:', err)
  }
}

const loadLatestNotice = async () => {
  if (!noticeEnabled.value) return
  try {
    const res = await postAPI.list({ page: 1, page_size: 1, type: 'notice' })
    latestNotice.value = (res.data.data || [])[0] || null
  } catch (err) {
    console.error('Failed to load notice:', err)
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
    await Promise.all([listInitialize(), loadLatestNotice()])
  } else {
    await Promise.all([loadProducts(), loadCategories(), loadPosts(), loadLatestNotice()])
  }
  showAnnouncementIfNeeded()
})

onUnmounted(() => listCleanup())
</script>
