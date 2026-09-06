---
status: accepted
---
# 前台字体本地打包，不走境外 CDN

店主和顾客都在中国大陆，Google Fonts 一类 CDN 时通时不通，会让页面首屏卡在字体上。vault 的 Rubik / Nunito Sans 与 md3 的 Roboto 都通过 `@fontsource/*` 打进构建产物，中文回退系统字体栈。以后任何模板加字体都照此办理。
