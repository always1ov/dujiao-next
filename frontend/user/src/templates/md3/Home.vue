<template>
  <div>
    <!-- ==================== 首屏：分类面板 | 轮播 | 公告 + 怎么买 ==================== -->
    <section class="md3-container pt-4">
      <div class="grid items-stretch gap-4 lg:grid-cols-[220px_1fr_280px]">
        <!-- 左：分类面板（桌面） -->
        <aside v-if="!isListMode" class="md3-panel hidden lg:flex lg:flex-col" data-test="home-cat-panel">
          <div class="md3-panel-title">
            {{ t('md3.home.categoryNav') }}
            <RouterLink to="/products" class="md3-section-more">{{ t('md3.home.browseAll') }} <ChevronRight /></RouterLink>
          </div>
          <div class="flex-1 py-1">
            <RouterLink v-for="grp in categoryGroups.slice(0, 8)" :key="`side-${grp.id}`" :to="catLink(grp)" class="md3-side-cat">
              <img v-if="grp.icon" :src="getImageUrl(grp.icon)" :alt="catName(grp)" loading="lazy" />
              <Tag v-else />
              <span class="min-w-0 flex-1">
                <b class="block truncate">{{ catName(grp) }}</b>
                <small v-if="grp.children.length">{{ grp.children.map(catName).join(' / ') }}</small>
              </span>
              <ChevronRight class="h-4 w-4 flex-none text-[color:var(--md-sys-color-outline)]" />
            </RouterLink>
            <div v-if="!categoryGroups.length" class="md3-body-s px-4 py-3 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('common.noContent') }}</div>
          </div>
        </aside>

        <!-- 中：轮播。后台没配横幅时整列不显示（店主不要「马上选购」那种兜底卡），右侧面板横排占满 -->
        <div v-if="hasBanners !== false" class="min-h-[220px] min-w-0 lg:min-h-[340px]" :class="{ 'lg:col-span-2': isListMode }">
          <Md3BannerHero variant="card" @loaded="hasBanners = $event" />
        </div>

        <!-- 右：最新公告 + 怎么买（没横幅时并排铺满一行） -->
        <aside
          class="grid gap-4"
          :class="hasBanners === false ? [isListMode ? 'lg:col-span-3' : 'lg:col-span-2', noticeEnabled ? 'lg:grid-cols-2' : ''] : 'lg:grid-rows-[auto_1fr]'"
        >
          <div v-if="noticeEnabled" class="md3-panel" data-test="home-notice-panel">
            <div class="md3-panel-title">
              {{ t('md3.home.noticeTitle') }}
              <RouterLink to="/notice" class="md3-section-more">{{ t('md3.home.moreNotices') }} <ChevronRight /></RouterLink>
            </div>
            <ul v-if="notices.length" class="py-1">
              <li v-for="post in notices.slice(0, 4)" :key="post.id">
                <RouterLink :to="`/blog/${post.slug}`" class="md3-state flex items-center gap-2 px-4 py-2 text-[color:var(--md-sys-color-on-surface)]">
                  <span class="h-1.5 w-1.5 flex-none rounded-full bg-[color:var(--md-sys-color-primary)]"></span>
                  <span class="md3-body-m min-w-0 flex-1 truncate">{{ getLocalizedText(post.title) }}</span>
                  <span class="md3-body-s flex-none text-[color:var(--md-sys-color-outline)]">{{ formatDate(post.published_at) }}</span>
                </RouterLink>
              </li>
            </ul>
            <p v-else class="md3-body-s px-4 py-3 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('common.noContent') }}</p>
          </div>
          <div class="md3-panel">
            <div class="md3-panel-title">{{ t('md3.home.howTitle') }}</div>
            <ol class="grid gap-3 p-4" :class="{ 'sm:grid-cols-3': hasBanners === false && !noticeEnabled }">
              <li v-for="(step, idx) in steps" :key="step.key" class="flex items-start gap-3">
                <span class="md3-label-l grid h-7 w-7 flex-none place-items-center rounded-full bg-[color:var(--md-sys-color-primary-container)] text-[color:var(--md-sys-color-on-primary-container)]">{{ idx + 1 }}</span>
                <span class="min-w-0">
                  <span class="md3-title-s block">{{ t(`md3.home.steps.${step.key}.title`) }}</span>
                  <span class="md3-body-s block text-[color:var(--md-sys-color-on-surface-variant)]">{{ t(`md3.home.steps.${step.key}.desc`) }}</span>
                </span>
              </li>
            </ol>
          </div>
        </aside>
      </div>
    </section>

    <!-- 手机 / 平板：分类图标横向行 -->
    <section v-if="!isListMode && categoryGroups.length" class="md3-container pt-4 lg:hidden" data-test="home-cat-tiles">
      <div class="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
        <RouterLink to="/products" class="md3-cat-tile flex-none">
          <span class="md3-cat-tile-icon"><LayoutGrid /></span>
          <span>{{ t('md3.home.browseAll') }}</span>
        </RouterLink>
        <RouterLink v-for="grp in categoryGroups" :key="`tile-${grp.id}`" :to="catLink(grp)" class="md3-cat-tile flex-none">
          <span class="md3-cat-tile-icon">
            <img v-if="grp.icon" :src="getImageUrl(grp.icon)" :alt="catName(grp)" loading="lazy" />
            <Tag v-else />
          </span>
          <span class="max-w-[72px] truncate">{{ catName(grp) }}</span>
        </RouterLink>
      </div>
    </section>

    <!-- ==================== 列表模式：分类 chips + 分组列表 ==================== -->
    <template v-if="isListMode">
      <section class="md3-container py-5 sm:py-6">
        <div class="grid items-start gap-5 lg:grid-cols-[230px_1fr] lg:gap-6">
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
                <div class="md3-section-head">
                  <h2><img v-if="group.categoryIcon" :src="getImageUrl(group.categoryIcon)" :alt="group.categoryName" loading="lazy" />{{ group.categoryName }} <span class="md3-badge md3-badge-neutral">{{ group.products.length }}</span></h2>
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

    <!-- ==================== 卡片模式：热门推荐 → 分类分区 → 公告/文章 → 服务保障 ==================== -->
    <template v-else>
      <section v-if="productsLoading" class="md3-container pt-8">
        <div class="md3-skeleton mb-4 h-7 w-40"></div>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          <div v-for="i in 5" :key="i" class="md3-skeleton h-[280px]"></div>
        </div>
      </section>

      <template v-else-if="products.length">
        <section class="md3-container pt-8" data-test="home-hot">
          <div class="md3-section-head">
            <h2>{{ t('md3.home.hotTitle') }}</h2>
            <RouterLink to="/products" class="md3-section-more">{{ t('md3.home.sectionMore') }} <ChevronRight /></RouterLink>
          </div>
          <div class="grid grid-cols-2 gap-3 max-lg:[&>*:nth-child(n+7)]:hidden sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            <Md3ProductCard v-for="(product, idx) in products.slice(0, 10)" :key="product.id" :product="product" :index="idx" @quick-buy="openQuickBuy" />
          </div>
        </section>

        <section v-for="group in productGroups" :key="group.categoryId ?? 'uncategorized'" class="md3-container pt-8" data-test="home-group">
          <div class="md3-section-head">
            <h2>
              <img v-if="group.categoryIcon" :src="getImageUrl(group.categoryIcon)" :alt="group.categoryName" loading="lazy" />
              <span class="truncate">{{ group.categoryName }}</span>
              <span class="md3-badge md3-badge-neutral">{{ group.products.length }}</span>
            </h2>
            <RouterLink :to="groupLink(group)" class="md3-section-more">{{ t('md3.home.sectionMore') }} <ChevronRight /></RouterLink>
          </div>
          <!-- 手机每个分区只露 4 张（两行），桌面 10 张；其余去分类页看 -->
          <div class="grid grid-cols-2 gap-3 max-lg:[&>*:nth-child(n+5)]:hidden sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            <Md3ProductCard v-for="(product, idx) in group.products.slice(0, 10)" :key="product.id" :product="product" :index="idx" @quick-buy="openQuickBuy" />
          </div>
        </section>
      </template>

      <section v-else class="md3-container pt-8">
        <Md3Empty :icon="PackageOpen" :message="t('home.featured.empty')" />
      </section>

      <!-- 公告 / 文章 双栏 -->
      <section v-if="(noticeEnabled && notices.length) || (blogEnabled && blogs.length)" class="md3-container pt-8" data-test="home-posts">
        <div class="grid gap-4 md:grid-cols-2">
          <div v-if="noticeEnabled && notices.length" class="md3-panel">
            <div class="md3-panel-title">
              {{ t('md3.home.noticeTitle') }}
              <RouterLink to="/notice" class="md3-section-more">{{ t('md3.home.moreNotices') }} <ChevronRight /></RouterLink>
            </div>
            <ul class="py-1">
              <li v-for="post in notices" :key="`n-${post.id}`">
                <RouterLink :to="`/blog/${post.slug}`" class="md3-state flex items-center gap-3 px-4 py-2.5 text-[color:var(--md-sys-color-on-surface)]">
                  <span class="md3-badge md3-badge-warning flex-none">{{ t('nav.notice') }}</span>
                  <span class="md3-body-m min-w-0 flex-1 truncate">{{ getLocalizedText(post.title) }}</span>
                  <span class="md3-body-s flex-none text-[color:var(--md-sys-color-outline)]">{{ formatDate(post.published_at) }}</span>
                </RouterLink>
              </li>
            </ul>
          </div>
          <div v-if="blogEnabled && blogs.length" class="md3-panel">
            <div class="md3-panel-title">
              {{ t('md3.home.blogTitle') }}
              <RouterLink to="/blog" class="md3-section-more">{{ t('md3.home.moreBlog') }} <ChevronRight /></RouterLink>
            </div>
            <ul class="py-1">
              <li v-for="post in blogs" :key="`b-${post.id}`">
                <RouterLink :to="`/blog/${post.slug}`" class="md3-state flex items-center gap-3 px-4 py-2.5 text-[color:var(--md-sys-color-on-surface)]">
                  <span class="md3-badge md3-badge-info flex-none">{{ t('nav.blog') }}</span>
                  <span class="md3-body-m min-w-0 flex-1 truncate">{{ getLocalizedText(post.title) }}</span>
                  <span class="md3-body-s flex-none text-[color:var(--md-sys-color-outline)]">{{ formatDate(post.published_at) }}</span>
                </RouterLink>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- 服务保障条 -->
      <section class="md3-container pt-8" data-test="home-trust">
        <div class="md3-panel grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div class="md3-trust"><Zap /><div><b>{{ t('md3.footer.trust1') }}</b><span>{{ t('md3.footer.trust1Desc') }}</span></div></div>
          <div class="md3-trust"><CreditCard /><div><b>{{ t('md3.footer.trust2') }}</b><span>{{ t('md3.footer.trust2Desc') }}</span></div></div>
          <div class="md3-trust"><UserPlus /><div><b>{{ t('md3.footer.trust3') }}</b><span>{{ t('md3.footer.trust3Desc') }}</span></div></div>
          <div class="md3-trust"><ShieldCheck /><div><b>{{ t('md3.footer.trust4') }}</b><span>{{ t('md3.footer.trust4Desc') }}</span></div></div>
        </div>
      </section>
    </template>

    <ProductQuickBuy v-if="quickBuyProduct" :product="quickBuyProduct" :visible="quickBuyVisible" @update:visible="quickBuyVisible = $event" />
    <AnnouncementModal v-if="activeAnnouncement" :announcement="activeAnnouncement" :visible="announcementVisible" @update:visible="announcementVisible = $event" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ChevronRight, CreditCard, LayoutGrid, PackageOpen, SearchX, ShieldCheck, Tag, UserPlus, Zap } from 'lucide-vue-next'
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
const { t } = useI18n()
const { getLocalizedText } = useLocalized()
const appStore = useAppStore()
const { isListMode, blogEnabled, noticeEnabled } = useNavConfig()


