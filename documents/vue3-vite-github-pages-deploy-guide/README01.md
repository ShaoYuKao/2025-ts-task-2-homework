# 使用 GitHub Pages 部署 Vue 3 + Vite 專案完整教學（新手友善版）

這篇教學會一步一步帶你，從本機的 Vue 3 + Vite 專案，一路部署到 GitHub Pages，最後在瀏覽器上看到自己專案的正式網址。

> 目標網址大致會長這樣：`https://<你的 GitHub 帳號>.github.io/<你的專案名稱>/`

---

## 一、前置條件

在開始前，先確認幾件事情：

1. 你已經有：

   * 一個 **GitHub 帳號**
   * 一個放專案的 **GitHub Repository（倉庫）**
   * 本機已經可以執行 `npm install`、`npm run dev`、`npm run build` 的 Vue 3 + Vite 專案
2. 專案是使用 `Vite` 建立的（例如 `npm create vite@latest` 建的那種）
3. 你知道自己的 GitHub：

   * 使用者名稱：`<USERNAME>`
   * 倉庫名稱：`<REPO_NAME>`（例如：`vue-vite-shop`）

只要以上都 OK，就可以開始部署流程。

---

## 二、為什麼要設定 `base`？（Vite 特有）

在本機開發時，我們通常是用 `http://localhost:5173/` 這種根目錄執行網站。但部署到 GitHub Pages 時，網址通常長這樣：

```text
https://<USERNAME>.github.io/<REPO_NAME>/
```

注意這裡有一個「子路徑」：`/<REPO_NAME>/`。

Vite 需要知道「專案真正被部署的根路徑」是什麼，才知道要怎麼產生正確的資源路徑（例如 JS / CSS 的路徑）。

所以，我們必須在 `vite.config.ts` 裡設定 `base`，讓 Vite 知道：

* 在 **正式環境（production）**：使用 `/<REPO_NAME>/` 當作根路徑
* 在 **本機開發**：仍然用 `/` 就好

---

## 三、步驟一：修改 `vite.config.ts`

打開專案根目錄的 `vite.config.ts`，加入 `base` 設定（記得把 `<REPO_NAME>` 換成你的倉庫名稱）：

```ts
import { fileURLToPath, resolve, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  // ✅ 這裡是關鍵：正式環境使用 /<REPO_NAME>/，開發環境仍然是 /
  base: process.env.NODE_ENV === 'production' ? '/<REPO_NAME>/' : '/',
  plugins: [vue(), vueDevTools()],
  // ...原本的其他設定保留即可
})
```

> 小提醒：
>
> * `<REPO_NAME>` 請改成實際的 GitHub 倉庫名稱，例如：`vue-vite-shop`。
> * 設完後，本機 `npm run dev` 還是照常使用，不會受影響。

---

## 四、步驟二：新增 GitHub Actions 自動部署流程

接下來，我們希望「只要推程式到 main 分支，就自動幫我們 build 並部署到 GitHub Pages」。

這可以透過 **GitHub Actions** 來達成。

### 4-1. 建立工作流程檔

在專案裡建立資料夾與檔案：

```text
.github/
  workflows/
    deploy.yml
```

`deploy.yml` 內容如下（可以整段貼上）：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ['main']  # 當推到 main 分支時啟動
  workflow_dispatch:     # 可以手動在 GitHub 介面觸發

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          NODE_ENV: production
          # 底下兩個會在步驟三用 Secrets 帶入
          VITE_BASE_URL: ${{ secrets.VITE_BASE_URL }}
          VITE_API_PATH: ${{ secrets.VITE_API_PATH }}

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 4-2. 這份 workflow 在做什麼？

簡單拆解一下：

* `on.push.branches: ['main']`：

  * 代表只要你 `git push origin main`，這個流程就會自動執行。
* `build` job：

  * `checkout`：把你當前的程式碼抓下來
  * `setup-node`：安裝 Node.js 環境
  * `npm ci`：安裝套件
  * `npm run build`：打包前端專案，輸出到 `dist/`
  * `upload-pages-artifact`：把 `dist/` 上傳成一個 artifact，給後面部署用
* `deploy` job：

  * 使用 `actions/deploy-pages`，把 `dist` 內容部署到 GitHub Pages

你不需要手動上傳 `dist`，一切都交給 Actions。

---

## 五、步驟三：設定 Vite 環境變數（GitHub Secrets）

你的專案目前是使用 `.env` 檔案來設定後端 API 相關的環境變數：

* `VITE_BASE_URL`
* `VITE_API_PATH`

但 `.env` 通常會被列在 `.gitignore` 裡，不會被推到 GitHub。所以在 GitHub Actions 執行 `npm run build` 時，是拿不到這些值的。

解法就是把這些值放到 **GitHub Repository 的 Secrets** 裡，然後在 workflow 中透過 `secrets.XXX` 讀出來。

