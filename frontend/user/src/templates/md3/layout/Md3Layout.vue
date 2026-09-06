<template>
  <div class="md3-scope">
    <!-- ==================== 桌面：工具条（欢迎语 / 最新公告 / 账户 / 语言 / 深浅色） ==================== -->
    <div class="md3-util hidden lg:block">
      <div class="md3-container flex h-[34px] items-center justify-between gap-6">
        <div class="flex min-w-0 items-center">
          <span class="flex-none">{{ t('md3.shell.welcome', { site: brandName }) }}</span>
          <template v-if="noticeEnabled && latestNotice">
            <span class="md3-util-sep"></span>
            <RouterLink :to="`/blog/${latestNotice.slug}`" class="md3-util-link min-w-0" data-test="util-notice">
              <Bell />
              <span class="truncate">{{ t('md3.shell.notice') }}：{{ getLocalizedText(latestNotice.title) }}</span>
            </RouterLink>
          </template>
        </div>
        <div class="flex flex-none items-center">
          <template v-if="userAuthStore.isAuthenticated">
            <RouterLink to="/me" class="md3-util-link"><User /> {{ t('md3.shell.hello', { name: userProfileStore.displayName }) }}</RouterLink>
            <span class="md3-util-sep"></span>
            <button type="button" class="md3-util-link" @click="userAuthStore.logout()">{{ t('navbar.logout') }}</button>
          </template>
          <template v-else>
            <template v-if="personalCenterEnabled">
              <RouterLink to="/auth/login" class="md3-util-link" data-test="util-login">{{ t('md3.shell.loginRegister') }}</RouterLink>
              <span class="md3-util-sep"></span>
            </template>
            <RouterLink to="/guest/orders" class="md3-util-link" data-test="util-lookup"><ClipboardList /> {{ t('navbar.guestOrders') }}</RouterLink>
          </template>
          <span class="md3-util-sep"></span>
          <div ref="langEl" class="relative">
            <button type="button" class="md3-util-link" :aria-expanded="langOpen" :aria-label="t('navbar.selectLanguage')" data-test="lang-toggle" @click="toggleLang">
              <Globe /> {{ currentLangName }} <ChevronDown />
            </button>
            <div v-if="langOpen" class="md3-menu absolute right-0 top-full z-[60] mt-1 w-[168px]">
              <button v-for="lang in languages" :key="`dl-${lang.code}`" type="button" class="md3-menu-item" :class="{ 'is-active': appStore.locale === lang.code }" @click="changeLanguage(lang.code)">
                <Check v-if="appStore.locale === lang.code" />
                <span v-else class="w-5"></span>
                {{ lang.name }}
              </button>
            </div>
          </div>
          <span class="md3-util-sep"></span>
          <button type="button" class="md3-util-link" :aria-label="t('resellerConsole.common.toggleTheme')" data-test="theme-toggle" @click="toggleTheme">
            <Sun v-if="theme === 'dark'" /><Moon v-else /> {{ t('md3.shell.theme') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== 桌面：主头部（品牌 / 搜索 / 订单 / 购物车，吸顶）+ 分类导航条（随页滚动） ==================== -->
    <header class="hidden lg:block">
    <div class="md3-mall-header" :class="{ 'is-scrolled': scrolled }">
      <div class="md3-container flex h-[76px] items-center gap-8">
        <RouterLink to="/" class="md3-brand flex-none" :title="brandName">
          <span class="md3-brand-mark">
            <img v-if="brandLogo" :src="brandLogo" :alt="brandName" />
            <template v-else>{{ brandInitial }}</template>
          </span>
          <span class="md3-brand-name">{{ brandName }}</span>
        </RouterLink>

        <form class="md3-mall-search mx-auto w-full max-w-[560px]" role="search" data-test="header-search" @submit.prevent="submitSearch">
          <input v-model="query" type="search" :placeholder="t('md3.home.searchPlaceholder')" :aria-label="t('products.searchLabel')" />
          <button type="submit"><Search /> {{ t('md3.shell.search') }}</button>
        </form>

        <div class="flex flex-none items-center gap-1">
          <RouterLink :to="ordersLink" class="md3-header-action" :class="{ 'is-active': isActive('orders') }" data-test="header-orders">
            <ClipboardList />
            <span>{{ t('md3.shell.orders') }}</span>
          </RouterLink>
          <RouterLink to="/cart" class="md3-header-action" :class="{ 'is-active': isActive('cart') }" data-test="header-cart">
            <ShoppingCart />
            <span>{{ t('navbar.cart') }}</span>
            <span v-if="cartCount > 0" class="md3-header-count" data-test="cart-count">{{ cartCount > 99 ? '99+' : cartCount }}</span>
          </RouterLink>
        </div>
      </div>
    </div>

      <nav class="md3-catbar" :aria-label="t('md3.shell.categories')">
        <div class="md3-container flex items-stretch gap-2">
          <!-- 悬停展开、移开收起；点击只负责打开（悬停已打开时再点不会关掉），Esc / 点外面 / 路由切换收起 -->
          <div ref="megaEl" class="relative flex-none" @mouseenter="megaOpen = true" @mouseleave="megaOpen = false" @keydown.escape="megaOpen = false">
            <button type="button" class="md3-catbar-all" :aria-expanded="megaOpen" data-test="catbar-all" @click="megaOpen = true">
              <Menu /> {{ t('md3.shell.allCategories') }} <ChevronDown />
            </button>
            <div v-if="megaOpen" class="md3-mega" data-test="mega-menu">
              <div v-for="grp in categoryGroups" :key="`mega-${grp.id}`" class="md3-mega-group">
                <RouterLink :to="catLink(grp)" class="md3-mega-parent" @click="megaOpen = false">
                  <img v-if="grp.icon" :src="getImageUrl(grp.icon)" :alt="catName(grp)" loading="lazy" />
                  <Tag v-else class="h-4 w-4 text-[color:var(--md-sys-color-on-surface-variant)]" />
                  <span class="truncate">{{ catName(grp) }}</span>
                  <ChevronRight class="ml-auto h-4 w-4 flex-none text-[color:var(--md-sys-color-outline)]" />
                </RouterLink>
                <div v-if="grp.children.length" class="md3-mega-children">
                  <RouterLink v-for="child in grp.children" :key="`mega-c-${child.id}`" :to="catLink(child)" class="md3-mega-child" @click="megaOpen = false">{{ catName(child) }}</RouterLink>
                </div>
              </div>
              <div v-if="!categoryGroups.length" class="md3-body-s px-4 py-3 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('products.empty') }}</div>
            </div>
          </div>

          <div class="flex min-w-0 flex-1 items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <RouterLink to="/" class="md3-catbar-link" :class="{ 'is-active': isActive('home') }">{{ t('nav.home') }}</RouterLink>
            <RouterLink v-if="!isListMode" to="/products" class="md3-catbar-link" :class="{ 'is-active': route.path === '/products' }">{{ t('nav.products') }}</RouterLink>
            <RouterLink v-for="cat in topCategories" :key="`top-${cat.id}`" :to="catLink(cat)" class="md3-catbar-link" :class="{ 'is-active': route.params.slug === cat.slug }">{{ catName(cat) }}</RouterLink>
            <template v-for="item in secondaryNavItems" :key="`d-${item.key}`">
              <RouterLink v-if="item.type === 'route'" :to="item.path" class="md3-catbar-link" :class="{ 'is-active': route.path === item.path }"><component :is="item.icon" /> {{ item.label }}</RouterLink>
              <a v-else :href="item.path" :target="item.target" rel="noopener noreferrer" class="md3-catbar-link"><component :is="item.icon" /> {{ item.label }}</a>
            </template>
          </div>
        </div>
      </nav>
    </header>

    <!-- ==================== 手机 / 平板：品牌 + 菜单，下方搜索条 ==================== -->
    <header class="md3-mheader lg:hidden" :class="{ 'is-scrolled': scrolled }">
      <div class="flex h-14 items-center gap-1 px-4">
        <RouterLink to="/" class="md3-brand min-w-0 flex-1" :title="brandName">
          <span class="md3-brand-mark !h-9 !w-9 !text-base">
            <img v-if="brandLogo" :src="brandLogo" :alt="brandName" />
            <template v-else>{{ brandInitial }}</template>
          </span>
          <span class="md3-brand-name !text-[17px]">{{ brandName }}</span>
        </RouterLink>
        <RouterLink to="/cart" class="md3-icon-btn relative flex-none" :aria-label="t('navbar.cart')">
          <ShoppingCart />
          <span v-if="cartCount > 0" class="md3-header-count !left-auto !right-0 !top-0">{{ cartCount > 99 ? '99+' : cartCount }}</span>
        </RouterLink>
        <button class="md3-icon-btn flex-none" type="button" :aria-label="t('resellerConsole.common.toggleTheme')" @click="toggleTheme">
          <Sun v-if="theme === 'dark'" />
          <Moon v-else />
        </button>
        <div ref="moreEl" class="relative flex-none">
          <button class="md3-icon-btn" type="button" :aria-label="t('navbar.more')" :aria-expanded="moreOpen" data-test="mobile-more" @click="toggleMore">
            <Menu v-if="!moreOpen" />
            <X v-else />
          </button>
          <div v-if="moreOpen" class="md3-menu absolute right-0 top-[calc(100%+8px)] z-[60] max-h-[70vh] w-[240px] overflow-y-auto">
            <RouterLink v-for="cat in topCategories" :key="`m-cat-${cat.id}`" :to="catLink(cat)" class="md3-menu-item" @click="moreOpen = false">
              <img v-if="cat.icon" :src="getImageUrl(cat.icon)" :alt="catName(cat)" class="h-5 w-5 rounded-[5px] object-cover" />
              <Tag v-else />
              {{ catName(cat) }}
            </RouterLink>
            <div v-if="topCategories.length" class="md3-divider my-2"></div>
            <template v-for="item in secondaryNavItems" :key="`m-${item.key}`">
              <RouterLink v-if="item.type === 'route'" :to="item.path" class="md3-menu-item" @click="moreOpen = false"><component :is="item.icon" /> {{ item.label }}</RouterLink>
              <a v-else :href="item.path" :target="item.target" rel="noopener noreferrer" class="md3-menu-item" @click="moreOpen = false"><component :is="item.icon" /> {{ item.label }}</a>
            </template>
            <RouterLink v-if="!userAuthStore.isAuthenticated" to="/guest/orders" class="md3-menu-item" @click="moreOpen = false"><ClipboardList /> {{ t('navbar.guestOrders') }}</RouterLink>
            <RouterLink v-if="userAuthStore.isAuthenticated" to="/me" class="md3-menu-item" @click="moreOpen = false"><User /> {{ t('navbar.personalCenter') }}</RouterLink>
            <RouterLink v-else-if="personalCenterEnabled" to="/auth/login" class="md3-menu-item" @click="moreOpen = false"><User /> {{ t('navbar.login') }}</RouterLink>
            <button v-if="userAuthStore.isAuthenticated" type="button" class="md3-menu-item" @click="userAuthStore.logout(); moreOpen = false"><LogOut /> {{ t('navbar.logout') }}</button>
            <div class="md3-divider my-2"></div>
            <div class="md3-label-m px-3 pb-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('navbar.selectLanguage') }}</div>
            <button v-for="lang in languages" :key="`ml-${lang.code}`" type="button" class="md3-menu-item" :class="{ 'is-active': appStore.locale === lang.code }" @click="changeLanguage(lang.code); moreOpen = false">
              <Check v-if="appStore.locale === lang.code" />
              <span v-else class="w-5"></span>
              {{ lang.name }}
            </button>
          </div>
        </div>
      </div>
      <form class="px-4 pb-3" role="search" data-test="mobile-search" @submit.prevent="submitSearch">
        <label class="md3-msearch">
          <Search />
          <input v-model="query" type="search" :placeholder="t('md3.home.searchPlaceholder')" :aria-label="t('products.searchLabel')" />
          <button type="submit">{{ t('md3.shell.search') }}</button>
        </label>
      </form>
    </header>

    <!-- 页面内容（手机给底部导航栏留出空间） -->
    <main class="flex-1 pb-[calc(84px+env(safe-area-inset-bottom,0px))] lg:pb-0">
      <slot />
    </main>

    <!-- ==================== 四栏页脚 ==================== -->
    <footer class="md3-mall-footer" data-test="footer">
      <div class="md3-container grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div>
          <RouterLink to="/" class="md3-brand">
            <span class="md3-brand-mark">
              <img v-if="brandLogo" :src="brandLogo" :alt="brandName" />
              <template v-else>{{ brandInitial }}</template>
            </span>
            <span class="md3-brand-name">{{ brandName }}</span>
          </RouterLink>
          <p class="md3-body-s mt-3 max-w-[40ch]">{{ brandDescription || t('footer.description') }}</p>
          <div v-if="contact?.telegram || contact?.whatsapp" class="mt-4">
            <h3 class="md3-footer-title !mb-2">{{ t('md3.footer.contact') }}</h3>
            <div class="flex flex-wrap gap-2">
              <a v-if="contact?.telegram" :href="contact.telegram" target="_blank" rel="noopener noreferrer" class="md3-btn md3-btn-outlined md3-btn-sm"><Send /> Telegram</a>
              <a v-if="contact?.whatsapp" :href="contact.whatsapp" target="_blank" rel="noopener noreferrer" class="md3-btn md3-btn-outlined md3-btn-sm"><MessageCircle /> WhatsApp</a>
            </div>
          </div>
        </div>

        <div>
          <h3 class="md3-footer-title">{{ t('md3.footer.shopping') }}</h3>
          <div class="md3-footer-links">
            <RouterLink v-if="!isListMode" to="/products" class="md3-footer-link">{{ t('nav.products') }}</RouterLink>
            <RouterLink v-for="cat in topCategories.slice(0, 4)" :key="`f-cat-${cat.id}`" :to="catLink(cat)" class="md3-footer-link">{{ catName(cat) }}</RouterLink>
            <RouterLink to="/cart" class="md3-footer-link">{{ t('navbar.cart') }}</RouterLink>
            <RouterLink v-if="!userAuthStore.isAuthenticated" to="/guest/orders" class="md3-footer-link">{{ t('navbar.guestOrders') }}</RouterLink>
            <RouterLink v-if="personalCenterEnabled || userAuthStore.isAuthenticated" to="/me" class="md3-footer-link">{{ t('navbar.personalCenter') }}</RouterLink>
          </div>
        </div>

        <div>
          <h3 class="md3-footer-title">{{ t('md3.footer.help') }}</h3>
          <div class="md3-footer-links">
            <RouterLink v-if="aboutEnabled" to="/about" class="md3-footer-link">{{ t('nav.about') }}</RouterLink>
            <RouterLink v-if="noticeEnabled" to="/notice" class="md3-footer-link">{{ t('nav.notice') }}</RouterLink>
            <RouterLink v-if="blogEnabled" to="/blog" class="md3-footer-link">{{ t('nav.blog') }}</RouterLink>
            <template v-for="item in customNavItems" :key="`f-${item.key}`">
              <RouterLink v-if="item.type === 'route'" :to="item.path" class="md3-footer-link">{{ item.label }}</RouterLink>
              <a v-else :href="item.path" :target="item.target" rel="noopener noreferrer" class="md3-footer-link">{{ item.label }}</a>
            </template>
            <template v-for="link in footerLinks" :key="link.name">
              <RouterLink v-if="link.internal" :to="link.url" class="md3-footer-link">{{ link.name }}</RouterLink>
              <a v-else :href="link.url || 'javascript:void(0)'" :target="link.url ? '_blank' : undefined" rel="noopener noreferrer" class="md3-footer-link">{{ link.name }}</a>
            </template>
            <RouterLink to="/terms" class="md3-footer-link">{{ t('footer.terms') }}</RouterLink>
            <RouterLink to="/privacy" class="md3-footer-link">{{ t('footer.privacy') }}</RouterLink>
          </div>
        </div>

        <div>
          <h3 class="md3-footer-title">{{ t('md3.footer.trust') }}</h3>
          <div class="grid gap-3">
            <div class="md3-trust"><Zap /><div><b>{{ t('md3.footer.trust1') }}</b><span>{{ t('md3.footer.trust1Desc') }}</span></div></div>
            <div class="md3-trust"><CreditCard /><div><b>{{ t('md3.footer.trust2') }}</b><span>{{ t('md3.footer.trust2Desc') }}</span></div></div>
            <div class="md3-trust"><UserPlus /><div><b>{{ t('md3.footer.trust3') }}</b><span>{{ t('md3.footer.trust3Desc') }}</span></div></div>
            <div class="md3-trust"><ShieldCheck /><div><b>{{ t('md3.footer.trust4') }}</b><span>{{ t('md3.footer.trust4Desc') }}</span></div></div>
          </div>
        </div>
      </div>
      <div class="md3-footer-bottom">
        <div class="md3-container flex flex-wrap items-center justify-between gap-2 py-4">
          <span>© {{ year }} {{ brandName }} · {{ t('footer.rights') }}</span>
          <span class="flex items-center gap-4">
            <RouterLink to="/terms" class="md3-footer-link !text-[12px]">{{ t('footer.terms') }}</RouterLink>
            <RouterLink to="/privacy" class="md3-footer-link !text-[12px]">{{ t('footer.privacy') }}</RouterLink>
          </span>
        </div>
      </div>
    </footer>

    <!-- ==================== 手机 / 平板：底部导航栏 ==================== -->
    <nav class="md3-nav-bar lg:hidden" :aria-label="t('nav.home')" data-test="bottom-nav">
      <RouterLink to="/" class="md3-nav-item" :class="{ 'is-active': isActive('home') }">
        <span class="md3-nav-indicator"><Home /></span>
        <span>{{ t('nav.home') }}</span>
      </RouterLink>
      <RouterLink v-if="!isListMode" to="/products" class="md3-nav-item" :class="{ 'is-active': isActive('products') }">
        <span class="md3-nav-indicator"><LayoutGrid /></span>
        <span>{{ t('md3.shell.categories') }}</span>
      </RouterLink>
      <RouterLink to="/cart" class="md3-nav-item" :class="{ 'is-active': isActive('cart') }">
        <span class="md3-nav-indicator">
          <ShoppingCart />
          <span v-if="cartCount > 0" class="md3-nav-count">{{ cartCount > 99 ? '99+' : cartCount }}</span>
        </span>
        <span>{{ t('navbar.cart') }}</span>
      </RouterLink>
      <RouterLink v-if="userAuthStore.isAuthenticated" to="/me" class="md3-nav-item" :class="{ 'is-active': isActive('me') }">
        <span class="md3-nav-indicator"><User /></span>
        <span>{{ t('md3.shell.me') }}</span>
      </RouterLink>
      <RouterLink v-else-if="personalCenterEnabled" to="/auth/login" class="md3-nav-item" :class="{ 'is-active': isActive('auth') }">
        <span class="md3-nav-indicator"><User /></span>
        <span>{{ t('md3.shell.me') }}</span>
      </RouterLink>
      <RouterLink v-else to="/guest/orders" class="md3-nav-item" :class="{ 'is-active': isActive('guest') }">
        <span class="md3-nav-indicator"><ClipboardList /></span>
        <span>{{ t('navbar.guestOrders') }}</span>
      </RouterLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  Bell, Check, ChevronDown, ChevronRight, ClipboardList, CreditCard, Globe, Home, LayoutGrid, LogOut, Menu,
  MessageCircle, Moon, Search, Send, ShieldCheck, ShoppingCart, Sun, Tag, User, UserPlus, X, Zap,
} from 'lucide-vue-next'
import { categoryAPI, postAPI } from '../../../api'
import { useAppStore } from '../../../stores/app'
import { useCartStore } from '../../../stores/cart'
import { useUserAuthStore } from '../../../stores/userAuth'
import { useUserProfileStore } from '../../../stores/userProfile'
import { useNavConfig } from '../../../composables/useNavConfig'
import { useLocalized } from '../../../composables/useProduct'
import { useTheme } from '../../../utils/theme'
import { getImageUrl } from '../../../utils/image'
import { buildCategoryGroups, type PublicCategory } from '../../../utils/category'
import { getLocalizedText as localizeMap } from '../../../utils/resellerSiteConfig'
// 本地自托管 Roboto（MD3 默认字体），仅 md3 模板加载；中文回退到系统字体栈
import '@fontsource/roboto/latin-400.css'
import '@fontsource/roboto/latin-500.css'
import '@fontsource/roboto/latin-700.css'
import '../styles/md3.css'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const cartStore = useCartStore()
const userAuthStore = useUserAuthStore()
const userProfileStore = useUserProfileStore()
const { theme, toggleTheme } = useTheme()
const { getLocalizedText } = useLocalized()

const moreOpen = ref(false)
const langOpen = ref(false)
const megaOpen = ref(false)
const moreEl = ref<HTMLElement | null>(null)
const langEl = ref<HTMLElement | null>(null)
const megaEl = ref<HTMLElement | null>(null)
const scrolled = ref(false)

const year = new Date().getFullYear()

const brandName = computed(() => String(appStore.config?.brand?.site_name || '').trim() || 'Store')
const brandInitial = computed(() => Array.from(brandName.value)[0] || 'S')
const brandLogo = computed(() => {
  const raw = String(appStore.config?.brand?.site_logo || '').trim()
  return raw ? getImageUrl(raw) : ''
})
const brandDescription = computed(() => {
  const desc = appStore.config?.brand?.site_description
  if (desc && typeof desc === 'object') return localizeMap(desc as Record<string, string>, appStore.locale)
  return typeof desc === 'string' ? desc.trim() : ''
})

const { isListMode, blogEnabled, noticeEnabled, aboutEnabled, personalCenterEnabled, secondaryNavItems, customNavItems } = useNavConfig()

// 页脚自定义链接：站内路径走 RouterLink，其余当外链新开
const footerLinks = computed(() => {
  const links = appStore.config?.footer_links
  if (!Array.isArray(links)) return []
  return links
    .map((item: { name?: unknown; url?: unknown }) => {
      const url = String(item?.url || '').trim()
      return {
        name: typeof item?.name === 'string' ? item.name.trim() : localizeMap(item?.name as Record<string, string>, appStore.locale),
        url,
        internal: url.startsWith('/') && !url.startsWith('//'),
      }
    })
    .filter((item) => item.name)
})

const contact = computed(() => appStore.config?.contact as { telegram?: string; whatsapp?: string } | undefined)
const cartCount = computed(() => cartStore.totalItems)
const ordersLink = computed(() => (userAuthStore.isAuthenticated ? '/me/orders' : '/guest/orders'))

// ==================== 分类（分类导航条 / 全部分类下拉 / 页脚） ====================
const categories = ref<PublicCategory[]>([])
const categoryGroups = computed(() => buildCategoryGroups(categories.value))
const topCategories = computed(() => categoryGroups.value.slice(0, 6))
const catName = (cat: PublicCategory) => getLocalizedText(cat.name) || cat.slug || ''
const catLink = (cat: PublicCategory) => (cat.slug ? `/categories/${cat.slug}` : '/products')
const loadCategories = async () => {
  try {
    const res = await categoryAPI.list()
    categories.value = res.data.data || []
  } catch (err) {
    console.error('Failed to load categories:', err)
  }
}

// 工具条里的最新公告
const latestNotice = ref<any>(null)
const loadLatestNotice = async () => {
  if (!noticeEnabled.value) return
  try {
    const res = await postAPI.list({ page: 1, page_size: 1, type: 'notice' })
    latestNotice.value = (res.data.data || [])[0] || null
  } catch (err) {
    console.error('Failed to load notice:', err)
  }
}

// ==================== 搜索：跳到商品列表带 ?search=（列表模式首页即列表） ====================
const query = ref(String(route.query.search || ''))
watch(() => route.query.search, (value) => { query.value = String(value || '') })
const submitSearch = () => {
  const q = query.value.trim()
  const path = isListMode.value ? '/' : '/products'
  void router.push(q ? { path, query: { search: q } } : { path })
}

// ==================== 语言 / 主题 ====================
const languages = [
  { code: 'zh-CN', name: '简体中文' },
  { code: 'zh-TW', name: '繁體中文' },
  { code: 'en-US', name: 'English' },
]
const currentLangName = computed(() => languages.find((l) => l.code === appStore.locale)?.name || appStore.locale)
const changeLanguage = (code: string) => {
  appStore.setLocale(code)
  langOpen.value = false
}
const toggleMore = () => { moreOpen.value = !moreOpen.value }
const toggleLang = () => { langOpen.value = !langOpen.value }

/** 导航高亮：按路径前缀判断 */
const isActive = (key: 'home' | 'products' | 'cart' | 'guest' | 'me' | 'auth' | 'orders') => {
  const p = route.path
  switch (key) {
    case 'home': return p === '/'
    case 'products': return p.startsWith('/products') || p.startsWith('/categories')
    case 'cart': return p.startsWith('/cart') || p.startsWith('/checkout') || p.startsWith('/pay')
    case 'guest': return p.startsWith('/guest')
    case 'me': return p.startsWith('/me') || p.startsWith('/orders')
    case 'auth': return p.startsWith('/auth')
    case 'orders': return p.startsWith('/guest') || p.startsWith('/me/orders') || p.startsWith('/orders')
  }
}

// 点外面收起浮层。用 composedPath 而不是 contains：按钮里的图标会随 open 状态 v-if 切换，
// 事件冒泡到 document 时原来的 svg 已被卸载，contains 会误判成「点在外面」立刻把菜单关掉。
const onDocClick = (e: MouseEvent) => {
  const path = typeof e.composedPath === 'function' ? e.composedPath() : []
  const inside = (el: HTMLElement | null) => !!el && (path.includes(el) || el.contains(e.target as Node))
  if (moreOpen.value && !inside(moreEl.value)) moreOpen.value = false
  if (langOpen.value && !inside(langEl.value)) langOpen.value = false
  if (megaOpen.value && !inside(megaEl.value)) megaOpen.value = false
}
const onScroll = () => { scrolled.value = window.scrollY > 8 }

// 路由切换时收起所有浮层
watch(() => route.fullPath, () => { moreOpen.value = false; langOpen.value = false; megaOpen.value = false })

onMounted(() => {
  document.addEventListener('click', onDocClick)
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
  // Teleport 到 body 的浮层（Toast / ConfirmDialog / 公告弹窗 / Select 下拉）在
  // .md3-scope 之外，靠 body 上的这个 class 拿到 MD3 配色，详见 styles/md3.css
  document.body.classList.add('md3-tokens')
  void loadCategories()
  void loadLatestNotice()
})
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('scroll', onScroll)
  document.body.classList.remove('md3-tokens')
})
</script>
