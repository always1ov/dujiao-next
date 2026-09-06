# 本地全栈冒烟与截图

改了前台页面后，用这套步骤在本地起完整栈、造几条演示数据、用 Chromium 截桌面与手机两种视图。整个过程不碰线上，也不需要 Docker。

## 1. 准备

```bash
# Redis（asynq 需要）
redis-server --daemonize yes --port 6379 --save "" --appendonly no
# 配置：三个 secret 必须互不相同且足够随机，否则服务拒绝启动
cp config.yml.example /tmp/run/config.yml
# 编辑 /tmp/run/config.yml：
#   server.port: 18090   database.dsn: /tmp/run/db/dujiao.db（sqlite）
#   app.secret_key / jwt.secret / user_jwt.secret 各填 48 位随机十六进制
#   admin.default_username / default_password 填一个测试账号
```

## 2. 构建并启动全栈二进制

```bash
(cd frontend/admin && pnpm run build:fullstack)
(cd frontend/user  && pnpm run build)
rm -rf internal/web/dist && mkdir -p internal/web/dist
cp -r frontend/admin/dist internal/web/dist/admin
cp -r frontend/user/dist  internal/web/dist/user
go build -tags fullstack -o /tmp/run/dj ./cmd/server
(cd /tmp/run && setsid nohup ./dj > server.log 2>&1 < /dev/null &)
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:18090/health   # 200
```

结束时 `pkill -x dj` 并 `redis-cli shutdown nosave`，再 `rm -rf internal/web/dist`（该目录被 git 忽略，但留着会误导下一次 fullstack 构建）。

## 3. 造演示数据（管理 API）

```python
# /tmp/run/seed.py  —  python3 seed.py
import json, urllib.request
BASE = 'http://127.0.0.1:18090/api/v1'
def call(method, path, data=None, token=None):
    req = urllib.request.Request(BASE + path, method=method,
        data=json.dumps(data).encode() if data is not None else None)
    req.add_header('Content-Type', 'application/json')
    if token: req.add_header('Authorization', 'Bearer ' + token)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode() or '{}')
tok = call('POST', '/admin/login', {'username': '<测试账号>', 'password': '<测试密码>'})['data']['token']
cats = {}
for slug, zh, en in [('game', '游戏点卡', 'Game Cards'), ('stream', '流媒体会员', 'Streaming')]:
    cats[slug] = call('POST', '/admin/categories',
        {'slug': slug, 'name': {'zh-CN': zh, 'en-US': en, 'zh-TW': zh}, 'sort_order': 0}, tok)['data']['id']
for slug, title, cat, price, ft, pt, tags in [
    ('steam-50', 'Steam 充值卡 50 元', 'game', 50, 'auto', 'guest', ['热销']),
    ('office-2024', 'Office 2024 永久授权', 'stream', 199, 'manual', 'guest', []),
]:
    pid = call('POST', '/admin/products', {
        'category_id': cats[cat], 'slug': slug,
        'title': {'zh-CN': title, 'en-US': title, 'zh-TW': title},
        'description': {'zh-CN': '付款后自动发货。'}, 'content': {'zh-CN': '<p>使用说明。</p>'},
        'price_amount': price, 'images': [], 'tags': tags,
        'purchase_type': pt, 'fulfillment_type': ft,
        'manual_stock_total': 20 if ft == 'manual' else None, 'is_active': True, 'sort_order': 0,
    }, tok)['data']['id']
    if ft == 'auto':
        call('POST', '/admin/card-secrets/batch',
             {'product_id': pid, 'secrets': [f'{slug.upper()}-KEY-{i:03d}' for i in range(1, 8)]}, tok)
```

## 4. 截图

```js
// /tmp/run/shoot.mjs  —  node shoot.mjs <输出目录> '[["home","/"],["detail","/products/steam-50",{"full":true}]]'
// Playwright 的路径按环境调整：本地 `npm i playwright`，用 import { chromium } from 'playwright'
import { chromium } from 'playwright'
const base = 'http://127.0.0.1:18090'
const [out, pagesJson] = process.argv.slice(2)
const pages = JSON.parse(pagesJson)
const browser = await chromium.launch()
for (const vp of [{ name: 'desktop', width: 1366, height: 900 }, { name: 'mobile', width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, deviceScaleFactor: vp.deviceScaleFactor || 1 })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()) })
  for (const [name, path, opts] of pages) {
    // 预览某套模板：加 ?template=<name>
    await page.goto(base + path + (path.includes('?') ? '&' : '?') + 'template=md3', { waitUntil: 'networkidle' })
    if (opts?.dark) await page.evaluate(() => document.documentElement.classList.add('dark'))
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${out}/${vp.name}-${name}.png`, fullPage: !!opts?.full })
  }
  if (errors.length) console.log(vp.name, 'ERRORS:\n' + errors.join('\n'))
  await ctx.close()
}
await browser.close()
```

后台截图同理：先打开 `/admin/login`，填 `#username` / `#password`，点 `button[type=submit]`，再访问 `/admin/products` 等页面。

## 5. 看什么

- 桌面与手机各一遍：顶栏、底部导航栏、商品卡价格是否换行、表单高度是否对齐、暗色模式。
- 控制台没有 pageerror。
- 截图发给店主看一眼再提交。

## 6. 全量点击测试（md3 店面）

改了外壳或页面结构之后，不要只看截图，把每个能点的地方跑一遍。脚本在 `docs/agents/scripts/`：

```bash
# 造演示数据（27 个商品、二级分类、SKU、售罄、限购、横幅、公告、文章、首页弹窗、假网关支付渠道；可重复执行）
ADMIN_USER=<测试账号> ADMIN_PASS=<测试密码> python3 docs/agents/scripts/seed-demo.py
# 桌面 + 手机各跑一遍，结果表打到终端，失败项截图与 results.json 落在输出目录
node docs/agents/scripts/md3-clicktest.mjs /tmp/run/click all
# Playwright 不在默认位置时：
PW_MODULE=/opt/node22/lib/node_modules/playwright/index.mjs PW_CHROMIUM=/opt/pw-browsers/chromium node docs/agents/scripts/md3-clicktest.mjs /tmp/run/click desktop
```

覆盖：首页每个入口、头部与工具条、分类下拉、页脚每个链接、手机菜单与底栏、列表筛选/分页/视图、详情规格/数量/加购/页签/推荐、
购物车增删改、结算校验与提交、支付页、游客查单、博客/公告/关于/条款/404、登录/注册/找回、运行期 pageerror 与 console.error。
2026-09-06 基线：桌面 60/60，手机 53/53。新增页面或按钮时往脚本里加一个 `check()`，用 `data-test` 属性定位，不要靠文案。

已知的「不是缺陷」：未登录点「个人中心」跳登录页；库存被之前的订单扣光时购物车拒绝加量并提示；注册页未勾选协议时提交按钮禁用，空提交由浏览器原生 `required` 拦截。
