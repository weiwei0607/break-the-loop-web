# Break the Loop 生活破圈器

**每天抽一張 2 分鐘的「身體覺察」微挑戰，打斷無意識的自動導航模式。**

> Live Demo: **https://break-the-loop-web.vercel.app** (PWA, 可安裝到手機桌面）

---

## English Summary

Break the Loop is an offline-first PWA that fights "autopilot mode": every day it deals you one tiny, impossible-to-fail body-awareness challenge (e.g. "brush your teeth with your non-dominant hand") to interrupt unconscious behavior loops. Completed challenges can be reflected on with an optional Gemini-powered AI coach (bring-your-own-key, called directly from the browser — no backend). All data lives locally in IndexedDB. Built with React 19, TypeScript, Vite PWA, and Dexie; deployed on Vercel. Built and used as a personal daily tool.

---

## 問題：你不是懶，是進入了「自動導航」

起床滑手機、通勤、坐在電腦前三小時回過神來不知道做了什麼——大腦為了省電，把日常行為全部自動化。市面上習慣養成 App 都在解「如何堅持一個新習慣」，但更根本的問題是：**我們連「意識到自己在做什麼」的能力都在流失**。Break the Loop 解的是後者：不要求你建立新習慣，只在每天的循環裡插入一個「意識時刻」。

## 功能：圍繞「最小干預」設計

**每日一抽，不是待辦清單**
- 依難度（簡單 2 分鐘 / 中等 5 分鐘 / 困難 10 分鐘）隨機抽一張身體覺察挑戰
- 抽到不喜歡可以再抽，但同一天不會重複抽到同一張
- 接受的挑戰進入當日排程，完成後打勾、連續天數自動累計

**AI 反思教練（選配）**
- 完成挑戰後寫下一句感受，Gemini（gemini-2.5-flash）回覆一段溫暖的反思回饋
- 自備 API Key（BYO Key），未設定也能使用所有其他功能

**資料永遠是你的**
- 「破圈存摺」回顧所有歷史紀錄，可一鍵匯出 .txt 報告
- 全程離線可用，安裝為 PWA 後無網路也能抽卡打卡

## 產品決策（為什麼是這樣設計）

- **只做「抽卡」不做「打卡目標」**：習慣 App 的流失主因是目標失敗帶來的罪惡感。任務刻意設計成「小到不可能失敗」（用非慣用手刷牙、閉眼摸出五樣東西），把成功門檻降到趨近於零——留存靠的是無負擔，不是 streak 焦慮。
- **Local-first,零後端**：身心覺察資料是敏感資料，而這個 App 的價值不需要帳號體系。所有紀錄存 IndexedDB(Dexie)，沒有註冊、沒有伺服器、沒有可被外洩的資料庫，也順帶讓 infra 成本為零。
- **AI 反思採 BYO Key 而非內建**：內建 AI 就需要後端代理與 API 成本，與零後端定位衝突。讓使用者自備 Key、瀏覽器直連 Google API，是「有 AI 亮點」與「零維運成本」之間的取捨；反思功能因此設計為選配，降級體驗完整。
- **安全不是事後補的**：API Key 僅存 localStorage 並於記憶體快取、CSP 白名單只放行 Google Generative Language API、AI 輸入截斷至 500 字並過濾字元、請求 30 秒逾時、抽卡 2 秒冷卻防連點。
- **視覺從「遊戲化火焰」改為「呼吸感」**:gamification 元素（火焰、橘色刺激色）與正念的核心訴求矛盾，最終版改為暖奶油 + 鼠尾草綠的襯線字體設計，連 streak 圖示都從火焰改成嫩芽——產品調性一致性優先於常見的遊戲化套路。

## 技術棧

| 層 | 選擇 |
|---|---|
| 前端 | React 19 + TypeScript + Tailwind CSS |
| 建置 | Vite 6 + vite-plugin-pwa (Workbox) |
| 本地儲存 | Dexie (IndexedDB) |
| AI | Gemini API gemini-2.5-flash（瀏覽器直連，BYO Key) |
| 部署 | Vercel（靜態託管，無後端） |

## 架構

```
使用者 → React SPA (Vercel CDN)
            │
            ├─ Dexie / IndexedDB ── 抽卡紀錄、排程、streak、設定（全部本地）
            │
            └─ Gemini API (選配) ── 反思回饋
                  └ 使用者在 App 內設定的 Key，瀏覽器直接呼叫，
                    不經過任何中介伺服器；CSP 限制僅能連往 Google API
```

離線支援由 Service Worker 提供（字體 CacheFirst，其餘預快取）;API Key 與所有使用者資料從不離開裝置。

## 本地運行

```bash
git clone https://github.com/weiwei0607/break-the-loop-web.git
cd break-the-loop-web
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc -b && vite build
```

無需任何環境變數。AI 反思功能為選配：在 App 內貼上你自己的 [Gemini API Key](https://aistudio.google.com/apikey) 即可啟用。

## 測試與品質

目前無自動化測試與 CI;`npm run build` 內含完整 TypeScript 型別檢查（`tsc -b`)，且 UI 層以 ErrorBoundary 包裹避免白屏。這是個人日常使用工具的務實取捨，而非省略測試的藉口——若產品化，第一優先補上的是抽卡排程與 streak 時區邏輯的單元測試（這兩處正是開發過程中實際修過 bug 的地方）。

---

MIT License © 2026 WeiWei
