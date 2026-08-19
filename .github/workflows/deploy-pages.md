> **[【📖 English README】](../../README.md)**
> **[【📖 简体中文 阅读我文档】](../../README.zh-cn.md)**

> **[【📖 English Shard Prediction Rule】](../../ShardPredictionRule.md)**
> **[【📖 简体中文 碎片预测规则】](../../ShardPredictionRule.zh-cn.md)**

> **[【📖 English Dual Pages Deployment】](deploy-pages.md)**
> **[【📖 简体中文 双网页部署】](deploy-pages.zh-cn.md)**

# 🚀 Dual Pages Deployment

This repository deploys the `production` branch to both platforms:

- GitHub Pages: `https://vincentzyu233.github.io/sky-shards/`
- Cloudflare Pages: `https://sky-shards-vincentzyu233-fork.pages.dev/`

Every push to `production` runs the keyword check. The two deployment jobs run only when the latest commit message contains the lowercase keyword `deploy-pages` or `deploypages`. Brackets are optional, but uppercase variants do not trigger deployment. A manual workflow dispatch always deploys both sites.

## 1. ✅ Prerequisites

Authenticate the GitHub CLI and confirm that it can access the fork:

```powershell
gh auth status
gh repo view VincentZyu233/sky-shards
```

## 2. ☁️ Create the Cloudflare Pages project

