# Dujiao-Next · Dokploy 部署分支

本分支（`deploy`）是孤儿分支，只有三个文件：

| 文件 | 作用 |
| --- | --- |
| `docker-compose.yml` | 服务定义、挂载、Traefik 路由。所有会变的值都是 `${VAR}` |
| `env.example` | 全部变量，值是格式正确的假值；整段粘进 Dokploy Environment 后改真值 |
| `README.md` | 本文 |

源码在 `main`（与上游 `dujiao-next/dujiao-next` 同步，一行不改）。部署用的是官方预构建镜像，本分支不参与构建。

## 1. 这是什么

Dujiao-Next 是数字商品（卡密 / 虚拟物品）自动发货商城：Go 后端 + 用户商城 SPA + 后台管理 SPA，
三者打在一个二进制里，单进程单端口。

- 镜像：`dujiaonext/dujiao-next`（Docker Hub，amd64 / arm64），运行时基于 alpine，以 root 运行
- 容器内监听：`8080`，健康检查 `GET /health`
- 伴生服务：一个独立 Redis，负责缓存、登录限流、Google 登录一次性状态、asynq 异步队列与定时任务
- 数据库：SQLite 单文件（可换 PostgreSQL，见「我做的假设」）

## 2. 怎么部署

1. Dokploy → 新建 **Compose** 服务 → Provider 选 Git / GitHub
   - Repository：`always1ov/dujiao-next`
   - **Branch：`deploy`**（选成 `main` 会走源码构建，日志里出现 `Building` / `load build definition from Dockerfile`）
   - Compose Path：`./docker-compose.yml`
2. Environment 页把 `env.example` 全文粘进去
3. 把标了「必须改」的值换成真值：`APP_DOMAIN`、`ADMIN_PATH`、`TRUSTED_PROXIES`、三把密钥、`REDIS_PASSWORD`、`ADMIN_PASSWORD`
4. Domains 页删掉自动生成的 sslip.io 记录（路由全在 compose labels 里）
5. Deploy

**升级 / 回滚**：改 `IMAGE_TAG` 再 Redeploy。`pull_policy: always` 保证每次都真的拉镜像。
`IMAGE_TAG=latest` 自动跟进最新版；出问题改回具体版本号即可回滚（先看第 7 节第 2 条）。

## 3. 前置条件

- Traefik 外部网络 `traefik-net` 和中间件 `web-default@docker`、`tinyauth@docker` 已存在
- DNS：
  - 内网访问：灰云 A 记录 `APP_DOMAIN` → 内网 IP，走 `websecure`，证书由 `cloudflare` 解析器 DNS 挑战签发
  - 隧道访问：橙云 CNAME `APP_DOMAIN` → 隧道地址，并在 Zero Trust 加 Public Hostname 指向 Traefik 的 `web-cf` 入口
- 宿主机执行下面的命令拿 `traefik-net` 的子网，填进 `TRUSTED_PROXIES`：

  ```bash
  docker network inspect traefik-net -f '{{range .IPAM.Config}}{{.Subnet}}{{end}}'
  ```

- 数据目录不用提前建：两个容器都以 root 启动，Docker 自动创建 `../files/...`

## 4. 首次启动会发生什么

按程序实际执行顺序：

1. 校验三把密钥：各不少于 32 字符、互不相同、不含 `change-me` 字样。不合格直接退出，什么都不动
2. 校验 `ADMIN_PATH`（规则见 `env.example`）。不合法在碰数据库之前退出
3. 自动创建 `db/`、`uploads/`、`logs/`
4. 创建 SQLite 库并自动迁移表结构
5. 管理员表为空 → 用 `ADMIN_USERNAME` / `ADMIN_PASSWORD` 创建超级管理员；不为空 → 跳过（同名账号存在时只确保它是超管）
6. 启动 HTTP 服务和后台 worker。worker 注册的定时任务：分销佣金确认（1 分钟）、分销账本确认（1 分钟）、
   库存预警（1 分钟）、上游库存同步（默认 5 分钟，后台可改）、采购单同步（30 分钟）
7. Redis 容器首次启动把 `/data` 属主改成 `redis` 用户，然后降权运行

Redis 连接是惰性的：Redis 比应用晚几秒就绪只会留下几条连接失败日志，队列会自动重连，不需要人工处理。

## 5. 怎么确认成功

- Dokploy 部署日志出现 `Pulling` / `Pulled`，**没有** `Building`
- 容器日志（Dokploy Logs）只有启动横幅和 `Embedded SPAs: admin (<ADMIN_PATH>), user (/)`。
  release 模式下应用日志只写文件不写 stdout，真正的日志在 `../files/dujiao-next/logs/app.log`
