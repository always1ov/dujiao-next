<template>
  <div class="md3-scope">
    <!-- ==================== 桌面：左侧导航栏（navigation rail） ==================== -->
    <nav class="md3-rail hidden lg:flex" :aria-label="t('nav.home')">
      <RouterLink class="md3-rail-brand" to="/" :title="brandName">
        <img v-if="brandLogo" :src="brandLogo" :alt="brandName" />
        <span v-else>{{ brandInitial }}</span>
      </RouterLink>

      <RouterLink to="/" class="md3-rail-item" :class="{ 'is-active': isActive('home') }">
        <span class="md3-nav-indicator"><Home /></span>
        <span class="md3-rail-label">{{ t('nav.home') }}</span>
      </RouterLink>
      <RouterLink v-if="!isListMode" to="/products" class="md3-rail-item" :class="{ 'is-active': isActive('products') }">
        <span class="md3-nav-indicator"><LayoutGrid /></span>
        <span class="md3-rail-label">{{ t('nav.products') }}</span>
      </RouterLink>
      <RouterLink to="/cart" class="md3-rail-item" :class="{ 'is-active': isActive('cart') }">
        <span class="md3-nav-indicator">
          <ShoppingCart />
          <span v-if="cartCount > 0" class="md3-nav-count">{{ cartCount > 99 ? '99+' : cartCount }}</span>
        </span>
        <span class="md3-rail-label">{{ t('navbar.cart') }}</span>
      </RouterLink>
      <RouterLink v-if="!userAuthStore.isAuthenticated" to="/guest/orders" class="md3-rail-item" :class="{ 'is-active': isActive('guest') }">
        <span class="md3-nav-indicator"><ClipboardList /></span>
        <span class="md3-rail-label">{{ t('navbar.guestOrders') }}</span>
      </RouterLink>
      <RouterLink v-if="userAuthStore.isAuthenticated" to="/me" class="md3-rail-item" :class="{ 'is-active': isActive('me') }">
        <span class="md3-nav-indicator"><User /></span>
        <span class="md3-rail-label">{{ t('navbar.personalCenter') }}</span>
      </RouterLink>
      <RouterLink v-else-if="personalCenterEnabled" to="/auth/login" class="md3-rail-item" :class="{ 'is-active': isActive('auth') }">
        <span class="md3-nav-indicator"><User /></span>
        <span class="md3-rail-label">{{ t('navbar.login') }}</span>
      </RouterLink>

      <span class="md3-rail-spacer"></span>

      <button type="button" class="md3-rail-item" :aria-label="t('resellerConsole.common.toggleTheme')" @click="toggleTheme">
        <span class="md3-nav-indicator"><Sun v-if="theme === 'dark'" /><Moon v-else /></span>
      </button>
      <div class="relative w-full" ref="railMoreEl">
        <button type="button" class="md3-rail-item" :aria-label="t('navbar.more')" :aria-expanded="railMoreOpen" @click="toggleRailMore">
          <span class="md3-nav-indicator"><Menu v-if="!railMoreOpen" /><X v-else /></span>
          <span class="md3-rail-label">{{ t('navbar.more') }}</span>
        </button>
        <div v-if="railMoreOpen" class="md3-menu absolute bottom-0 left-full z-[60] ml-2 max-h-[80vh] w-[240px] overflow-y-auto">
          <template v-for="item in secondaryNavItems" :key="`r-${item.key}`">
            <RouterLink v-if="item.type === 'route'" :to="item.path" class="md3-menu-item" @click="railMoreOpen = false"><component :is="item.icon" /> {{ item.label }}</RouterLink>
            <a v-else :href="item.path" :target="item.target" rel="noopener noreferrer" class="md3-menu-item" @click="railMoreOpen = false"><component :is="item.icon" /> {{ item.label }}</a>
          </template>
          <button v-if="userAuthStore.isAuthenticated" type="button" class="md3-menu-item" @click="userAuthStore.logout(); railMoreOpen = false"><LogOut /> {{ t('navbar.logout') }}</button>
          <div class="md3-divider my-2"></div>
          <div class="md3-label-m px-3 pb-1 text-[color:var(--md-sys-color-on-surface-variant)]">{{ t('navbar.selectLanguage') }}</div>
          <button v-for="lang in languages" :key="`rl-${lang.code}`" type="button" class="md3-menu-item" :class="{ 'is-active': appStore.locale === lang.code }" @click="changeLanguage(lang.code); railMoreOpen = false">
            <Check v-if="appStore.locale === lang.code" />
            <span v-else class="w-5"></span>
            {{ lang.name }}
          </button>
        </div>
      </div>
    </nav>

    <div class="md3-shell-content flex min-h-screen flex-col">
      <!-- ==================== 手机 / 平板：搜索式应用栏 ==================== -->
      <header class="md3-top-bar lg:hidden" :class="{ 'is-scrolled': scrolled }">
        <div class="flex h-16 items-center gap-2 px-4">
          <RouterLink class="grid h-10 w-10 flex-none place-items-center overflow-hidden rounded-[var(--md-shape-md)] bg-[color:var(--md-sys-color-primary-container)] text-[color:var(--md-sys-color-on-primary-container)] font-medium" to="/" :title="brandName">
            <img v-if="brandLogo" :src="brandLogo" :alt="brandName" class="h-full w-full object-cover" />
            <span v-else>{{ brandInitial }}</span>
          </RouterLink>
          <RouterLink to="/products" class="md3-search-bar min-w-0 flex-1">
            <Search />
            <span class="truncate">{{ t('md3.home.searchPlaceholder') }}</span>
          </RouterLink>
          <button class="md3-icon-btn flex-none" type="button" :aria-label="t('resellerConsole.common.toggleTheme')" @click="toggleTheme">
            <Sun v-if="theme === 'dark'" />
            <Moon v-else />
          </button>
          <div class="relative flex-none" ref="moreEl">
            <button class="md3-icon-btn" type="button" :aria-label="t('navbar.more')" :aria-expanded="moreOpen" @click="toggleMore">
              <MoreVertical v-if="!moreOpen" />
              <X v-else />
            </button>
            <div v-if="moreOpen" class="md3-menu absolute right-0 top-[calc(100%+8px)] z-[60] max-h-[70vh] w-[240px] overflow-y-auto">
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
      </header>

      <!-- 页面内容（手机给底部导航栏留出空间） -->
      <main class="flex-1 pb-[calc(88px+env(safe-area-inset-bottom,0px))] lg:pb-0">
        <slot />
      </main>

      <!-- ==================== 单行页脚 ==================== -->
      <footer class="md3-footer-strip mt-10">
        <div class="md3-container flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-5">
          <span class="md3-body-s text-[color:var(--md-sys-color-on-surface-variant)]">© {{ year }} {{ brandName }}</span>
          <nav class="flex flex-wrap items-center gap-x-4 gap-y-1">
            <RouterLink v-if="aboutEnabled" to="/about" class="md3-footer-link">{{ t('nav.about') }}</RouterLink>
            <RouterLink v-if="noticeEnabled" to="/notice" class="md3-footer-link">{{ t('nav.notice') }}</RouterLink>
            <RouterLink v-if="blogEnabled" to="/blog" class="md3-footer-link">{{ t('nav.blog') }}</RouterLink>
            <RouterLink v-if="!userAuthStore.isAuthenticated" to="/guest/orders" class="md3-footer-link">{{ t('navbar.guestOrders') }}</RouterLink>
            <RouterLink v-if="personalCenterEnabled || userAuthStore.isAuthenticated" to="/me" class="md3-footer-link">{{ t('navbar.personalCenter') }}</RouterLink>
            <a v-for="link in footerLinks" :key="link.name" :href="link.url || 'javascript:void(0)'" :target="link.url ? '_blank' : undefined" rel="noopener noreferrer" class="md3-footer-link">{{ link.name }}</a>
            <a v-if="contact?.telegram" :href="contact.telegram" target="_blank" rel="noopener noreferrer" class="md3-footer-link"><Send /> Telegram</a>
            <a v-if="contact?.whatsapp" :href="contact.whatsapp" target="_blank" rel="noopener noreferrer" class="md3-footer-link"><MessageCircle /> WhatsApp</a>
            <RouterLink to="/terms" class="md3-footer-link">{{ t('footer.terms') }}</RouterLink>
            <RouterLink to="/privacy" class="md3-footer-link">{{ t('footer.privacy') }}</RouterLink>
          </nav>
        </div>
      </footer>
    </div>

    <!-- ==================== 手机 / 平板：底部导航栏 ==================== -->
    <nav class="md3-nav-bar lg:hidden" :aria-label="t('nav.home')">
      <RouterLink to="/" class="md3-nav-item" :class="{ 'is-active': isActive('home') }">
        <span class="md3-nav-indicator"><Home /></span>
        <span>{{ t('nav.home') }}</span>
      </RouterLink>
      <RouterLink v-if="!isListMode" to="/products" class="md3-nav-item" :class="{ 'is-active': isActive('products') }">
        <span class="md3-nav-indicator"><LayoutGrid /></span>
        <span>{{ t('nav.products') }}</span>
      </RouterLink>
      <RouterLink to="/cart" class="md3-nav-item" :class="{ 'is-active': isActive('cart') }">
        <span class="md3-nav-indicator">
          <ShoppingCart />
          <span v-if="cartCount > 0" class="md3-nav-count">{{ cartCount > 99 ? '99+' : cartCount }}</span>
        </span>
        <span>{{ t('navbar.cart') }}</span>
      </RouterLink>
      <RouterLink v-if="!userAuthStore.isAuthenticated && !personalCenterEnabled" to="/guest/orders" class="md3-nav-item" :class="{ 'is-active': isActive('guest') }">
        <span class="md3-nav-indicator"><ClipboardList /></span>
        <span>{{ t('navbar.guestOrders') }}</span>
      </RouterLink>
      <RouterLink v-if="userAuthStore.isAuthenticated" to="/me" class="md3-nav-item" :class="{ 'is-active': isActive('me') }">
        <span class="md3-nav-indicator"><User /></span>
        <span>{{ t('navbar.personalCenter') }}</span>
      </RouterLink>
      <RouterLink v-else-if="personalCenterEnabled" to="/auth/login" class="md3-nav-item" :class="{ 'is-active': isActive('auth') }">
        <span class="md3-nav-indicator"><User /></span>
        <span>{{ t('navbar.login') }}</span>
      </RouterLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  Search, Moon, Sun, ShoppingCart, MoreVertical, Menu, X, User, ClipboardList, LogOut,
  LayoutGrid, Send, MessageCircle, Home, Check,
} from 'lucide-vue-next'
import { useAppStore } from '../../../stores/app'
import { useCartStore } from '../../../stores/cart'
import { useUserAuthStore } from '../../../stores/userAuth'
import { useNavConfig } from '../../../composables/useNavConfig'
import { useTheme } from '../../../utils/theme'
import { getImageUrl } from '../../../utils/image'
import { getLocalizedText } from '../../../utils/resellerSiteConfig'
// 本地自托管 Roboto（MD3 默认字体），仅 md3 模板加载；中文回退到系统字体栈
import '@fontsource/roboto/latin-400.css'
import '@fontsource/roboto/latin-500.css'
import '@fontsource/roboto/latin-700.css'
import '../styles/md3.css'

