# CUSTOM.md · 相对上游的改动记录

本分支 `custom` 是在上游 `dujiao-next/dujiao-next` 的 `main` 之上放自己改动的地方。
`main` 永远只快进同步上游，一行不改；所有自己的修改都提交到这里。

## 分支布局

| 分支 | 作用 | 规则 |
| --- | --- | --- |
| `main` | 上游镜像 | 只 `--ff-only` 同步上游，不在上面提交 |
| `custom` | 自己改过的代码 | 从 `main` 分出；上游更新后把 `main` 合并进来 |
| `deploy` | Dokploy 部署 | 孤儿分支，只有 `docker-compose.yml`、`env.example`、`README.md` |

## 当前改动清单

| 日期 | 改了什么 | 为什么 | 涉及文件 | 提交 |
| --- | --- | --- | --- | --- |
| 2026-09-05 | 去除访客可见的上游品牌痕迹（详见下节） | 不让访客看出所用框架 | 前台、后台、Go 共 34 个文件 | `f7273e4` |

## 去品牌改动说明

访客能看到的地方，全部换成中性文字或删除：

- 前台页脚（classic、vault 两套模板）：删掉指向上游 GitHub 的链接和名字
- 前台站点名兜底：`Dujiao-Next` → `Store`。后台「站点设置」填了站点名后不会用到兜底
- 前台 i18n 默认文案（三种语言）：首页 hero 标题、关于我们副标题与简介、`common.siteName`
- 浏览器控制台的品牌横幅与版本号打印：删除
- 默认图标：`/dj.svg` → `/favicon.svg`（中性购物袋图标；后台上传站点图标后会替换）
- localStorage 主题键 `dujiao_theme` → `site_theme`；Telegram 登录的全局回调名去掉前缀
- 公开配置接口 `/api/v1/public/config`：不再下发 `app_version`；默认联系方式（上游 Telegram 群、假 WhatsApp）改为空
- 新增后台接口 `GET /api/v1/admin/system/version`（所有管理员可读），后台页脚版本号改从这里取
- 后台登录页与侧边栏页脚：删掉上游名字和 GitHub 链接；后台标题与品牌文案改为「管理后台」/ `Admin`
- 2FA 发行方默认值（管理员和顾客的验证器里显示的名字）：`Store`。正式部署用 `APP_TOTP_ISSUER` 环境变量填自己的名字
- SMTP 测试邮件正文与 MIME boundary 去掉上游名字
- 2FA 恢复码下载文件名去掉前缀

保留、未改（改了会影响功能，或属于第三方名称）：

- 对接协议用的请求头 `Dujiao-Next-Api-Key`、`Dujiao-Next-Channel-*` 与站点对接协议名 `dujiao-next`：其他店铺和 Bot 靠这些对接
- 支付渠道 `DujiaoPay`：第三方支付产品名，只在后台配置页出现
- 后台首次登录的合规声明（GPL v3 说明）与仓库 `LICENSE`
- 后台的 Telegram Bot 授权购买链接、版本更新检查（访问上游 GitHub）、广告位（访问 ads-gateway.dujiao-next.com）：只有后台可见，需要时再删
- 启动横幅：只出现在容器日志里
- 微信支付安全校验回声字符串前缀：只发给微信接口

仍能被识别的痕迹：API 路径结构、前端打包产物里的变量名，以及本仓库本身在 GitHub 上是否公开。要彻底隐藏，至少把 fork 设为私有。

## 品牌名填在哪

- 站点名、图标、页脚、关于页文案：后台「站点设置」
- 验证器里显示的名字：Environment 加 `APP_TOTP_ISSUER=<你的名字>`（部署分支已提供 `TOTP_ISSUER` 变量）

## 同步上游

```bash
# 一次性：加上游远程
git remote add upstream https://github.com/dujiao-next/dujiao-next.git

# 1. main 只快进；快进失败说明 main 被动过，先查 git log --oneline upstream/main..main
git fetch upstream
git checkout main
git merge --ff-only upstream/main
git push origin main

# 2. 把上游更新合并进 custom，有冲突就解，解完推送
git checkout custom
git merge main
git push origin custom
```

查看本分支相对上游改了什么：

```bash
git log --oneline main..custom
git diff main...custom --stat
```

## 回滚

```bash
# 撤销某一项改动，保留历史
git revert <commit>

# 放弃全部改动回到上游（慎用）
git reset --hard main
git push --force-with-lease origin custom
```

## 与 deploy 的关系

`deploy` 分支用官方镜像 `dujiaonext/dujiao-next`，**不包含**本分支的改动。要把本分支的改动部署上去：

1. 在本分支加一个 GitHub Actions workflow，用仓库自带的 `Dockerfile` 构建镜像，推到 `ghcr.io/always1ov/dujiao-next`，
   tag 用版本号或提交号
2. `deploy` 分支的 compose 把 `image` 改成 `ghcr.io/always1ov/dujiao-next:${IMAGE_TAG}`，`IMAGE_TAG` 指到上一步的 tag
3. 不要在 `deploy` 的 compose 里写 `build:`。Dokploy 拉的是 `deploy` 分支，那上面没有源码

后台的「一键升级」在容器里本来就被禁用，自建镜像后升级同样是改 `IMAGE_TAG` 再 Redeploy。
