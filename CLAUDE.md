# 專案概述
Hexagon Vocabulary & Grammar，結合六角形地圖介面、無冷卻間隔重複系統 (SRS) 與 Firebase 雲端同步。
本專案採用「迴圈模式 (Loop Mode)」開發，重視檔案模組化與自動化腳本的搭配。

# 檔案導引
開發前必須讀取 ROADMAP.md 了解當前任務進度與下一個目標。

# 技術棧
- 前端：純 HTML, CSS (自訂屬性), Vanilla JavaScript 模組 (ES Modules)。
- 後端：Firebase (Auth, Firestore) 版本 10.12.0 (compat 模式)。
- 圖形：HTML5 Canvas API。
- 語音：Web Speech API (SpeechSynthesis, SpeechRecognition)。
- 工具：Prettier (自動格式化)、Git/GitHub (版控與自動上傳)。

# 核心業務邏輯
1. 狀態與存檔管理
   - 支援多存檔 (`appSaves`)，獨立保存 tokens、grid、storageData、checkInHistory、unlockedRules 以及 自選語音設定 (`voiceSettings`)。
   - 雙重儲存機制：登入狀態同步至 Firestore，未登入存於 LocalStorage。
2. 測驗系統 (SRS)
   - 抽取規則：L5 隨機取 5 個；L1-L4 取時間 (`levelUpdatedAt`) 最舊的前 5 個；L0 取題庫新字。
   - 防禦規則：絕對禁止加入 SRS 天數冷卻邏輯，單純依據時間戳記排序。
   - 升降級規則：過關升級並更新時間戳記；L1-L4 失敗等級不變且不更新時間戳記；L5 失敗降為 L4 並更新時間戳記；L0 失敗保留在原順序。
3. 視覺與互動 (建設遊戲化)
   - 地圖格子背景色對應單字詞性 (POS)。
   - 等高線 (Level 2-5) 需判斷相鄰且同級/高級的六角形，將外框融合繪製。
   - 區分點擊空地 (放置單字) 與點擊既有方塊 (觸發語音朗讀與互動)。

# 任務執行規範 (Loop Workflow)
每次接收開發指令時，嚴格遵守以下迴圈流程：
1. 確立目標：檢視並更新 ROADMAP.md 的當前目標。
2. 實作修改：修改相關模組檔案 (HTML/CSS/JS)。
3. 自動驗證：修改完成後，主動檢查邏輯正確性、跨裝置相容性，並確保符合 Prettier 格式。
4. 標記押期：確認無誤後，將 ROADMAP.md 的任務標記為 [x] 並押上完成日期 (如 `[x] (2026-06-11)`)。嚴禁更動歷史任務。
5. 自動歸檔：若當前任務的已完成項目超過 5 條，主動移至 `## 歷史紀錄 (Archive)`。
6. 版本控制：透過 Claude Code (CLI) 的終端機執行權限，在取得授權後直接執行 `git add`、`git commit` 與 `git push`，自動完成 GitHub 的版本控制與上傳。
7. 推進迴圈：完成單一任務與上傳後，直接詢問是否繼續執行 ROADMAP.md 的下一項任務。

# 開發與溝通規範
- 直接說明重點，簡潔精準，避免堆砌詞藻。
- 絕對禁止使用任何表情符號。
- 避免使用對比式論述。
- 維持模組化結構，新增邏輯需歸類至對應的獨立 JS 檔案中。