# 開發進度與目標

> 題型架構、模組呼叫關係、SRS 資料流見 [ARCHITECTURE.md](ARCHITECTURE.md)

---

## 當前任務 (Current Focus)

### L1-V 題型
- [x] (2026-06-11) [L1-V-1] `index.html` — 新增 `#action-l1v` 面板：提示文字、「認識」/「不認識」按鈕、`#l1v-countdown` 倒數容器
- [x] (2026-06-11) [L1-V-2] `style.css` — 無需新增（全部沿用既有 `.action-btn`、`.countdown-bar`、`.feedback-correct/wrong` 等 class）
- [x] (2026-06-11) [L1-V-3] `js/questions/q-stub.js` — `registerQuestionModule(1, {...})` 實作：`l1vKnow()` → `successes++`；`l1vDontKnow()` → `attempts++`；雙向皆 `startAutoAdvance('l1v-countdown')`；不設 `requiresAudio`

### L4+ 核心功能
- [ ] [L4-1] 開發 L4 自由造句題型：顯示目標單字，使用者輸入完整句子，以 `buildWordPosMap()` 解析每詞 POS 後呼叫 `checkWalsRule()`，驗證至少一條已解鎖規則；通過升級給代幣，失敗提示缺少的 POS
- [ ] [L4-2] `js/grammar.js` — WALS 規則解鎖狀態的 UI 標記與存檔資料完全綁定（現在 `unlockedRules` 已在存檔中，確認 UI 渲染與載入時同步）
- [ ] [L5-1] 開發 L5 自由對話系統：先以 mock 驗證 UI 流程（無提示輸入框 + 結果判斷區），再規劃 LLM API 整合

### 基礎優化
- [ ] 優化 Web Speech API 語音辨識失敗時的提示與重試體驗
- [ ] 執行 Firebase 登入同步 E2E 流程：登入 → 練習 → 退出 → 換裝置 → 驗證資料還原


### QA 測試清單（新功能驗收）
- [ ] [QA-1] TEMP-1：無存檔按「載入 Lesson1」→ 提示；有存檔載入 → 成功；重複載入 → 提示「已載入」
- [ ] [QA-2] SKIP：練習中啟用無障礙 → L1-S / L1-A 不再出現；退出後重進 → 按鈕恢復
- [ ] [QA-3] DUP-2：兩個含相同單字的 CSV 練習後切換 → 相同單字不重複出現
- [ ] [QA-4] SRS 升降級回歸：答對 3 次升級並更新時間戳；L5 失敗降 L4；L1-L4 失敗等級與時間戳不變
- [ ] [QA-5] 邊界條件：全 L5 無新詞 → 提示完畢不當機；儲存區滿 → 提示不進入練習；POS 不合規 CSV → 警告但仍匯入

## 短期目標 (Short-term Goals)
- (目前階段的核心功能已全數集中於當前任務進行開發)

## 長期願景 (Long-term Vision)
- 開發 L5 自由對話系統：移除所有提示，整合 LLM 驗證使用者輸入，確保目標單字使用合乎邏輯且符合已解鎖之 WALS 規則
- 開發 L5 空間路徑計分演算法：計算對話中所使用單字在地圖上的「可行走相連路徑」(非最短路徑)，依據連線廣度給予對應積分
- 主畫面建設遊戲化：設計地圖格子的特殊放置組合、圖案變化機制，建立純視覺激勵系統
- 擴充預設單字庫內容與詞性多樣性
- 導入完整的跨裝置雲端資料庫架構與離線支援