Create a Direct Upload project named exactly `sky-shards-vincentzyu233-fork`. Do not connect it to GitHub because this repository uploads through GitHub Actions. Cloudflare documents both methods in the [official Direct Upload guide](https://developers.cloudflare.com/pages/get-started/direct-upload/).

### 🖥️ Dashboard method

1. Create the Git-ignored `tmp/upload` placeholder directory containing one minimal `index.html`. A truly empty directory cannot be uploaded:

```powershell
# Run from the repository root.
$placeholder = 'tmp/upload'
New-Item -ItemType Directory -Path $placeholder -Force | Out-Null
Set-Content -LiteralPath (Join-Path $placeholder 'index.html') -Encoding utf8 -Value '<!doctype html><meta charset="utf-8"><title>sky-shards-vincentzyu233-fork deployment pending...</title><h1>sky-shards-vincentzyu233-fork deployment pending...</h1>'
```

Linux and macOS equivalent:

```bash
# Run from the repository root.
placeholder='tmp/upload'
mkdir -p "$placeholder"
printf '%s\n' '<!doctype html><meta charset="utf-8"><title>sky-shards-vincentzyu233-fork deployment pending...</title><h1>sky-shards-vincentzyu233-fork deployment pending...</h1>' > "$placeholder/index.html"
```

2. Open [Cloudflare Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages) and select the account that will own the project.
3. Select **Create application** -> **Get started** -> **Drag and drop your files**.
4. Enter `sky-shards-vincentzyu233-fork`, drag the `tmp/upload` directory into the upload area, and select **Deploy site**. If prompted after the upload, select **Save and Deploy**.
5. After the project is created successfully, remove the temporary directory:

```powershell
# Run from the repository root.
Remove-Item -LiteralPath 'tmp/upload' -Recurse -Force
```

Linux and macOS equivalent:

```bash
# Run from the repository root.
rm -rf -- 'tmp/upload'
```

The placeholder is only the initial production deployment. The first successful GitHub Actions run replaces it with the complete site from `dist`. Cloudflare allows dashboard drag-and-drop and Wrangler deployments within the same Direct Upload project. A Direct Upload project cannot be converted to Git integration later, but this does not prevent deployments through GitHub Actions and Wrangler.

Dashboard drag-and-drop may assign a different production branch. The workflow corrects the project setting to `production` through the Cloudflare Pages API before each upload, so `--branch=production` updates the main `pages.dev` domain instead of creating only a preview deployment.

### 💻 Wrangler CLI method

This is the recommended setup for this repository because it creates the empty project without a temporary dashboard upload. OAuth opens a browser once, while project creation and verification stay in the terminal:

```powershell
npx wrangler@4 login --use-keyring
npx wrangler@4 whoami
npx wrangler@4 pages project create sky-shards-vincentzyu233-fork --production-branch production
npx wrangler@4 pages project list
npx wrangler@4 logout
```

Record the Account ID printed by `wrangler whoami`; it is needed as `CLOUDFLARE_ACCOUNT_ID`. The `--use-keyring` option stores OAuth credentials in Windows Credential Manager instead of a plaintext Wrangler configuration file.

## 3. 🔑 Create a minimal Cloudflare API token

The first persistent API token should be created once in the dashboard. Follow Cloudflare's [official token guide](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) and open [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens):

1. Select **Create Token** -> **Create Custom Token** -> **Get started**.
2. Name it `sky-shards Cloudflare Pages deploy`.
3. Under **Permissions**, add only:

```text
Account / Cloudflare Pages / Edit
```

4. Under **Account Resources**, choose **Include** -> **Specific account** and select the account that owns the Pages project.
5. Select **Continue to summary** -> **Create Token**, then copy the secret immediately. It is shown only once.

No Zone, Workers Scripts, Workers Routes, or KV permissions are required for Direct Upload. Do not paste the token into a command; the `gh secret set` commands in the next section prompt for it securely.

Cloudflare supports [creating additional tokens through the API](https://developers.cloudflare.com/fundamentals/api/how-to/create-via-api/), but the initial token must still be created in the dashboard with the powerful **Create additional tokens** capability. Creating that bootstrap token only to automate this one least-privilege token increases risk, so this guide intentionally keeps the one-time dashboard step.

If you did not record the Account ID from `wrangler whoami`, open [Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages), find **Account Details**, and copy **Account ID**.

## 4. 🔐 Store GitHub Actions secrets

Run these commands one at a time. `gh` prompts for each value without adding it to the command itself:

```powershell
gh secret set CLOUDFLARE_API_TOKEN --repo VincentZyu233/sky-shards
gh secret set CLOUDFLARE_ACCOUNT_ID --repo VincentZyu233/sky-shards
gh secret list --repo VincentZyu233/sky-shards
```

The list command shows secret names and update times, not their values.

## 5. 🌐 Enable GitHub Pages Actions deployment

Create the Pages site with GitHub Actions as its build type:

```powershell
gh api --method POST repos/VincentZyu233/sky-shards/pages -f build_type=workflow
```

If GitHub reports that the Pages site already exists, update it instead:

```powershell
gh api --method PUT repos/VincentZyu233/sky-shards/pages -f build_type=workflow
```

The UI equivalent is repository **Settings** -> **Pages** -> **Build and deployment** -> **Source: GitHub Actions**.

## 6. 🚀 Trigger the first deployment

Review and commit the local changes, including the deployment keyword in the latest commit:

```powershell
git add -A
git commit -m "ci: deploy Sky Shards to both Pages hosts [deploy-pages]"
git push origin production
```

Other accepted examples include `deploy-pages`, `[deploypages]`, and `deploypages`. Uppercase variants such as `[DEPLOY-PAGES]` are intentionally ignored.

A `production` push without either keyword runs only the keyword check; both deployment jobs are skipped, so the site is neither built nor deployed.

## 7. 🔍 Run and inspect deployments manually

```powershell
gh workflow run deploy-pages.yml --ref production --repo VincentZyu233/sky-shards
gh run list --workflow deploy-pages.yml --repo VincentZyu233/sky-shards
gh run watch --repo VincentZyu233/sky-shards
```

To inspect a failed run, replace `RUN_ID` with the value shown by `gh run list`:

```powershell
gh run view RUN_ID --log-failed --repo VincentZyu233/sky-shards
gh run rerun RUN_ID --failed --repo VincentZyu233/sky-shards
```

## 🛠️ Troubleshooting

- `Project not found`: confirm the Cloudflare project is a Direct Upload project named `sky-shards-vincentzyu233-fork` in the account identified by `CLOUDFLARE_ACCOUNT_ID`.
- `Authentication error`: recreate the token with `Account / Cloudflare Pages / Edit` for the correct account, then update `CLOUDFLARE_API_TOKEN`.
- The main Cloudflare domain still shows the placeholder: confirm the workflow's **Configure Cloudflare Pages production branch** step succeeded, then rerun the workflow.
- GitHub Pages returns 404 at the site root: confirm Pages uses **GitHub Actions** as its source and rerun the GitHub Pages job.
- A deployment job is skipped: confirm the latest pushed commit contains lowercase `deploy-pages` or `deploypages`, or use manual dispatch.
- A deep GitHub Pages URL returns the app shell before JavaScript loads: this is expected because `404.html` provides the SPA fallback.