### 5-1. 在 GitHub 設定 Secrets

1. 開啟你的 GitHub 專案頁面
2. 點選 **Settings** → 左邊選單找到 **Secrets and variables** → **Actions**
3. 點選 **New repository secret**，分別新增：

   * `VITE_BASE_URL` → `https://ec-course-api.hexschool.io`
   * `VITE_API_PATH` → `2025typescript`

> 以上是你目前專案使用的設定，如果未來後端改 URL 或路徑，再來這裡調整即可。

### 5-2. Workflow 中如何使用這些 Secrets？

在上面 `deploy.yml` 的 `Build` 步驟裡，我們已經這樣寫：

```yaml
      - name: Build
        run: npm run build
        env:
          NODE_ENV: production
          VITE_BASE_URL: ${{ secrets.VITE_BASE_URL }}
          VITE_API_PATH: ${{ secrets.VITE_API_PATH }}
```

這代表：

* 在 `npm run build` 的那個步驟裡
* 會把 GitHub Secrets 中的 `VITE_BASE_URL`、`VITE_API_PATH`
* 塞進環境變數給 Vite 使用

只要你的程式碼裡是用 `import.meta.env.VITE_BASE_URL` / `import.meta.env.VITE_API_PATH`，打包時就會拿到正確的值。

---

## 六、步驟四：啟用 GitHub Pages

接著要告訴 GitHub：這個專案要用 **GitHub Pages + Actions** 來部署。

1. 開啟你的 GitHub 專案頁面
2. 點選上方的 **Settings**
3. 左側選單找到 **Pages**
4. 在 **Source** 區塊，選擇：

   * **Source：GitHub Actions**

設定完成後，GitHub 就知道要從我們的 `deploy.yml` 拿部署結果。

---

## 七、步驟五：推送程式碼，觸發部署

現在，一切設定都在專案裡了，只要推一次程式碼，就會啟動 Actions 幫你部署。

在本機終端機輸入：

```bash
git add .
git commit -m "chore: add GitHub Pages deployment"
git push origin main
```

推送完成後：

1. 到 GitHub 專案頁面
2. 點選 **Actions** 分頁
3. 你會看到 `Deploy to GitHub Pages` 的 workflow 正在執行
4. 等它顯示綠色 ✅ 成功後
5. 再回到 **Settings → Pages**，通常就會看到一個網址，例如：

   ```text
   https://<USERNAME>.github.io/<REPO_NAME>/
   ```

點進去，就能看到你的 Vue 3 + Vite 專案上線了！ 🎉

---

## 八、常見問題（Q&A）

### Q1. 網站 404 或 CSS / JS 壞掉？

可能原因：`base` 設定錯誤。

* 請檢查 `vite.config.ts` 的 `base`：

  * 是否是 `'/<REPO_NAME>/'`？
  * 是否與 GitHub 倉庫名稱完全相同（大小寫也要一樣）？

### Q2. GitHub Actions 沒有跑？

檢查以下幾點：

* 你的 workflow 檔案路徑是否正確：`.github/workflows/deploy.yml`
* 你的 Branch 名稱是 `main` 嗎？

  * 如果是 `master`，記得把 `branches: ['main']` 改成 `branches: ['master']`
* 推送時有沒有推到對的遠端分支：`git push origin main`

### Q3. Actions 失敗，說找不到環境變數？

* 檢查

  * 是否已在 Settings → Secrets → Actions 裡設定 `VITE_BASE_URL`、`VITE_API_PATH`
  * 名稱是否拼錯（大小寫要相同）
* 檢查 workflow 的 `env:` 是否寫成：

  ```yaml
  VITE_BASE_URL: ${{ secrets.VITE_BASE_URL }}
  VITE_API_PATH: ${{ secrets.VITE_API_PATH }}
  ```

### Q4. 想要重新部署怎麼辦？

只要再 push 一次程式碼（或直接在 GitHub 的 Actions 頁面，手動重新執行 workflow），就會重新 build + deploy。

---

## 九、流程總結（快速版）

如果你之後要快速回顧，記這幾步就好：

1. **設定 `base`**：

   * `vite.config.ts` 裡加：
   * `base: process.env.NODE_ENV === 'production' ? '/<REPO_NAME>/' : '/',`
2. **建立 GitHub Actions workflow**：

   * `.github/workflows/deploy.yml` 放上 build + deploy 的設定
3. **在 GitHub 設定 Secrets**：

   * `VITE_BASE_URL`、`VITE_API_PATH`
4. **Settings → Pages**：

   * Source 選 **GitHub Actions**
5. **推程式碼**：

   * `git push origin main` → 等 Actions 跑完 → 到 Pages 看網址

這樣你的 Vue 3 + Vite 專案就可以穩定部署到 GitHub Pages，之後只要更新程式碼再推一次，網站就會自動更新 👍
