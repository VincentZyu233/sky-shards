# 🌠 Sky 碎片 Web 应用

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Visit-6C757D?logo=github&logoColor=white&labelColor=181717)](https://vincentzyu233.github.io/sky-shards/) [![Cloudflare Pages](https://img.shields.io/badge/Cloudflare%20Pages-Visit-6C757D?logo=cloudflare&logoColor=white&labelColor=F38020)](https://sky-shards-vincentzyu233-fork.pages.dev/)

## 📝 简介

计算游戏《光·遇》中[碎片喷发](https://sky-children-of-the-light.fandom.com/wiki/Shard_Eruptions)的颜色、时间和位置。

碎片信息按照[碎片预测规则](./ShardPredictionRule.md)计算，具体计算逻辑位于[此处](./src/data/shard.ts)

## 🌐 本地化

Google 表格链接：[Sky Shard Translation](https://docs.google.com/spreadsheets/d/16eSANTI310SY8uWjsjbxNBzyD-49hwF3OGYRkFPykoo/edit)

构建应用时，语言数据会从 Google 表格下载到 `src/i18n/locales.json`。

## 🧭 路由

由[设置上下文](./src/context/Settings.tsx)处理

- `/` - 今日碎片喷发页面
- `/:lang` - 翻译语言
  - 可用语言列在 [Google 表格](https://docs.google.com/spreadsheets/d/16eSANTI310SY8uWjsjbxNBzyD-49hwF3OGYRkFPykoo/edit#gid=2102926823)中
- 相对日期
  - `/:lang/tomorrow` 或 `/tmr` - 明日碎片喷发页面
  - `/:lang/yesterday` 或 `/ytd` - 昨日碎片喷发页面
- `/:lang/:year/:month/:day` - 指定日期的碎片喷发页面，例如：
  - `/:lang/2022/12/31` 2022 年 12 月 31 日的碎片喷发页面
  - `/:lang/2023/1/1` 2023 年 1 月 1 日的碎片喷发页面

### ⚙️ 查询参数

- `gsTrans` - 获取 Google 表格翻译（`1` | `0`）
- `twelveHour` - 以 12 小时制显示时间（`true` | `false` | `system`）
- `lightMode` - 浅色模式（`true` | `false` | `system`）
- `timezone` - 时区 [IANA 时区](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)（`string`）
- `fontSize` - 字体大小（保留 1 位小数）（`number`）
- `numCols` - 日期选择器表格的列数（`number`）

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

GitHub Pages 和 Cloudflare Pages 部署设置记录在 [deploy-pages.zh-cn.md](./.github/workflows/deploy-pages.zh-cn.md) 中。

## 💬 反馈与问题

如有任何反馈或问题，欢迎提交 issue 或 pull request。不必拘谨，直接告诉我你的想法即可。我会尽快回复。

## 📄 许可证

简而言之：你可以任意使用这些代码。如果能附上本仓库或网站的链接，我们将不胜感激。

> [!IMPORTANT]
>
> `/public/infographics/*`、`/public/ext/*` 和 `/public/emojis/*` 中的资源并非由我创建，因此不受此许可证约束。

[MIT](./LICENSE)
