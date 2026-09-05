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

暂无，本分支目前与 `main` 完全一致。每加一项改动补一行：

| 日期 | 改了什么 | 为什么 | 涉及文件 | 提交 |
| --- | --- | --- | --- | --- |

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