- `docker ps` 里 `dujiao-next` 状态 `healthy`（启动后 90 秒内显示 `starting` 是正常的）
- `curl -s https://<APP_DOMAIN>/health` 返回 `{"status":"ok"}`
- 浏览器打开 `https://<APP_DOMAIN>/` 是商城首页，`https://<APP_DOMAIN><ADMIN_PATH>/` 是后台登录页
- `../files/dujiao-next/db/dujiao.db` 存在；`../files/redis/data/` 下有 `appendonlydir/`
- 内网那条路由的证书已签出（浏览器锁图标或 Traefik dashboard）

## 6. 数据在哪、丢了会怎样

| 宿主机路径（相对 compose 文件） | 内容 | 丢了会怎样 |
| --- | --- | --- |
| `../files/dujiao-next/db/` | SQLite：商品、订单、卡密、用户、后台设置 | 全部业务数据没了 |
| `../files/dujiao-next/uploads/` | 商品图片等上传文件 | 图片 404，数据库记录还在 |
| `../files/dujiao-next/logs/` | `app.log`，100MB × 7 份轮转并压缩 | 没影响 |
| `../files/redis/data/` | 缓存、队列里待执行的任务、限流计数、登录一次性状态 | 待执行的异步任务丢失；用户登录态不受影响（JWT 无状态） |

**不可再生的密钥：`APP_SECRET_KEY`。** 它用 AES-256 加密数据库里的支付网关密钥、SMTP 密码、站点对接密钥等。
换掉或丢失，这些设置全部解不开，只能在后台重新填一遍。
备份必须三件一起：`db/` + `uploads/` + `APP_SECRET_KEY`，缺一个都恢复不完整。

`JWT_SECRET`、`USER_JWT_SECRET` 可以再生，换掉只是所有人重新登录一次。

备份 SQLite 时先在 Dokploy 里 Stop 服务再复制 `db/`；直接复制运行中的库文件可能拿到不一致的快照。

## 7. 这个服务特有的坑

1. **release 模式日志不进 Dokploy 面板** —— 只写 `logs/app.log`。排错先看这个文件，不要以为容器没输出就是没启动
2. **后台的「一键升级」在容器里被禁用** —— 程序检测到 `/.dockerenv` 直接阻断，这是预期行为。升级走改 `IMAGE_TAG` + Redeploy。
   数据库迁移只向前，升级前先备份 `db/`；回退到旧 tag 不保证能读新库
3. **`TRUSTED_PROXIES` 填错** —— 所有访客 IP 都会被记成 Traefik 的容器 IP，登录限流（5 次 / 5 分钟，封 15 分钟）
   会把所有人一起封掉。症状：后台审计日志和订单里的 IP 全是同一个 `172.x`
4. **隧道入口的后台路径挂了 tinyauth** —— 需要 tinyauth 的 cookie 域覆盖 `APP_DOMAIN`。不覆盖的表现是登录后无限跳转。
   不想要这层：删掉 compose 里 `-admin-cf` 开头的 5 行 labels
5. **支付回调必须匿名可达** —— 支付网关回调和 webhook 在 `/api/v1/...` 下，上游对接 API 在 `/api/v1/upstream/...`，
   都走隧道那条不带 ForwardAuth 的路由。千万别给 `-cf` 路由加 `tinyauth`，否则支付页面「一直等待」、上游同步全部失败
6. **Traefik 在容器 healthy 之前不转发** —— 每次 Redeploy 后约 15 秒内域名返回 404，正常。一直 404 就
   `docker inspect dujiao-next --format '{{json .State.Health}}'` 看健康检查输出
7. **安全头可能拦住第三方支付 / 登录组件** —— `web-default` 里的 CSP、X-Frame-Options 等如果影响 Stripe Elements、
   PayPal 按钮、Telegram Login Widget、Google 登录弹窗，要用自带安全头的自定义中间件**替换** `web-default`，不能追加在链尾
8. **经隧道拿不到真实 IP** —— Traefik 的 `web-cf` 入口需要在 `forwardedHeaders.trustedIPs` 里信任 cloudflared 的地址，
   否则应用记录的是 cloudflared 的 IP。这是 Traefik 侧配置，不在本 compose 里
9. **改 `ADMIN_PATH` 要 Redeploy** —— labels 和环境变量都没有热加载；改完旧书签失效，后台 API 路径不变
10. **iOS 上的 Google 登录依赖 Redis** —— Redis 挂了只有这一条流程失败，其他登录方式不受影响
11. **`network dokploy-network declared as external, but could not be found`** —— Domains 页的自动记录没删干净时出现。
    先删记录；急救用 `docker network create --driver bridge dokploy-network`
