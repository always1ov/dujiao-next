---
status: accepted
---
# 三分支布局：main 只跟上游，custom 放定制，deploy 是孤儿分支

我们既要长期吃上游更新，又要保留自己的改动与一份能直接给 Dokploy 用的部署配置。于是 `main` 只允许 fast-forward 同步上游、永不直接提交；所有定制都在 `custom`，镜像也从它构建；`deploy` 是只含 compose 与环境变量样例的孤儿分支，与代码历史无关。这样同步上游只是一条 `git merge main`，回滚只是换镜像 tag。

## Considered Options

- 直接在 `main` 上改：同步上游每次都要 rebase 自己的提交，越积越痛。
- 部署文件放在 `custom` 里：会把宿主机相关的东西混进代码分支，也让 Dokploy 拉整个仓库。
