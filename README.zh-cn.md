> **[【📖 English README】](README.md)**
> **[【📖 简体中文 阅读我文档】](README.zh-cn.md)**

> **[【📖 English Shard Prediction Rule】](ShardPredictionRule.md)**
> **[【📖 简体中文 碎片预测规则】](ShardPredictionRule.zh-cn.md)**

> **[【📖 English Dual Pages Deployment】](.github/workflows/deploy-pages.md)**
> **[【📖 简体中文 双网页部署】](.github/workflows/deploy-pages.zh-cn.md)**

# 🌠 Sky 碎片 Web 应用

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Visit-6C757D?logo=github&logoColor=white&labelColor=181717)](https://vincentzyuapps.github.io/sky-shards/) [![Cloudflare Pages](https://img.shields.io/badge/Cloudflare%20Pages-Visit-6C757D?logo=cloudflare&logoColor=white&labelColor=F38020)](https://sky-shards-vincentzyu233-fork.pages.dev/)

## 📝 简介

计算游戏《光·遇》中[碎片喷发](https://sky-children-of-the-light.fandom.com/wiki/Shard_Eruptions)的颜色、时间和位置。

碎片信息按照[碎片预测规则](./ShardPredictionRule.md)计算，具体计算逻辑位于[此处](./src/data/shard.ts)。

## 🖼️ 页面预览

> ↓ 深色模式桌面端页面预览

<p align="center">
  <img src="./docs/images/preview/preview.pc.dark.png" alt="Sky 碎片深色模式桌面端页面预览" width="100%" />
</p>

> ↓ 深色模式移动端页面预览

<p align="center">
  <img src="./docs/images/preview/preview.phone.dark.png" alt="Sky 碎片深色模式移动端页面预览" width="32%" />
</p>

> ↓ 浅色模式桌面端页面预览

<p align="center">
  <img src="./docs/images/preview/preview.pc.white.png" alt="Sky 碎片浅色模式桌面端页面预览" width="100%" />
</p>

> ↓ 浅色模式移动端页面预览

<p align="center">
  <img src="./docs/images/preview/preview.phone.white.png" alt="Sky 碎片浅色模式移动端页面预览" width="32%" />
</p>

## 🌍 服务器能力差异

使用 Logo 旁的服务器切换控件选择 `🌍 TGC Global 那游公司国际服` 或 `🇨🇳 NetEase CN 网易国服`。切换时会保留当前日历日期，同时按照所选服务器的规则和事件时区更新排期与倒计时。

| 能力                                   | 国际服 | 国服 | 说明                                                                                                                |
| -------------------------------------- | :----: | :--: | ------------------------------------------------------------------------------------------------------------------- |
| 服务器专属的碎片日期、颜色、地点和时间 |   ✅   |  ✅  | 国际服使用 TGC 规则；国服使用移植自 [skyshard_calendar](https://github.com/ichozero/skyshard_calendar) 的网易排期。 |
| 事件时区和本地时间转换                 |   ✅   |  ✅  | 国际服使用 `America/Los_Angeles`；国服使用 `Asia/Shanghai`。                                                        |
| 区域名称、地图名称和通用地图图鉴       |   ✅   |  ✅  | 这些内容描述两服共享的游戏本体，因此会复用。                                                                        |
| 碎片奖励                               |   ✅   |  ✅  | 两个服务器分别采用对应规则来源提供的奖励数值。                                                                      |
| 特殊日期的社区人工纠错（`override`）   |   ✅   |  ❌  | 当前远程纠错来自国际服观测，不能可靠地套用到国服。                                                                  |
| 当天经过确认的精确落点（`variation`）  |   ✅   |  ❌  | 国服显示通用地图，并将精确落点标记为待确认。                                                                        |
| 当天经过确认的远古回忆（`memory`）     |   ✅   |  ❌  | 国服保留游戏内六种回忆的定义，但将当天选中的回忆标记为待确认。                                                      |
| 实时碎片异常警告                       |   ✅   |  ❌  | 当前警告源面向国际服，不能代表网易国服的运营状态。                                                                  |

表中的 ❌ 表示本站暂时没有可靠的国服每日观测数据源，并不表示国服客户端中不存在对应的落点变体、远古回忆或异常状态。

## 🌐 本地化

Google 表格链接：[Sky Shard Translation](https://docs.google.com/spreadsheets/d/16eSANTI310SY8uWjsjbxNBzyD-49hwF3OGYRkFPykoo/edit)

构建应用时，语言数据会从 Google 表格下载到 `src/i18n/locales.json`。

## 🧭 路由

由[设置上下文](./src/context/Settings.tsx)处理

- `/` - 今日碎片喷发页面
- `/:lang` - 翻译语言
  - 可用语言列在 [Google 表格](https://docs.google.com/spreadsheets/d/16eSANTI310SY8uWjsjbxNBzyD-49hwF3OGYRkFPykoo/edit#gid=2102926823)中
- 相对日期
  - `/:lang/tomorrow`、`/:lang/tmr`、`/tomorrow` 或 `/tmr` - 明日碎片喷发页面
  - `/:lang/yesterday`、`/:lang/ytd`、`/yesterday` 或 `/ytd` - 昨日碎片喷发页面
- `/:lang/:year/:month/:day` - 指定日期的碎片喷发页面

> 以 `:` 开头的名称是占位符，冒号不是实际 URL 的一部分。请将 `:lang` 替换为 `en`、`zh` 等语言代码，并将日期占位符替换为所需日期。
>
> 示例：
>
> - `/zh/2026/08/20?server=netease_cn`
> - `/en/2026/08/20?server=tgc_global`
> - `/zh/tomorrow?server=netease_cn`

### ⚙️ 查询参数

- `server` - 游戏服务器（`tgc_global` | `netease_cn`）；默认值为 `tgc_global`
- `gsTrans` - 获取 Google 表格翻译（`1` | `0`）；默认值为 `0`，仅对当前 URL 生效
- `twelveHourMode` - 时间显示格式（`true` | `false` | `system`）；默认值为 `system`；继续兼容旧版 `twelveHour` URL
- `lightMode` - 页面主题（`true` | `false` | `system`）；默认值为 `system`
- `timezone` - 时区（`system` | 有效的 [IANA 时区标识符](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)，例如 `Asia/Shanghai`）；默认值为 `system`
- `fontSize` - 内容字号倍率（正数）；默认值为 `1`
- `numCols` - 日期选择器的列数（`5` | `7`）；默认值为 `5`
- `legTimeline` - 使用旧版时间线显示（`1` | `0`）；默认值为 `1`

> 示例：`?server=netease_cn&twelveHourMode=true&fontSize=1.2&legTimeline=0`

## 🛠️ 开发

环境要求：

- [Node.js](https://nodejs.org/en/) >= 18
- [pnpm](https://pnpm.io/) >= 8

### 💻 命令

为 pnpm 启用 Corepack

```bash
corepack enable
```

安装依赖

```bash
pnpm install
```

运行开发服务器

```bash
pnpm dev
```

构建项目

```bash
pnpm build
```

## 🚀 部署

GitHub Pages 和 Cloudflare Pages 部署设置记录在 [【📖 deploy-pages.zh-cn.md】](./.github/workflows/deploy-pages.zh-cn.md) 中。

## 💬 反馈与问题

如有任何反馈或问题，欢迎提交 issue 或 pull request。不必拘谨，直接告诉我你的想法即可。我会尽快回复。

## 📄 许可证

简而言之：你可以任意使用这些代码。如果能附上本仓库或网站的链接，我们将不胜感激。

> [!IMPORTANT]
>
> `/public/infographics/*`、`/public/ext/*` 和 `/public/emojis/*` 中的资源并非由我创建，因此不受此许可证约束。

[【📖 MIT LICENSE】](./LICENSE)