const { t } = useI18n()
const route = useRoute()
const appStore = useAppStore()
const cartStore = useCartStore()
const userAuthStore = useUserAuthStore()
const { theme, toggleTheme } = useTheme()

const moreOpen = ref(false)
const railMoreOpen = ref(false)
const moreEl = ref<HTMLElement | null>(null)
const railMoreEl = ref<HTMLElement | null>(null)
const scrolled = ref(false)

const year = new Date().getFullYear()

const brandName = computed(() => String(appStore.config?.brand?.site_name || '').trim() || 'Store')
const brandInitial = computed(() => Array.from(brandName.value)[0] || 'S')
const brandLogo = computed(() => {
  const raw = String(appStore.config?.brand?.site_logo || '').trim()
  return raw ? getImageUrl(raw) : ''
})

const { isListMode, blogEnabled, noticeEnabled, aboutEnabled, personalCenterEnabled, secondaryNavItems } = useNavConfig()

const footerLinks = computed(() => {
  const links = appStore.config?.footer_links
  if (!Array.isArray(links)) return []
  return links
    .map((item: { name?: unknown; url?: unknown }) => ({
      name: typeof item?.name === 'string' ? item.name.trim() : getLocalizedText(item?.name as Record<string, string>, appStore.locale),
      url: String(item?.url || '').trim(),
    }))
    .filter((item) => item.name)
})