12. **运维子命令在同一个二进制里**：

    ```bash
    docker exec -it dujiao-next ./dujiao-next admin list-admins
    docker exec -it dujiao-next ./dujiao-next admin reset-password
    docker exec -it dujiao-next ./dujiao-next admin reset-2fa
    ```

## 我做的假设

逐条列出你可能想改的决定和改法：

1. **Redis 用伴生容器，不接共享实例。** 已有 Redis 的话：删掉 `redis` 服务和 `redis-net`，
   把 `REDIS_HOST` / `QUEUE_HOST` 改成现有容器名、`REDIS_PASSWORD` 改成它的密码。需要 Redis 7 以上（iOS Google 登录用 `GETDEL`）
2. **SQLite，不用 PostgreSQL。** 要换：`DATABASE_DRIVER=postgres`、`DATABASE_DSN=host=<容器名> user=… password=… dbname=… sslmode=disable`，
   再加 `DATABASE_POOL_MAX_OPEN_CONNS=10`（SQLite 固定为 1）
3. **隧道入口整站公开，只给后台页面加 tinyauth。** 商城是给公众用的，支付回调也要匿名可达，所以主路由不能挂统一登录。
   完全不用 tinyauth：删 `-admin-cf` 的 5 行。想让内网入口的后台也限内网段：另拆一条 `-admin-lan` 路由加 `internal-only@docker`，
   不要直接加在 `-lan` 上（会把商城一起限掉）
4. **纯环境变量，不挂 `config.yml`。** 冷门配置项按「`节_键` 大写」规则加环境变量，例如
   `CAPTCHA_PROVIDER=turnstile`、`CAPTCHA_TURNSTILE_SITE_KEY=…`、`UPLOAD_MAX_SIZE=20971520`、`CORS_ALLOWED_ORIGINS=a.com,b.com`（列表用逗号）。
   一定要用文件：放到 `../files/dujiao-next/config/config.yml`，挂到 `/app/config.yml:ro`。环境变量仍然优先；
   文件不存在时 Docker 会把它建成目录，先建文件再 Deploy
5. **`IMAGE_TAG=v1.4.7`。** 依据：Docker Hub 上 `v1.4.7` 与 `latest` 同一时刻（2026-09-02）推送，上游 GitHub Release `v1.4.7` 非预发布。
   想自动跟进改成 `latest`
6. **内存上限：应用 768M，Redis 256M。** Go 进程常驻约 100M，余量留给 4096×4096 图片解码。上传大图时容器以 137 退出就放宽应用的上限
7. **没开宿主机端口映射。** 需要绕过 DNS 和 Traefik 的抢救通道：给 `dujiao-next` 加
   `ports: ["${HOST_IP}:${HOST_PORT}:8080"]`，Environment 里加这两个变量（绑内网 IP，不要 `0.0.0.0`）
8. **`APP_NAME=dujiao-next`**，容器名和 Traefik router / service 名都跟着它。同机部署第二套改这个值即可
9. **`TZ=Asia/Shanghai`**，两个容器都写死
10. **首个管理员用环境变量创建。** 不想让密码留在 Environment：登录后把 `ADMIN_PASSWORD` 清空再 Redeploy，
    release 模式下空值只会打一条「已跳过默认管理员初始化」的警告
11. **分销 / 白标模式没开。** 要开：`RESELLER_ENABLED=true`、`RESELLER_MAIN_HOSTS=<APP_DOMAIN>`、`RESELLER_SUBDOMAIN_BASE=<泛域名>`，
    并给 Traefik 补对应 Host 规则和泛域名证书，这部分不在本 compose 里
12. **加了健康检查。** 它让 Traefik 在迁移完成前不转发流量，代价是第 7 节第 6 条那 15 秒。不想要就删掉 `healthcheck` 段

## 部署前

1. Domains 页删掉自动生成的 sslip.io 记录
2. DNS：内网建灰云 A 记录指内网 IP；走隧道建橙云 CNAME 指隧道地址
3. 走隧道的在 Zero Trust 加 Public Hostname 指向 Traefik
4. `docker network inspect traefik-net` 拿子网填 `TRUSTED_PROXIES`
5. `openssl rand -hex 32` 跑三次填三把密钥，再跑一次填 `REDIS_PASSWORD`

## 部署后

- 登录后台：开 2FA、改站点名称 / URL、配 SMTP、配支付渠道、按需改上游同步间隔
- 把 `APP_SECRET_KEY` 单独存进密码管理器
- 验证：`../files/dujiao-next/db/dujiao.db` 在增长、`../files/redis/data/` 有 AOF 文件、证书签出、
  用支付渠道的测试模式下一单确认回调能到
- 可选：清空 `ADMIN_PASSWORD` 再 Redeploy
