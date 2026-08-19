> **[📖 English README](../../README.md)**
> **[📖 简体中文 README](../../README.zh-cn.md)**
> **[📖 English Shard Prediction Rule](../../ShardPredictionRule.md)**
> **[📖 简体中文碎片预测规则](../../ShardPredictionRule.zh-cn.md)**
> **[📖 English Dual Pages Deployment](deploy-pages.md)**
> **[📖 简体中文双 Pages 部署](deploy-pages.zh-cn.md)**

# 🚀 双 Pages 部署

本仓库会将 `production` 分支部署到以下两个平台：

- GitHub Pages：`https://vincentzyu233.github.io/sky-shards/`
- Cloudflare Pages：`https://sky-shards-vincentzyu233-fork.pages.dev/`

当最新提交信息包含小写关键词 `deploy-pages` 或 `deploypages` 时，工作流会运行。方括号可有可无，但大写形式不会触发部署。手动触发工作流始终会部署两个站点。

## 1. ✅ 前置条件

登录 GitHub CLI，并确认它可以访问此复刻仓库：

```powershell
gh auth status
gh repo view VincentZyu233/sky-shards
```

## 2. ☁️ 创建 Cloudflare Pages 项目

创建一个名称严格为 `sky-shards-vincentzyu233-fork` 的 Direct Upload 项目。不要将其连接到 GitHub，因为本仓库会通过 GitHub Actions 上传。Cloudflare 在[官方 Direct Upload 指南](https://developers.cloudflare.com/pages/get-started/direct-upload/)中记录了以下两种方法。

### 🖥️ 网页控制台方法

1. 创建 Git 已忽略的 `tmp/upload` 占位目录，其中仅包含一个最小 `index.html`。真正的空目录无法上传：

```powershell
# 请在仓库根目录执行。
$placeholder = 'tmp/upload'
New-Item -ItemType Directory -Path $placeholder -Force | Out-Null
Set-Content -LiteralPath (Join-Path $placeholder 'index.html') -Encoding utf8 -Value '<!doctype html><meta charset="utf-8"><title>sky-shards-vincentzyu-fork deployment pending...</title><h1>sky-shards-vincentzyu-fork deployment pending...</h1>'
```

Linux 和 macOS 等价命令：

```bash
# 请在仓库根目录执行。
placeholder='tmp/upload'
mkdir -p "$placeholder"
printf '%s\n' '<!doctype html><meta charset="utf-8"><title>sky-shards-vincentzyu-fork deployment pending...</title><h1>sky-shards-vincentzyu-fork deployment pending...</h1>' > "$placeholder/index.html"
```

2. 打开 [Cloudflare Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages)，选择将拥有该项目的账户。
3. 依次选择 **Create application** -> **Get started** -> **Drag and drop your files**。
4. 输入 `sky-shards-vincentzyu233-fork`，将 `tmp/upload` 目录拖入上传区域，然后选择 **Deploy site**。如果上传后出现提示，再选择 **Save and Deploy**。
5. 项目创建成功后，删除临时目录：

```powershell
# 请在仓库根目录执行。
Remove-Item -LiteralPath 'tmp/upload' -Recurse -Force
```

Linux 和 macOS 等价命令：

```bash
# 请在仓库根目录执行。
rm -rf -- 'tmp/upload'
```

占位页只是首次生产部署。GitHub Actions 首次成功运行后，会使用 `dist` 中的完整站点替换它。Cloudflare 允许同一个 Direct Upload 项目混用网页拖放和 Wrangler 部署。Direct Upload 项目以后不能转换为 Git integration，但这不会妨碍 GitHub Actions 和 Wrangler 部署。

通过网页拖放创建项目时，Cloudflare 可能会指定其他生产分支。工作流会在每次上传前通过 Cloudflare Pages API 将项目设置修正为 `production`，确保 `--branch=production` 更新主 `pages.dev` 域名，而不是只创建 Preview 部署。

### 💻 Wrangler CLI 方法

本仓库推荐使用这种设置方式，因为它无需临时网页上传即可创建空项目。OAuth 只会打开一次浏览器，其余项目创建和验证操作都在终端中完成：

```powershell
npx wrangler@4 login --use-keyring
npx wrangler@4 whoami
npx wrangler@4 pages project create sky-shards-vincentzyu233-fork --production-branch production
npx wrangler@4 pages project list
npx wrangler@4 logout
```

记录 `wrangler whoami` 输出的 Account ID，后面需要将其保存为 `CLOUDFLARE_ACCOUNT_ID`。`--use-keyring` 会将 OAuth 凭据存入 Windows 凭据管理器，而不是 Wrangler 的明文配置文件。

## 3. 🔑 创建最小权限的 Cloudflare API Token

首个长期 API Token 应在网页控制台中一次性创建。按照 Cloudflare 的[官方 Token 指南](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)，打开 [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)：

1. 依次选择 **Create Token** -> **Create Custom Token** -> **Get started**。
2. 将其命名为 `sky-shards Cloudflare Pages deploy`。
3. 在 **Permissions** 中只添加：

```text
Account / Cloudflare Pages / Edit
```

4. 在 **Account Resources** 中选择 **Include** -> **Specific account**，然后选择拥有该 Pages 项目的账户。
5. 依次选择 **Continue to summary** -> **Create Token**，并立即复制密钥。它只会显示一次。

Direct Upload 不需要 Zone、Workers Scripts、Workers Routes 或 KV 权限。不要将 Token 粘贴到命令中，下一节的 `gh secret set` 命令会安全地提示输入。

Cloudflare 支持[通过 API 创建其他 Token](https://developers.cloudflare.com/fundamentals/api/how-to/create-via-api/)，但初始 Token 仍必须在网页控制台中创建，并拥有高权限的 **Create additional tokens** 能力。仅为自动创建这一个最小权限 Token 而额外创建引导 Token 会增加风险，因此本指南有意保留这一次网页操作。

如果没有记录 `wrangler whoami` 输出的 Account ID，请打开 [Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages)，找到 **Account Details** 并复制 **Account ID**。

## 4. 🔐 保存 GitHub Actions Secrets

逐条运行以下命令。`gh` 会提示输入每个值，而不会将其加入命令本身：

```powershell
gh secret set CLOUDFLARE_API_TOKEN --repo VincentZyu233/sky-shards
gh secret set CLOUDFLARE_ACCOUNT_ID --repo VincentZyu233/sky-shards
gh secret list --repo VincentZyu233/sky-shards
```

列表命令只显示 Secret 名称和更新时间，不显示它们的值。

## 5. 🌐 启用 GitHub Pages Actions 部署

创建 Pages 站点，并将 GitHub Actions 设置为其构建类型：

```powershell
gh api --method POST repos/VincentZyu233/sky-shards/pages -f build_type=workflow
```

如果 GitHub 提示 Pages 站点已存在，请改为更新它：

```powershell
gh api --method PUT repos/VincentZyu233/sky-shards/pages -f build_type=workflow
```

对应的界面操作是仓库 **Settings** -> **Pages** -> **Build and deployment** -> **Source: GitHub Actions**。

## 6. 🚀 触发首次部署

检查并提交本地改动，在最新提交中包含部署关键词：

```powershell
git add -A
git commit -m "ci: deploy Sky Shards to both Pages hosts [deploy-pages]"
git push origin production
```

其他可接受的示例包括 `deploy-pages`、`[deploypages]` 和 `deploypages`。类似 `[DEPLOY-PAGES]` 的大写形式会被有意忽略。

推送到 `production` 时如果不包含任一关键词，工作流会记录为已跳过，并且不会构建或部署。

## 7. 🔍 手动运行和检查部署

```powershell
gh workflow run deploy-pages.yml --ref production --repo VincentZyu233/sky-shards
gh run list --workflow deploy-pages.yml --repo VincentZyu233/sky-shards
gh run watch --repo VincentZyu233/sky-shards
```

要检查失败的运行，请将 `RUN_ID` 替换为 `gh run list` 显示的值：

```powershell
gh run view RUN_ID --log-failed --repo VincentZyu233/sky-shards
gh run rerun RUN_ID --failed --repo VincentZyu233/sky-shards
```

## 🛠️ 故障排查

- `Project not found`：确认 Cloudflare 项目是 Direct Upload 项目，名称为 `sky-shards-vincentzyu233-fork`，并且位于 `CLOUDFLARE_ACCOUNT_ID` 标识的账户中。
- `Authentication error`：为正确账户使用 `Account / Cloudflare Pages / Edit` 权限重新创建 Token，然后更新 `CLOUDFLARE_API_TOKEN`。
- Cloudflare 主域名仍显示占位页：确认工作流中的 **Configure Cloudflare Pages production branch** 步骤成功，然后重新运行工作流。
- GitHub Pages 在站点根路径返回 404：确认 Pages 使用 **GitHub Actions** 作为来源，然后重新运行 GitHub Pages job。
- 工作流被跳过：确认最新推送的提交包含小写的 `deploy-pages` 或 `deploypages`，或者使用手动触发。
- 深层 GitHub Pages URL 在 JavaScript 加载前返回应用外壳：这是预期行为，因为 `404.html` 提供了 SPA 回退。
