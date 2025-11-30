# 🚀 Vue 3 + Vite 專案部署指南：GitHub Pages 全攻略

歡迎！這份文件將帶領你一步步將你的 Vue 3 專案發布到網路上。我們將使用  **GitHub Pages**  配合  **GitHub Actions**  來達成「自動化部署」。

這表示以後你只需要推送 (Push) 程式碼，網站就會自動更新，非常方便！

## ✅事前準備

在開始之前，請確認你已經完成以下事項：

1. 擁有一個 GitHub 帳號。
2. 專案已經上傳到 GitHub Repository (倉庫)。
3. 知道你的  **Repository 名稱**  (例如：你的網址是 `github.com/user/my-shop`，名稱就是 `my-shop`)。

## 步驟一：設定 Vite 的基本路徑 (Base Path)

預設情況下，Vite 認為你的網站是部署在根目錄 (如 `com`)。但 GitHub Pages 通常會掛在子目錄下 (如 `com/RepoName/`)。我們需要告訴 Vite 這一點。

請打開專案根目錄下的 `vite.config.ts`：

```ts
import { fileURLToPath, resolve, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// [https://vite.dev/config/](https://vite.dev/config/)
export default defineConfig({
  // ⚠️ 關鍵設定：請將 <REPO_NAME> 替換成你的 GitHub 倉庫名稱
  // 例如：如果倉庫叫 'vue-shop'，就改成 '/vue-shop/'
  base: process.env.NODE_ENV === 'production' ? '/<REPO_NAME>/' : '/',

  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
```

> **為什麼要這樣做？**  > 如果不設定 `base`，部署後你的 CSS 和圖片路徑會壞掉，導致網站變成一片空白。

## 步驟二：建立 GitHub Actions 自動化腳本

我們要建立一個「食譜」，告訴 GitHub 的機器人該如何打包並發布你的網站。

1. 在專案根目錄建立資料夾 `.github`。
2. 在 `.github` 裡面建立資料夾 `workflows`。
3. 新增檔案 `deploy.yml`。

完整路徑應為：`.github/workflows/deploy.yml`

將以下內容貼上（請注意縮排）：

```yml
name: Deploy to GitHub Pages

on:
  # 當推送到 main 分支時觸發
  push:
    branches: ['main']
  # 允許手動從 Actions 頁籤觸發
  workflow_dispatch:

# 設定權限
permissions:
  contents: read
  pages: write
  id-token: write

# 避免同時間多次部署互相衝突
concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout 程式碼
        uses: actions/checkout@v4

      - name: 安裝 Node.js 環境
        uses: actions/setup-node@v4
        with:
          node-version: '22' # 建議使用專案對應的版本
          cache: 'npm'

      - name: 安裝套件
        run: npm ci

      - name: 打包專案 (Build)
        run: npm run build
        # ⚠️ 這裡會讀取你在 GitHub 設定的環境變數 (Secrets)
        env:
          NODE_ENV: production
          VITE_BASE_URL: ${{ secrets.VITE_BASE_URL }}
          VITE_API_PATH: ${{ secrets.VITE_API_PATH }}

      - name: 上傳打包好的檔案
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
      - name: 部署到 GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## 步驟三：設定專案環境變數 (Secrets) 🔒

因為安全性考量，我們通常不會將 `.env` 檔案上傳到 GitHub。但打包網站時需要這些變數，所以我們要在 GitHub 後台設定。

1. 進入你的 GitHub Repository 頁面。
2. 點擊上方選單的  **Settings**  (設定)。
3. 左側選單找到  **Secrets and variables** ，點開後選擇  **Actions** 。
4. 點擊綠色的  **New repository secret**  按鈕。

請依序新增以下兩組變數（根據您的專案需求）：

| **Name (名稱)** | **Secret (值)** |
| --- | --- |
| `VITE_BASE_URL` | `https://ec-course-api.hexschool.io` |
| `VITE_API_PATH` | `2025typescript` |

> **小提醒：**  > 設定完成後，您無法再次查看 Secret 的內容（只能修改或刪除），這是正常的安全機制。

## 步驟四：啟用 GitHub Pages

這是最容易被遺忘的一步！

1. 回到  **Settings**  頁面。
2. 左側選單點擊  **Pages** 。
3. 在  **Build and deployment**  區塊下：
    - **Source**  請選擇  **GitHub Actions**  (預設可能是 Deploy from a branch)。

4. 設定會自動儲存。

## 步驟五：推送並見證奇蹟 🚀

現在一切就緒，回到你的開發環境 (VS Code)，打開終端機執行：

```bash
# 加入所有修改
git add .

# 提交修改 (訊息可以自己寫)
git commit -m "chore: 設定 GitHub Pages 自動部署"

# 推送到遠端
git push origin main
```

### 如何查看進度？

1. 回到 GitHub Repository 頁面。
2. 點擊上方的  **Actions**  頁籤。
3. 你會看到一個名為 "Deploy to GitHub Pages" 的工作正在旋轉（進行中）。
4. 變成 ✅ 綠色打勾後，點擊該工作項目，你會看到  **deploy**  區塊下有一個網址。

點擊網址，恭喜你！你的網站上線了！🎉

## 💡 常見問題排除 (FAQ)

 **Q1: 打開網站是一片空白，且 Console 出現很多 404 錯誤？**

- **檢查：**  步驟一的 `base` 設定是否正確？是否忘記改成你的 Repository 名稱？
- **檢查：**  Repository 名稱大小寫是否相符？

 **Q2: 重新整理頁面後出現 404 Not Found？**

- **原因：**  這是 Vue Router `history` 模式在 GitHub Pages 的特性。因為 GitHub Pages 認為你在找一個真實存在的 HTML 檔案，但其實那是 Vue 的虛擬路由。
- **解法 (簡單版)：**  將 Vue Router 改為 `HashMode` (網址會多一個 `#`)。
- **解法 (進階版)：**  在 `public` 資料夾下新增一個 `404.html` (內容複製 `index.html`)，這是一個常見的 Hack 手法。

 **Q3: 部署失敗，顯示 npm ci error？**

- **檢查：**  你的專案是否有 `package-lock.json`？ `npm ci` 指令非常依賴這個鎖定檔案，請確保它有被上傳。