const contact = computed(() => appStore.config?.contact as { telegram?: string; whatsapp?: string } | undefined)
const cartCount = computed(() => cartStore.totalItems)

const languages = [
  { code: 'zh-CN', name: '简体中文' },
  { code: 'zh-TW', name: '繁體中文' },
  { code: 'en-US', name: 'English' },
]

const changeLanguage = (code: string) => {
  appStore.setLocale(code)
}

const toggleMore = () => { moreOpen.value = !moreOpen.value; railMoreOpen.value = false }
const toggleRailMore = () => { railMoreOpen.value = !railMoreOpen.value; moreOpen.value = false }

/** 导航高亮：按路径前缀判断 */
const isActive = (key: 'home' | 'products' | 'cart' | 'guest' | 'me' | 'auth') => {
  const p = route.path
  switch (key) {
    case 'home': return p === '/'
    case 'products': return p.startsWith('/products') || p.startsWith('/categories')
    case 'cart': return p.startsWith('/cart') || p.startsWith('/checkout') || p.startsWith('/pay')
    case 'guest': return p.startsWith('/guest')
    case 'me': return p.startsWith('/me') || p.startsWith('/orders')
    case 'auth': return p.startsWith('/auth')
  }
}

const onDocClick = (e: MouseEvent) => {
  const target = e.target as Node
  if (moreOpen.value && moreEl.value && !moreEl.value.contains(target)) moreOpen.value = false
  if (railMoreOpen.value && railMoreEl.value && !railMoreEl.value.contains(target)) railMoreOpen.value = false
}
const onScroll = () => { scrolled.value = window.scrollY > 8 }

onMounted(() => {
  document.addEventListener('click', onDocClick)
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
  // Teleport 到 body 的浮层（Toast / ConfirmDialog / 公告弹窗 / Select 下拉）在
  // .md3-scope 之外，靠 body 上的这个 class 拿到 MD3 配色，详见 styles/md3.css
  document.body.classList.add('md3-tokens')
})
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('scroll', onScroll)
  document.body.classList.remove('md3-tokens')
})
</script>
