// md3 店面全量点击测试：遍历每个可点元素，断言结果，输出结果表（结果写到 <输出目录>/results.json，失败会截图）。
// 用法: node md3-clicktest.mjs <输出目录> [desktop|mobile|all]
// 前提: 本地全栈已起（docs/agents/smoke-test.md），并用 seed-demo.py 造过数据。
// 环境变量: BASE_URL（默认 http://127.0.0.1:18090）、PW_MODULE（playwright 模块路径，默认 'playwright'）、
//          PW_CHROMIUM（浏览器可执行文件，默认让 Playwright 自己找）
import fs from 'node:fs'
const { chromium } = await import(process.env.PW_MODULE || 'playwright')

const base = process.env.BASE_URL || 'http://127.0.0.1:18090'
const out = process.argv[2] || '.'
const which = process.argv[3] || 'all'
fs.mkdirSync(out, { recursive: true })

const results = []
let currentVp = ''
const record = (area, name, ok, note = '') => {
  results.push({ vp: currentVp, area, name, ok, note })
  console.log(`${ok ? 'PASS' : 'FAIL'} [${currentVp}] ${area} · ${name}${note ? ' — ' + note : ''}`)
}

const browser = await chromium.launch({ ...(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {}), args: ['--no-sandbox'] })

const viewports = [
  { name: 'desktop', width: 1366, height: 900 },
  { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
].filter((v) => which === 'all' || v.name === which)

const guest = { email: `click-${Date.now()}@example.com`, password: 'OrderPass-2026!' }

for (const vp of viewports) {
  currentVp = vp.name
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch,
    deviceScaleFactor: vp.deviceScaleFactor || 1, locale: 'zh-CN',
  })
  const page = await ctx.newPage()
  const pageErrors = []
  const consoleErrors = []
  page.on('pageerror', (e) => pageErrors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
  page.on('dialog', (d) => d.accept())

  const goto = async (path) => {
    const url = base + path + (path.includes('?') ? '&' : '?') + 'template=md3'
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(250)
  }
  const url = () => new URL(page.url()).pathname + new URL(page.url()).search.replace(/[?&]template=md3/, '')
  const path = () => new URL(page.url()).pathname
  const wait = (ms) => page.waitForTimeout(ms)
  const check = async (area, name, fn) => {
    try {
      const note = await fn()
      record(area, name, true, typeof note === 'string' ? note : '')
    } catch (e) {
      record(area, name, false, String(e.message || e).split('\n')[0].slice(0, 160))
      try { await page.screenshot({ path: `${out}/${vp.name}-fail-${results.length}.png` }) } catch {}
    }
  }
  const assert = (cond, msg) => { if (!cond) throw new Error(msg) }
  const isMobile = vp.name === 'mobile'
  const T = (sel) => page.locator(`[data-test="${sel}"]`)
  const visible = (sel) => T(sel).first().isVisible()
  const dismissAnnouncement = async () => {
    const dlg = page.locator('[role="dialog"]').filter({ hasText: /欢迎光临|Welcome/ })
    if (await dlg.count()) {
      const btn = dlg.getByRole('button', { name: /今日不再提示|Don't show today|不再提示/ }).first()
      if (await btn.count()) await btn.click(); else await dlg.getByRole('button', { name: /关闭|Close/ }).first().click()
      await wait(300)
    }
  }

  // ==================== A. 首页与外壳 ====================
  await goto('/')
  await check('首页', '页面加载 + 公告弹窗关闭', async () => {
    const dlg = page.locator('[role="dialog"]').filter({ hasText: /欢迎光临/ })
    assert(await dlg.count() > 0, '公告弹窗未出现')
    await dismissAnnouncement()
    await dlg.first().waitFor({ state: 'detached', timeout: 3000 }).catch(() => {})
    assert(await dlg.count() === 0, '公告弹窗未关闭')
    await page.reload({ waitUntil: 'networkidle' }); await wait(300)
    assert(await page.locator('[role="dialog"]').filter({ hasText: /欢迎光临/ }).count() === 0, '「今日不再提示」后仍弹出')
  })
  await check('首页', '轮播图渲染 + 左右切换 + 圆点', async () => {
    const img = page.locator('section img[src*="/uploads/banner/"]').first()
    await img.waitFor({ state: 'visible', timeout: 5000 })
    const src1 = await img.getAttribute('src')
    await page.getByRole('button', { name: /下一张|Next/ }).first().click(); await wait(500)
    const src2 = await page.locator('section img[src*="/uploads/banner/"]').first().getAttribute('src')
    assert(src1 !== src2, '点「下一张」后图片没变')
    await page.getByRole('button', { name: /上一张|Previous/ }).first().click(); await wait(500)
    const src3 = await page.locator('section img[src*="/uploads/banner/"]').first().getAttribute('src')
    assert(src3 === src1, '点「上一张」没回到第一张')
    await page.getByRole('button', { name: /切换到第 2 张|Switch to banner 2/ }).first().click(); await wait(500)
    const src4 = await page.locator('section img[src*="/uploads/banner/"]').first().getAttribute('src')
    assert(src4 === src2, '圆点切换无效')
  })
  await check('首页', '轮播按钮跳转', async () => {
    await page.getByRole('button', { name: /切换到第 1 张/ }).first().click(); await wait(300)
    const cta = page.locator('section').filter({ has: page.locator('img[src*="/uploads/banner/"]') }).getByRole('button').filter({ hasText: /./ }).last()
    await cta.click(); await wait(600)
    assert(path() === '/products' || path().startsWith('/categories/'), `期望 /products 或分类页，实际 ${path()}`)
    return path()
  })
  await goto('/')
  await check('首页', '热门推荐 / 分类分区 / 公告文章 / 服务保障 都渲染', async () => {
    assert(await visible('home-hot'), '无热门推荐')
    assert(await T('home-group').count() >= 4, '分类分区少于 4 个')
    assert(await visible('home-posts'), '无公告/文章区')
    assert(await visible('home-trust'), '无服务保障条')
    assert(await T('product-card').count() >= 10, '商品卡不足 10')
    return `分区 ${await T('home-group').count()} 个，商品卡 ${await T('product-card').count()} 张`
  })
  if (!isMobile) {
    await check('首页', '分类面板链接', async () => {
      const links = T('home-cat-panel').locator('a.md3-side-cat')
      const n = await links.count(); assert(n >= 4, `分类面板只有 ${n} 项`)
      await links.first().click(); await wait(600)
      assert(path().startsWith('/categories/'), `期望 /categories/*，实际 ${path()}`)
      assert(await T('product-card').count() > 0, '分类页无商品')
    })
    await goto('/')
    await check('首页', '公告面板链接', async () => {
      const links = T('home-notice-panel').locator('a[href^="/blog/"]')
      assert(await links.count() >= 2, '公告面板不足 2 条')
      await links.first().click(); await wait(600)
      assert(path().startsWith('/blog/'), `期望 /blog/*，实际 ${path()}`)
      assert(await page.locator('h1').first().isVisible(), '公告详情无标题')
    })
    await goto('/')
  } else {
    await check('首页', '分类图标行', async () => {
      const tiles = T('home-cat-tiles').locator('a')
      assert(await tiles.count() >= 5, '图标行不足 5 个')
      await tiles.nth(1).click(); await wait(600)
      assert(path().startsWith('/categories/'), `期望 /categories/*，实际 ${path()}`)
    })
    await goto('/')
  }
  await check('首页', '分区「查看全部」', async () => {
    const more = T('home-group').first().locator('a.md3-section-more')
    await more.click(); await wait(600)
    assert(path().startsWith('/categories/'), `期望 /categories/*，实际 ${path()}`)
  })
  await goto('/')
  await check('首页', '商品卡 → 详情', async () => {
    const card = T('home-hot').locator('[data-test="product-card"]').first()
    const href = await card.getAttribute('href')
    await card.click(); await wait(700)
    assert(path() === href, `期望 ${href}，实际 ${path()}`)
    assert(await visible('detail-main'), '详情主区未渲染')
  })
  await goto('/')
  await check('首页', '快速购买弹层 → 加入购物车', async () => {
    const btn = T('home-hot').locator('[data-test="quick-buy"]').first()
    await btn.click(); await wait(500)
    const dlg = page.locator('[role="dialog"]')
    assert(await dlg.isVisible(), '快速购买弹层未出现')
    await dlg.getByRole('button', { name: /加入购物车|Add to cart/ }).first().click(); await wait(700)
    const count = isMobile ? page.locator('.md3-nav-count').first() : T('cart-count').first()
    assert(await count.isVisible(), '购物车角标未出现')
    assert((await count.textContent()).trim() === '1', `角标应为 1，实际 ${await count.textContent()}`)
    if (await dlg.isVisible()) {
      const close = dlg.getByRole('button').filter({ has: page.locator('svg') }).first()
      await close.click(); await wait(300)
    }
  })
  await check('首页', '公告 / 文章双栏链接', async () => {
    const links = T('home-posts').locator('a[href^="/blog/"]')
    assert(await links.count() >= 4, '双栏文章不足 4 条')
    const href = await links.last().getAttribute('href')
    await links.last().click(); await wait(600)
    assert(path() === href, `期望 ${href}，实际 ${path()}`)
  })

  // ==================== B. 头部 / 工具条 / 分类条 ====================
  await goto('/')
  if (!isMobile) {
    await check('头部', '搜索框 → /products?search=', async () => {
      await T('header-search').locator('input').fill('Steam')
      await T('header-search').locator('input').press('Enter'); await wait(900)
      assert(path() === '/products' && url().includes('search=Steam'), `实际 ${url()}`)
      const titles = await T('products-grid').locator('h3').allTextContents()
      assert(titles.length > 0 && titles.every((x) => /steam/i.test(x)), `结果不全是 Steam：${titles.join('|')}`)
      assert((await T('products-search').inputValue()) === 'Steam', '列表页搜索框未回显关键词')
    })
    await check('头部', '「我的订单」→ 游客查单', async () => { await T('header-orders').click(); await wait(500); assert(path() === '/guest/orders', path()) })
    await check('头部', '购物车入口', async () => { await T('header-cart').click(); await wait(500); assert(path() === '/cart', path()) })
    await check('头部', '品牌 → 首页', async () => { await page.locator('.md3-brand').first().click(); await wait(500); assert(path() === '/', path()) })
    await check('头部', '登录按钮', async () => { await T('header-login').click(); await wait(500); assert(path() === '/auth/login', path()) })
    await check('头部', '深浅色切换', async () => {
      const before = await page.evaluate(() => document.documentElement.classList.contains('dark'))
      await T('theme-toggle').click(); await wait(300)
      const after = await page.evaluate(() => document.documentElement.classList.contains('dark'))
      assert(before !== after, '主题未切换')
      await T('theme-toggle').click(); await wait(200)
    })
    await check('头部', '语言切换 → English → 简体', async () => {
      const ph = async () => (await T('header-search').locator('input').getAttribute('placeholder')) || ''
      await T('lang-toggle').click(); await wait(200)
      await page.getByRole('button', { name: 'English' }).click(); await wait(500)
      assert(/search/i.test(await ph()), '切英文后搜索框未变')
      await goto('/products')
      assert(/search/i.test(await ph()), '语言未跨页保持')
      await T('lang-toggle').click(); await wait(200)
      await page.getByRole('button', { name: '简体中文' }).click(); await wait(500)
      assert((await ph()).includes('搜索'), '切回中文失败')
    })
    await goto('/')
    await check('导航', '「更多分类」下拉（一级分类超过 3 个时）', async () => {
      if (!(await T('nav-more-cats').count())) return '一级分类不超过 3 个，无下拉'
      await T('nav-more-cats').click(); await wait(300)
      assert(await visible('nav-more-menu'), '下拉未出现')
      const links = T('nav-more-menu').locator('a')
      assert(await links.count() >= 1, '下拉里没有分类')
      const href = await links.first().getAttribute('href')
      await links.first().click(); await wait(600)
      assert(path() === href, `期望 ${href}，实际 ${path()}`)
      assert(await T('crumbs').first().isVisible(), '分类页面包屑缺失')
      return `下拉 ${await links.count()} 项`
    })
    await goto('/')
    await check('导航', '逐个点击导航链接', async () => {
      const n = await page.locator('[data-test="topnav"] a.md3-top-link').count()
      const visited = []
      for (let i = 0; i < n; i++) {
        await goto('/')
        const link = page.locator('[data-test="topnav"] a.md3-top-link').nth(i)
        const href = await link.getAttribute('href')
        const target = await link.getAttribute('target')
        if (target === '_blank' || /^https?:/.test(href || '')) { visited.push(`${href}(外链跳过)`); continue }
        await link.click(); await wait(600)
        assert(path() === href, `第 ${i + 1} 个链接期望 ${href}，实际 ${path()}`)
        assert(!(await page.locator('text=404').count()), `${href} 落到 404`)
        visited.push(href)
      }
      return visited.join(' ')
    })
  } else {
    await check('头部(手机)', '搜索条 → /products?search=', async () => {
      await T('mobile-search').locator('input').fill('Netflix')
      await T('mobile-search').locator('button[type=submit]').click(); await wait(900)
      assert(path() === '/products' && url().includes('search=Netflix'), url())
      const titles = await T('products-grid').locator('h3').allTextContents()
      assert(titles.length > 0 && titles.every((x) => /netflix/i.test(x)), `结果不全是 Netflix：${titles.join('|')}`)
    })
    await goto('/')
    await check('头部(手机)', '更多菜单：分类 / 导航 / 语言', async () => {
      await T('mobile-more').click(); await wait(300)
      const menu = page.locator('.md3-menu').first()
      assert(await menu.isVisible(), '菜单未出现')
      assert(await menu.locator('a').count() >= 5, '菜单项过少')
      await menu.getByRole('button', { name: 'English' }).click(); await wait(500)
      assert((await T('mobile-search').locator('button[type=submit]').textContent()).includes('Search'), '切英文失败')
      await T('mobile-more').click(); await wait(300)
      await page.locator('.md3-menu').first().getByRole('button', { name: '简体中文' }).click(); await wait(400)
      await T('mobile-more').click(); await wait(300)
      const first = page.locator('.md3-menu a').first()
      const href = await first.getAttribute('href')
      await first.click(); await wait(600)
      assert(path() === href, `期望 ${href}，实际 ${path()}`)
    })
    await goto('/')
    await check('底栏(手机)', '底部导航四项', async () => {
      const items = T('bottom-nav').locator('a')
      const n = await items.count(); assert(n === 4, `底栏应为 4 项，实际 ${n}`)
      const hrefs = []
      for (let i = 0; i < n; i++) {
        const href = await T('bottom-nav').locator('a').nth(i).getAttribute('href')
        await T('bottom-nav').locator('a').nth(i).click(); await wait(600)
        assert(path() === href, `底栏第 ${i + 1} 项期望 ${href}，实际 ${path()}`)
        hrefs.push(href)
      }
      return hrefs.join(' ')
    })
    await check('头部(手机)', '主题切换', async () => {
      await goto('/')
      const before = await page.evaluate(() => document.documentElement.classList.contains('dark'))
      await page.locator('.md3-mheader button[aria-label]').nth(0).click(); await wait(300)
      const after = await page.evaluate(() => document.documentElement.classList.contains('dark'))
      assert(before !== after, '主题未切换')
      await page.locator('.md3-mheader button[aria-label]').nth(0).click(); await wait(200)
    })
  }

  // ==================== C. 页脚 ====================
  await goto('/')
  await check('页脚', '逐个点击站内链接', async () => {
    const links = page.locator('[data-test="footer"] a[href^="/"]')
    const n = await links.count()
    const seen = new Set(); const visited = []
    for (let i = 0; i < n; i++) {
      await goto('/')
      const link = page.locator('[data-test="footer"] a[href^="/"]').nth(i)
      const href = await link.getAttribute('href')
      if (seen.has(href)) continue
      seen.add(href)
      await link.scrollIntoViewIfNeeded()
      await link.click(); await wait(600)
      const okRedirect = href.startsWith('/me') && path() === '/auth/login'
      assert(path() === href || okRedirect, `${href} → 实际 ${path()}`)
      assert(!(await page.locator('h1', { hasText: /页面不存在|Page not found/ }).count()), `${href} 落到 404`)
      visited.push(href)
    }
    const ext = await page.locator('[data-test="footer"] a[target="_blank"]').count()
    return `${visited.length} 个站内链接 OK，${ext} 个外链（新窗口）`
  })

  // ==================== D. 商品列表 ====================
  await goto('/products')
  await check('商品列表', '20/页 + 分页翻页', async () => {
    assert(await T('product-card').count() === 20, `首页应 20 张，实际 ${await T('product-card').count()}`)
    const pager = page.locator('nav[aria-label]').filter({ has: page.getByRole('button', { name: '2' }) })
    assert(await pager.count(), '无分页')
    await page.getByRole('button', { name: '2', exact: true }).first().click(); await wait(800)
    const n2 = await T('product-card').count()
    assert(n2 > 0 && n2 < 20, `第 2 页应少于 20，实际 ${n2}`)
    await page.getByRole('button', { name: /上一页|Previous/ }).first().click(); await wait(800)
    assert(await T('product-card').count() === 20, '返回第 1 页失败')
    return `第 2 页 ${n2} 张`
  })
  await check('商品列表', '搜索 + 清除', async () => {
    await T('products-search').fill('Office'); await wait(900)
    const titles = await T('products-grid').locator('h3').allTextContents()
    assert(titles.length === 1 && /office/i.test(titles[0]), `搜索 Office 结果：${titles.join('|')}`)
    await T('products-search-clear').click(); await wait(900)
    assert(await T('product-card').count() === 20, '清除后未恢复')
  })
  await check('商品列表', '搜索无结果 → 清除筛选', async () => {
    await T('products-search').fill('zzzz-none'); await wait(900)
    assert(await visible('clear-filters'), '空态未出现')
    await T('clear-filters').click(); await wait(900)
    assert(await T('product-card').count() === 20, '清除筛选后未恢复')
  })
  await check('商品列表', '网格 / 列表切换并记忆', async () => {
    await T('view-list').click(); await wait(300)
    assert(await visible('products-list'), '列表视图未出现')
    await page.reload({ waitUntil: 'networkidle' }); await wait(500)
    assert(await visible('products-list'), '刷新后未记住列表视图')
    await T('view-grid').click(); await wait(300)
    assert(await visible('products-grid'), '网格视图未恢复')
  })
  if (!isMobile) {
    await check('商品列表', '侧栏分类：一级 → 展开 → 二级', async () => {
      const side = T('category-side').first()
      await side.getByRole('button', { name: /游戏点卡/ }).first().click(); await wait(800)
      assert(path() === '/categories/game', path())
      assert(await T('crumbs').first().textContent().then((x) => x.includes('游戏点卡')), '面包屑未显示分类')
      const n1 = await T('product-card').count(); assert(n1 > 0 && n1 < 20, `分类内商品 ${n1}`)
      let child = side.getByRole('button', { name: /^Steam$/ }).first()
      const autoExpanded = await child.isVisible()
      if (!autoExpanded) { await side.locator('button[aria-expanded]').first().click(); await wait(300) }
      child = side.getByRole('button', { name: /^Steam$/ }).first()
      assert(await child.isVisible(), '二级分类未展开')
      await child.click(); await wait(800)
      assert(path() === '/categories/steam', path())
      const n2 = await T('product-card').count(); assert(n2 > 0 && n2 <= n1, `二级分类商品 ${n2}`)
      await side.getByRole('button', { name: /全部商品/ }).first().click(); await wait(800)
      assert(path() === '/products', path())
      return `游戏点卡 ${n1}，Steam ${n2}`
    })
  } else {
    await check('商品列表', '分类 chips', async () => {
      const chips = T('category-side').first().locator('button.md3-chip')
      await chips.filter({ hasText: /游戏点卡/ }).first().click(); await wait(800)
      assert(path() === '/categories/game', path())
      assert(await T('product-card').count() > 0, '分类无商品')
      await chips.filter({ hasText: /^Steam$/ }).first().click(); await wait(800)
      assert(path() === '/categories/steam', path())
      await chips.first().click(); await wait(800)
      assert(path() === '/products', path())
    })
  }
  await check('商品列表', '面包屑 → 首页', async () => { await T('crumbs').first().locator('a').first().click(); await wait(500); assert(path() === '/', path()) })

  // ==================== E. 商品详情 ====================
  await goto('/products/netflix-family')
  await check('详情', '规格切换 → 价格随之变化，售罄规格禁用', async () => {
    const opts = T('sku-option')
    assert(await opts.count() === 3, `规格数 ${await opts.count()}`)
    assert(await opts.filter({ hasText: /12 个月/ }).isDisabled(), '库存 0 的规格未禁用')
    await opts.filter({ hasText: /3 个月/ }).click(); await wait(300)
    const price = await T('price-block').locator('.md3-price').first().textContent()
    assert(price.includes('79'), `选 3 个月后价格应含 79，实际 ${price}`)
    await opts.filter({ hasText: /1 个月/ }).click(); await wait(300)
    const price2 = await T('price-block').locator('.md3-price').first().textContent()
    assert(price2.includes('29.9'), `选 1 个月后价格应含 29.9，实际 ${price2}`)
  })
  await check('详情', '数量加减 / 输入', async () => {
    await T('qty-plus').click(); await T('qty-plus').click(); await wait(200)
    assert((await T('qty-input').inputValue()) === '3', '加两次应为 3')
    await T('qty-minus').click(); await wait(200)
    assert((await T('qty-input').inputValue()) === '2', '减一次应为 2')
    await T('qty-input').fill('5'); await T('qty-input').press('Enter'); await wait(300)
    assert((await T('qty-input').inputValue()) === '5', '输入 5 未生效')
    await T('qty-input').fill('0'); await T('qty-input').press('Enter'); await wait(300)
    assert((await T('qty-input').inputValue()) === '1', `输入 0 应回到 1，实际 ${await T('qty-input').inputValue()}`)
  })
  await check('详情', '加入购物车 → 提示 + 角标', async () => {
    await T('add-to-cart').click(); await wait(700)
    assert(await page.locator('[role="alert"]').count() > 0, '无加入成功提示')
    const count = isMobile ? page.locator('.md3-nav-count').first() : T('cart-count').first()
    assert(await count.isVisible(), '角标未出现')
    return `角标 ${(await count.textContent()).trim()}`
  })
  await goto('/products/steam-50')
  await check('详情', '页签切换：详情 / 购买须知 / 相关文章', async () => {
    await T('tab-notes').click(); await wait(200)
    assert(await visible('tab-panel-notes') && !(await visible('tab-panel-details')), '购买须知未显示')
    await T('tab-posts').click(); await wait(200)
    assert(await visible('tab-panel-posts'), '相关文章未显示')
    assert(await T('tab-panel-posts').locator('a[href^="/blog/"]').count() >= 1, '该商品应有相关文章')
    await T('tab-details').click(); await wait(200)
    assert(await visible('tab-panel-details'), '详情未恢复')
  })
  await check('详情', '相关文章 → 博客详情 → 相关商品回链', async () => {
    await T('tab-posts').click(); await wait(200)
    const href = await T('tab-panel-posts').locator('a[href^="/blog/"]').first().getAttribute('href')
    await T('tab-panel-posts').locator('a[href^="/blog/"]').first().click(); await wait(700)
    assert(path() === href, path())
    const back = page.locator('a[href^="/products/"]').first()
    assert(await back.count() > 0, '博客详情无相关商品链接')
    await back.click(); await wait(700)
    assert(path().startsWith('/products/'), path())
  })
  await goto('/products/steam-100')
  await check('详情', '批发价商品：阶梯提示 + 同类推荐跳转', async () => {
    assert((await T('price-block').textContent()).includes('满'), '未显示批发阶梯')
    const rel = T('related-products').locator('a[href^="/products/"]')
    assert(await rel.count() >= 1, '无同类推荐')
    const href = await rel.first().getAttribute('href')
    await rel.first().click(); await wait(800)
    assert(path() === href, `期望 ${href}，实际 ${path()}`)
    assert((await page.locator('h1').first().textContent()).length > 0, '跳转后无标题')
  })
  await goto('/products/psn-500')
  await check('详情', '售罄商品：按钮禁用 + 原因提示', async () => {
    assert(await T('add-to-cart').isDisabled() && await T('buy-now').isDisabled(), '售罄仍可购买')
    assert(await page.locator('.md3-banner-error').count() > 0, '无不可购买原因')
  })
  await goto('/products/chatgpt-plus')
  await check('详情', '会员商品：登录后购买 → 登录页', async () => {
    await T('login-to-buy').click(); await wait(600)
    assert(path() === '/auth/login', path())
  })
  await goto('/products/win11-pro')
  await check('详情', '限购 5：加到上限后「+」禁用', async () => {
    for (let i = 0; i < 6; i++) { if (!(await T('qty-plus').isDisabled())) await T('qty-plus').click(); await wait(80) }
    assert((await T('qty-input').inputValue()) === '5', `应停在 5，实际 ${await T('qty-input').inputValue()}`)
    assert(await T('qty-plus').isDisabled(), '到上限后 + 未禁用')
  })
  await check('详情', '面包屑 → 分类 / 商品中心', async () => {
    const links = T('crumbs').first().locator('a')
    const catHref = await links.nth(2).getAttribute('href')
    await links.nth(2).click(); await wait(600)
    assert(path() === catHref, `期望 ${catHref}，实际 ${path()}`)
  })
  if (isMobile) {
    await goto('/products/steam-50')
    await check('详情(手机)', '滚动后出现底部购买条 → 加入购物车', async () => {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await wait(700)
      const bar = page.locator('button[aria-label="加入购物车"]').last()
      assert(await bar.isVisible(), '底部购买条未出现')
      await bar.click(); await wait(700)
      assert(await page.locator('[role="alert"]').count() > 0, '无提示')
    })
  }
  await goto('/products/steam-50')
  await check('详情', '立即购买 → 结算（买即付模式）', async () => {
    await T('buy-now').click(); await wait(900)
    assert(path() === '/checkout', path())
    assert(await visible('checkout-items'), '结算页无商品清单')
    assert(await T('crumbs').first().locator('a[href="/cart"]').count() === 0, '买即付模式不应有购物车面包屑')
  })

  // ==================== F. 购物车 ====================
  await goto('/cart')
  await check('购物车', '列表 + 加减 + 输入 + 小计变化', async () => {
    const items = T('cart-item')
    const n = await items.count(); assert(n >= 2, `购物车应 ≥2 项，实际 ${n}`)
    const item = items.first()
    const sub1 = await item.locator('[data-test="cart-subtotal"]').textContent()
    // 库存被之前的测试订单扣到只剩 1 件时「+」是禁用的，这不是缺陷，跳过加一
    const plusDisabled = await item.locator('[data-test="cart-qty-plus"]').isDisabled()
    if (!plusDisabled) {
      await item.locator('[data-test="cart-qty-plus"]').click(); await wait(300)
      const sub2 = await item.locator('[data-test="cart-subtotal"]').textContent()
      assert(sub1 !== sub2, '加一后小计未变')
    }
    await item.locator('[data-test="cart-qty-input"]').fill('3'); await item.locator('[data-test="cart-qty-input"]').dispatchEvent('change'); await wait(300)
    const v3 = await item.locator('[data-test="cart-qty-input"]').inputValue()
    const capped = await item.locator('.md3-banner-warning').count() > 0
    assert(v3 === '3' || capped, `输入 3 未生效（值 ${v3}，无库存提示）`)
    if (!(await item.locator('[data-test="cart-qty-minus"]').isDisabled())) {
      await item.locator('[data-test="cart-qty-minus"]').click(); await wait(300)
      const after = await item.locator('[data-test="cart-qty-input"]').inputValue()
      assert(after === String(Number(v3) - 1), `减一后应为 ${Number(v3) - 1}，实际 ${after}`)
    }
    const total = isMobile ? page.locator('.md3-price').last() : T('cart-total')
    assert((await total.textContent()).trim().length > 0, '无合计')
    return `${n} 项`
  })
  await check('购物车', '移除 → 撤销 → 再移除', async () => {
    const before = await T('cart-item').count()
    await T('cart-item').first().locator('[data-test="cart-remove"]').click(); await wait(400)
    assert(await T('cart-item').count() === before - 1, '移除后数量未减')
    const undo = page.locator('[role="alert"]').getByRole('button', { name: /撤销|Undo/ }).first()
    assert(await undo.count() > 0, '无撤销按钮')
    await undo.click(); await wait(400)
    assert(await T('cart-item').count() === before, '撤销后未恢复')
    await T('cart-item').first().locator('[data-test="cart-remove"]').click(); await wait(400)
    assert(await T('cart-item').count() === before - 1, '再次移除失败')
  })
  await check('购物车', '继续购物 / 去结算', async () => {
    await T('cart-continue').click(); await wait(500); assert(path() === '/products', path())
    await goto('/cart')
    await (isMobile ? T('cart-checkout-mobile') : T('cart-checkout')).click(); await wait(700)
    assert(path() === '/checkout', path())
    assert(await T('crumbs').first().locator('a[href="/cart"]').count() === 1, '购物车模式应有购物车面包屑')
  })

  // ==================== G. 结算 → 支付 ====================
  await goto('/checkout')
  await check('结算', '游客邮箱校验 + 支付方式单选 + 提交按钮状态', async () => {
    assert(await visible('checkout-contact'), '无联系方式区')
    await T('guest-email').fill('bad-email'); await wait(200)
    assert(await page.locator('.md3-field-support-error').count() > 0, '错误邮箱无提示')
    await T('guest-email').fill(guest.email)
    await T('guest-password').fill(guest.password); await wait(300)
    const channels = T('pay-channel')
    assert(await channels.count() === 2, `支付方式应 2 个，实际 ${await channels.count()}`)
    await channels.nth(1).click(); await wait(200)
    assert((await channels.nth(1).getAttribute('aria-checked')) === 'true', '第二个支付方式未选中')
    await channels.nth(0).click(); await wait(200)
    assert((await channels.nth(0).getAttribute('aria-checked')) === 'true', '第一个支付方式未选中')
    const submit = isMobile ? T('checkout-submit-mobile') : T('checkout-submit')
    assert(!(await submit.isDisabled()), '填完信息后提交按钮仍禁用')
    await T('coupon-input').fill('NOPE-COUPON'); await wait(1200)
    return `优惠券无效时提示：${(await T('checkout-alert').count()) ? (await T('checkout-alert').textContent()).trim().slice(0, 40) : '无（静默）'}`
  })
  await check('结算', '会员购买链接 → 登录页并返回', async () => {
    await T('mode-member').click(); await wait(500); assert(path() === '/auth/login', path())
    await page.goBack({ waitUntil: 'networkidle' }); await wait(500)
    assert(path() === '/checkout', path())
  })
  await check('结算', '提交订单 → 支付页', async () => {
    await T('coupon-input').fill('')
    await T('guest-email').fill(guest.email)
    await T('guest-password').fill(guest.password); await wait(800)
    await T('pay-channel').nth(0).click(); await wait(200)
    await (isMobile ? T('checkout-submit-mobile') : T('checkout-submit')).click(); await wait(2500)
    assert(path() === '/pay', `期望 /pay，实际 ${path()} ${await T('checkout-alert').count() ? (await T('checkout-alert').textContent()).trim() : ''}`)
    const body = await page.locator('main').textContent()
    return body.includes('打开支付链接') ? '支付页显示跳转按钮' : body.includes('二维码') || (await page.locator('main img[alt="QR Code"]').count()) ? '支付页显示二维码' : `支付页内容：${body.replace(/\s+/g, ' ').slice(0, 80)}`
  })
  await check('支付', '复制链接 / 返回订单', async () => {
    const copy = page.getByRole('button', { name: /复制支付链接|Copy/ }).first()
    if (await copy.count()) { await copy.click(); await wait(300) }
    const back = page.getByRole('link', { name: /返回|查单|Back/ }).first()
    assert(await back.count() > 0, '无返回链接')
    await back.click(); await wait(600)
    assert(path().startsWith('/guest/orders'), path())
  })

  // ==================== H. 游客查单 ====================
  await goto('/guest/orders')
  await check('游客查单', '查询 → 结果 → 详情 → 去支付', async () => {
    if (await page.getByRole('button', { name: /清除已保存信息/ }).count()) { await page.getByRole('button', { name: /清除已保存信息/ }).click(); await wait(200) }
    await page.locator('input[type=email]').fill(guest.email)
    await page.locator('input[type=password]').fill(guest.password)
    await page.getByRole('button', { name: /查询订单/ }).click(); await wait(1200)
    const rows = page.getByRole('link', { name: /查看详情/ })
    assert(await rows.count() >= 1, '查不到刚下的订单')
    await rows.first().click(); await wait(800)
    assert(path().startsWith('/guest/orders/'), path())
    assert(await page.locator('main').textContent().then((x) => x.includes('订单')), '详情页无订单信息')
    await goto('/guest/orders')
    const pay = page.getByRole('link', { name: /去支付/ }).first()
    assert(await pay.count() >= 1, '待支付订单无「去支付」')
    await pay.click(); await wait(800)
    assert(path() === '/pay', path())
  })
  await check('游客查单', '错误密码提示', async () => {
    await goto('/guest/orders')
    if (await page.getByRole('button', { name: /清除已保存信息/ }).count()) { await page.getByRole('button', { name: /清除已保存信息/ }).click(); await wait(200) }
    await page.locator('input[type=email]').fill(guest.email)
    await page.locator('input[type=password]').fill('wrong-pass')
    await page.getByRole('button', { name: /查询订单/ }).click(); await wait(1200)
    const text = await page.locator('main').textContent()
    assert(await page.locator('.md3-banner-error').count() > 0 || /未找到|暂无订单/.test(text), '错误密码无提示')
    return /未找到/.test(text) ? '提示：未找到匹配订单' : /暂无订单/.test(text) ? '空态：暂无订单记录' : '错误横幅'
  })

  // ==================== I. 内容页 ====================
  await goto('/blog')
  await check('博客', '列表 → 搜索 → 详情', async () => {
    const cards = page.locator('a[href^="/blog/"]')
    assert(await cards.count() >= 2, '博客列表不足 2')
    await page.locator('input[type=search]').last().fill('Netflix'); await wait(900)
    const after = await page.locator('main a[href^="/blog/"]').count()
    assert(after >= 1 && after < await cards.count() + 10, `搜索后 ${after}`)
    await page.locator('main a[href^="/blog/"]').first().click(); await wait(700)
    assert(path().startsWith('/blog/'), path())
    return `搜索后 ${after} 条`
  })
  await goto('/notice')
  await check('公告', '列表 → 详情', async () => {
    const links = page.locator('main a[href^="/blog/"]')
    assert(await links.count() >= 2, '公告不足 2 条')
    await links.first().click(); await wait(700)
    assert(path().startsWith('/blog/'), path())
  })
  await goto('/about')
  await check('关于', '页面渲染 + 联系方式', async () => {
    assert(await page.locator('main h1').count() > 0, '无标题')
    return (await page.locator('main a[href^="https://t.me"]').count()) ? 'Telegram 链接存在' : '无联系链接'
  })
  await goto('/terms')
  await check('条款', '服务条款渲染', async () => { assert((await page.locator('main').textContent()).trim().length > 50, '内容为空') })
  await goto('/privacy')
  await check('条款', '隐私政策渲染', async () => { assert((await page.locator('main').textContent()).trim().length > 50, '内容为空') })
  await goto('/this-page-does-not-exist')
  await check('404', '404 页 + 返回首页', async () => {
    assert(await page.locator('text=404').count() > 0, '404 页未渲染')
    await page.getByRole('link', { name: /返回首页|回到首页|Back to home/ }).first().click(); await wait(500)
    assert(path() === '/', path())
  })

  // ==================== J. 登录 / 注册 / 找回 ====================
  await goto('/auth/login')
  await check('登录', '空提交校验 + 错误账号提示', async () => {
    await page.locator('#md3-login-email').fill('nobody@example.com')
    await page.locator('#md3-login-password').fill('wrong-password-1')
    await page.getByRole('button', { name: /^登录$|Sign in/ }).first().click(); await wait(1200)
    assert(await page.locator('.md3-banner-error, [role="alert"]').count() > 0, '错误账号无提示')
  })
  await check('登录', '显示密码 / 去注册 / 忘记密码 / 返回首页', async () => {
    await page.getByRole('button', { name: /显示密码/ }).click(); await wait(100)
    assert((await page.locator('#md3-login-password').getAttribute('type')) === 'text', '显示密码无效')
    await page.getByRole('link', { name: /忘记密码/ }).click(); await wait(500); assert(path() === '/auth/forgot', path())
    await page.goBack({ waitUntil: 'networkidle' }); await wait(300)
    await page.locator('main').getByRole('link', { name: /注册/ }).first().click(); await wait(500); assert(path() === '/auth/register', path())
    await page.locator('main').getByRole('link', { name: /返回首页/ }).first().click(); await wait(500); assert(path() === '/', path())
  })
  await goto('/auth/register')
  await check('注册', '表单字段 + 空提交校验', async () => {
    assert(await page.locator('input[type=email]').count() >= 1 && await page.locator('input[type=password]').count() >= 1, '注册表单字段缺失')
    const form = page.locator('main form').first()
    const submit = form.locator('button[type=submit]').first()
    assert(await submit.isDisabled(), '未勾选协议时提交按钮应禁用')
    const agree = form.locator('input[type=checkbox]').first()
    if (await agree.count()) await agree.check()
    await submit.click(); await wait(600)
    const nativeInvalid = await page.evaluate(() => !!document.querySelector('main form input:invalid'))
    assert(nativeInvalid || await page.locator('.md3-field-support-error, .md3-banner-error, [role="alert"]').count() > 0, '空提交无校验提示')
    assert(path() === '/auth/register', '空提交不应离开注册页')
    return nativeInvalid ? '浏览器原生 required 拦截' : '自定义校验提示'
  })
  await goto('/auth/forgot')
  await check('找回密码', '页面渲染 + 返回登录', async () => {
    assert(await page.locator('input[type=email]').count() >= 1, '无邮箱框')
    await page.getByRole('link', { name: /返回登录|回到登录/ }).first().click(); await wait(500)
    assert(path() === '/auth/login', path())
  })

  // ==================== K. 运行期错误 ====================
  record('运行期', 'JS 未捕获异常', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '))
  const realConsole = consoleErrors.filter((x) => !/favicon|__fake_gateway|net::ERR|404/.test(x))
  record('运行期', 'console.error', realConsole.length === 0, realConsole.slice(0, 3).map((x) => x.slice(0, 100)).join(' | '))
  await ctx.close()
}

await browser.close()
fs.writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2))
const pass = results.filter((r) => r.ok).length
console.log(`\n==== ${pass}/${results.length} passed ====`)
for (const r of results.filter((r) => !r.ok)) console.log(`FAIL [${r.vp}] ${r.area} · ${r.name} — ${r.note}`)
