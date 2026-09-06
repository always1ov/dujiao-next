# 研究：现在还有哪些地方能看出源项目

Status: resolved
Type: research
日期：2026-09-06。方法：在 `custom` 分支上 grep 前台源码、路由、本地存储键、i18n 默认文案、后端 API 前缀。每条都标注来源文件。

## 已经处理掉的（去品牌，见 ADR-0003）

- 上游名字与 GitHub 链接：前台页脚、后台登录页与侧栏、控制台横幅、公开配置接口的版本号
- 默认站点名兜底改为 `Store`，默认图标改为中性购物袋
- localStorage 主题键、Telegram 回调名去掉前缀
- 2FA 发行方、SMTP 测试邮件、恢复码文件名去掉前缀

## 仍能识别的痕迹（按访客能否看到排序）

### 访客直接可见

| 痕迹 | 位置 | 说明 |
| --- | --- | --- |
| 页面结构与流程一模一样 | 三套模板都沿用上游的页面划分：首页 → 商品 → 详情 → 购物车 → 结算 → 支付；游客查单独立页 | 熟悉上游的人一眼认出。这是自建品牌最该动的地方 |
| URL 路径 | `frontend/user/src/router/index.ts`：`/guest/orders`、`/pay`、`/me/*`、`/recharge-orders/:no`、`/categories/:slug`、`/auth/*` | 与上游完全一致 |
| 默认文案的「味道」 | `src/i18n/locales/*.json`：`home.hero.*`、`footer.description`、`about.*`、`auth.login.subtitle`（"Welcome back, continue your order flow."）、`vault.hero.*` | 后台填了站点文案能盖掉一部分，但页面级小文案（按钮、提示、空态）全是上游的措辞 |
| 空的 `<title>` | `frontend/user/index.html` | 上游靠运行时注入站点名；未加载前标题为空 |
| 预览参数 | `?template=vault|md3` 与 localStorage 键 `dj-storefront-template` | 任何人都能试出还有别的模板 |
| 联盟推广的存储键 | `dj_affiliate_attribution`、`dj_affiliate_visitor_key` | 浏览器 DevTools 可见 |
| 购物车等存储键 | `cart_items`、`user_token`、`user_profile`、`guest_order_auth` | 中性，但键名集合与上游一致 |

### 对开发者或抓包可见

| 痕迹 | 位置 | 说明 |
| --- | --- | --- |
| API 路径结构 | `/api/v1/...`，路由名与上游一致 | 改动成本极高，不建议动 |
| 对接协议请求头 | `Dujiao-Next-Api-Key`、`Dujiao-Next-Channel-*` | 只有做站点对接的人会看到，ADR-0003 决定保留 |
| 打包产物里的变量名 | Vite 产物 | 无法根除，接受 |

### 尚未审计

- 交易邮件模板（订单确认、卡密交付、验证码）的措辞与署名：`internal/` 邮件模板，访客会收到
- sitemap / robots 的默认内容
- 后台「版本更新检查」与广告位请求的目标域名（只有后台可见，但会暴露在浏览器网络面板）

## 对自建品牌的含义

- 想让人看不出来，光换配色字体不够，要改**页面组织**与**文案措辞**：首页信息架构、商品展示方式、结算与查单的流程页面、空态与提示语。
- URL 可以改一部分访客常见的（例如 `/guest/orders` → `/track`），但每改一条都要同时改路由、页面内链接、邮件里的链接，并保留旧路径跳转。
- 邮件模板必须一起改，否则顾客收到的第一封邮件就露馅。