const steps = [{ key: 'pick' }, { key: 'pay' }, { key: 'get' }]

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
  categories: listCategories,
  selectedCategory,
  searchQuery,
  currentPage: listCurrentPage,
  totalPages: listTotalPages,
  expandedParentIds,
  categoryGroups: listCategoryGroups,
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

// 顶栏搜索在列表模式下跳回首页带 ?search=，同步进本页筛选
watch(() => route.query.search, (value) => {
  if (isListMode.value) searchQuery.value = String(value || '')
})

// ==================== 卡片模式：分类分组 ====================
const products = ref<any[]>([])
const productsLoading = ref(true)
const cardCategories = ref<PublicCategory[]>([])
const categories = computed(() => (isListMode.value ? listCategories.value : cardCategories.value))
const categoryMap = computed(() => createCategoryMap(categories.value))
const categoryGroups = computed(() => (isListMode.value ? listCategoryGroups.value : buildCategoryGroups(cardCategories.value)))
const productGroups = useProductListGroups(products, categoryMap)
const catName = (cat: PublicCategory) => getLocalizedText(cat.name) || cat.slug || ''
const catLink = (cat: PublicCategory) => (cat.slug ? `/categories/${cat.slug}` : '/products')
const groupLink = (group: ProductGroup) => {
  const cat = group.categoryId !== null ? categoryMap.value.get(group.categoryId) : undefined
  return cat?.slug ? `/categories/${cat.slug}` : '/products'
}

const hasBanners = ref<boolean | null>(null)

const notices = ref<any[]>([])
const blogs = ref<any[]>([])
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
    const res = await productAPI.list({ page: 1, page_size: 60 })
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
    cardCategories.value = res.data.data || []
  } catch (err) {
    console.error('Failed to load categories:', err)
  }
}

const loadPosts = async (type: 'notice' | 'blog') => {
  if (type === 'notice' && !noticeEnabled.value) return
  if (type === 'blog' && !blogEnabled.value) return
  try {
    const res = await postAPI.list({ page: 1, page_size: 5, type })
    const list = res.data.data || []
    if (type === 'notice') notices.value = list
    else blogs.value = list
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
    const initial = String(route.query.search || '').trim()
    if (initial) searchQuery.value = initial
    await Promise.all([listInitialize(), loadPosts('notice'), loadPosts('blog')])
  } else {
    await Promise.all([loadProducts(), loadCategories(), loadPosts('notice'), loadPosts('blog')])
  }
  showAnnouncementIfNeeded()
})

onUnmounted(() => listCleanup())
</script>