## 歷史紀錄 (Archive)
- [x] (2026-06-11) [L1-V] L1-V 純視覺閃卡自評題型：`#action-l1v` 面板 + `registerQuestionModule(1,...)` 實作，「認識」/「不認識」雙路徑，無音訊無麥克風
- [x] (2026-06-11) [ARCH-1] 建立 `ARCHITECTURE.md` — 檔案職責、模組呼叫關係、SRS 資料流、Level-Module 現狀表
- [x] (2026-06-11) [ARCH-2] `CLAUDE.md` 步驟 5 加入維護規則：新增模組或搬移功能後同步更新 `ARCHITECTURE.md`
- [x] (2026-06-11) [BUG-4] `js/canvas.js` — 字體縮放改為 while 迴圈（20→8px），lineHeight/totalHeight 在縮放完成後計算
- [x] (2026-06-11) [BUG-5] `js/questions/q-stub.js` — `setTimeout(50)` 改為雙重 requestAnimationFrame，確保 L3 canvas layout 完成後再讀取尺寸
- [x] (2026-06-11) [UX-4] 5 處 countdown 容器加入 `.countdown-label`「自動跳題中...」靜態說明文字
- [x] (2026-06-11) [UX-5] `style.css` — `#storage-area` padding-right 改為 `min(180px, 40%)` 響應式寫法
- [x] (2026-06-11) [UX-6] `index.html` — 打卡連續天數下加 `.checkin-subtitle`「連續天數，中斷後歸零」小字
- [x] (2026-06-11) [UX-7] `js/grammar.js` — `showRuleDetail(rule)` + `#rule-detail-modal` overlay；WALS「查看」按鈕改為彈出詳情卡片（規則說明 + posTypes 標籤）
- [x] (2026-06-11) [BUG-1] `js/practice.js` — 新增 `fisherYatesShuffle()`，修正 `shuffleAndTake()` 與 `generateL1AOptions()` 的 sort 反模式
- [x] (2026-06-11) [BUG-2] `js/practice.js` — `endPractice()` 失敗單字回塞前加重複檢查
- [x] (2026-06-11) [BUG-3] `js/practice.js` — `startAutoAdvance()` 開頭先清除舊計時器
- [x] (2026-06-11) [UX-1] `index.html` — 退出按鈕加 `confirm()` 確認提示
- [x] (2026-06-11) [UX-2] `index.html` — 無障礙停用通知補充完整說明文字
- [x] (2026-06-11) [UX-3] `index.html` — L3-V 輸入框 placeholder 改為完整引導說明
- [x] (2026-06-11) [TEMP-1] 題庫管理區塊加入「載入預設題庫 Lesson1」按鈕，`fetch('./Lesson1.csv')` 讀取後呼叫 `importCSVText()` 匯入，適用 GitHub Pages 環境
- [x] (2026-06-11) [DUP-1/2] 確認並補強單字去重：現有 `existingWords`(storageData+grid) 機制；新增跨單字庫去重，所有已消耗詞（usedIndices 範圍）一律排除
- [x] (2026-06-11) [POS-1] 建立 `POS_SPEC.md` — 定義標籤規範、CSV 格式、Morphological 欄位格式、WALS 對照
- [x] (2026-06-11) [POS-2] 更新 `js/state.js` 的 `getPosColor()` — 依 POS_SPEC 擴充為 9 色對應，改為精確前綴比對取代 `includes()` 模糊比對
- [x] (2026-06-11) [POS-3] 更新 `js/grammar.js` `rulesA1` — 為每條 WALS 規則加入 `posTypes[]`
- [x] (2026-06-11) [POS-4] 重寫 `defaultWords` (state.js) — POS 改用 dot-notation，Morphological 改用 X/Y/Z 格式
- [x] (2026-06-11) [POS-5] 更新 `Lesson1.csv` — 全欄位重新標注 POS（dot-notation）與 Morphological（X/Y/Z）格式，80 個詞條
- [x] (2026-06-11) [POS-6] 更新 `js/datasets.js` CSV 匯入邏輯 — 加入 `isValidPos()` 驗證，POS 不符規範時顯示明確 toast 警告
- [x] (2026-06-11) [SKIP-1~4] 無障礙模式：`practiceAudioDisabled` session 旗標，L1-S/L1-A 標記 `requiresAudio: true`，停用時 dispatcher 自動排除語音題型
- [x] (2026-06-11) 新增 grammar.js checkWalsRule(ruleId, tokens) 函式，支援 WALS 37/38/66/67/81/87/88/89/112/116 規則基礎驗證
- [x] (2026-06-11) 將原 L3 聽寫填空題型移至 L2（與句型重組同級），L3 改為 POS 造句
- [x] (2026-06-11) 實作 L3-V POS 造句題型：輸入框加入任意單字組成句子，實時顯示已解鎖 WALS 規則是否被滿足，Enter 鍵加入單字
- [x] (2026-06-11) 實作 L1-A 聽音選字題型：TTS 朗讀單字，顯示 4 個選項（1 正確 + 3 隨機替換母音/子音的誤導項），使用者選出正確拼寫
- [x] (2026-06-11) 重構題型派發器 (dispatcher.js) 支援同一等級多模組隨機派發
- [x] (2026-06-11) 開發 L3 聽寫填空題型 (拼寫精準度)：TTS 朗讀完整例句，帶空格例句顯示，手寫 Canvas 輔助練習，鍵盤填入目標單字驗證
- [x] (2026-06-11) 加入練習頁面退出按鈕，呼叫 endPractice() 儲存部分結果並返回主畫面
- [x] (2026-06-11) 重構 Canvas 事件監聽邏輯 (區分「點擊空地放置」與「點擊方塊朗讀」)
- [x] (2026-06-11) 建立各 Level 題型派發器 (Question Dispatcher) 核心架構，分離 L1 至 L5 的測驗介面與邏輯
- [x] (2026-06-11) 實作例句動態渲染模組：比對單字庫 (Hash Map)，將題目例句中出現的單字動態套用對應的詞性 (POS) 背景色
- [x] (2026-06-11) 開發 L1 基礎題型 (認知與發音)：顯示單字與例句 (不隱藏拼寫)，TTS 同步朗讀，實作麥克風正確覆誦單字驗證，優化流程（自動推進、失敗路徑分叉、進度圓點）
- [x] (2026-06-11) 開發 L2 句型重組題型 (語感與結構)：TTS 朗讀單字與例句，實作點選詞塊依序排列介面，驗證例句還原正確性
- [x] (2026-06-11) 建立自動化環境配置 (加入 `.prettierrc` 設定檔以統一程式碼風格)
- [x] (2026-06-11) 執行專案檔案拆分與模組化 (將 `index.html` 拆分為 `index.html`, `style.css` 與 `js/` 目錄下的各功能模組)
- [x] (2026-06-11) 擴充存檔資料結構 (加入 `voiceSettings` 以支援各存檔自選語音)
- [x] (2026-06-11) 為多存檔系統實作「自選語音引擎設定」的 UI 介面
- [x] (2026-06-10) 實作多存檔 (Save Slots) 建立、切換與刪除邏輯
- [x] (2026-06-10) 修正單字頁面代幣按鈕的透明與右側截斷問題
- [x] (2026-06-10) 移除 SRS 冷卻天數限制，改為抽取最舊單字