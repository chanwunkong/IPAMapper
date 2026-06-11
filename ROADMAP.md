# 開發進度與目標

> 題型架構、模組呼叫關係、SRS 資料流見 [ARCHITECTURE.md](ARCHITECTURE.md)

---

## 設計方向 (Design Vision)

> 核心主張：成人語言學習靠邏輯建構，不靠語感培養。所有驗證邏輯保持純規則導向，不依賴 LLM。

| 柱子 | 比喻 | 目標 |
|------|------|------|
| 詞彙版圖 | 城市建設 | 每個單字是領土，版圖越大越壯觀，掌握度一眼可見 |
| 文法計分 | 弓箭傳說傷害倍率 | 同時滿足越多已解鎖 WALS 規則，代幣獎勵越高；複雜句子自然值更多 |
| 文章輸入引擎 | 自備內容驅動 | 貼入任意文章，系統比對生字，轉化為練習佇列 |

> 地圖美術（格子視覺升華 L1→L5）列為最後階段，先建立程式邏輯。
> 無預定義「組合技」—— 計分系統自動感知句子複雜度，不需要額外資料結構。

---

## 當前任務 (Current Focus)

### 路線 B：文法計分強化 (Grammar Scoring)

目標：讓 WALS 規則解鎖對練習產生即時、可感知的代幣回饋。同時滿足越多規則 → 代幣越多，鼓勵使用者主動造出更複雜的句子。

- [x] (2026-06-11) [SCORE-1] `js/questions/q-stub.js` — `submitL3V()` 根據 `satisfiedCount` 給即時代幣：每滿足一條規則給 2 代幣（`updateTokens(satisfiedCount * 2)`）；反饋文字分層：0 條=「良好」、1 條=「基礎句型 +2」、2 條=「語法組合 +4」、3 條以上=「完整句型 +N」
- [ ] [SCORE-2] `js/state.js` + `js/storage.js` — 存檔結構加入 `ruleHitCounts: {}` 記錄每條 WALS 規則在練習中被滿足的累計次數；`submitL3V()` 答題通過時更新對應規則計數並存檔
- [ ] [SCORE-3] `js/grammar.js` — WALS 規則卡片（已解鎖狀態）顯示「已觸發 N 次」，讓解鎖規則有可見的使用記錄

### 路線 C：文章輸入引擎 (Passage Import Engine)

目標：使用者貼入任意文章，系統自動比對已知詞彙，將陌生詞加入地圖練習佇列，並能逐句進行 TTS 朗讀練習。

- [ ] [TEXT-1] `index.html` + `style.css` — 設定頁新增「文章輸入」區塊：多行文字貼入框 + 分析按鈕
- [ ] [TEXT-2] `js/passage.js` — 新模組：`parsePassage(text)` 斷詞、去重、正規化（移除標點）；`classifyPassageWords(words)` 比對 storageData + grid + datasets，回傳 `{ known[], unknown[] }`
- [ ] [TEXT-3] `index.html` + `style.css` — 分析結果區：已知詞灰底、陌生詞高亮 + 各別「加入地圖」按鈕；顯示統計（共 N 詞，已知 X，陌生 Y）
- [ ] [TEXT-4] `js/passage.js` — `addPassageWordToMap(word)` 將選取的陌生詞建立基礎詞條（word 填入，其餘空白）加入 `storageData`，觸發 `updateStorageUI()`
- [ ] [TEXT-5] `js/passage.js` + `index.html` — 文章朗讀模式：逐句 TTS 播放、句中標記陌生詞；每隔 3 句自動暫停插入一道陌生詞練習（呼叫 dispatcher）

### 規則定義待解 (Rule Ambiguity)

- [ ] [RULE-1] WALS 116（問句 auxiliary 置句首）與 WALS 81（SVO 語序）衝突：問句結構本身不符合 SVO，需明確定義兩者是否互斥，或問句模式下 `checkWalsRule(81)` 應自動豁免
- [ ] [RULE-2] 前置修飾語順序：WALS 87（形容詞）、88（指示詞）、89（數詞）同時存在時，英語慣例為 DEM + NUM + ADJ + N（如 "those two big dogs"），但目前 `checkWalsRule` 僅各自獨立驗證位置，未定義三者共存時的順序規則

### 待辦（低優先）

- [ ] [L4-1] 開發 L4 自由造句題型：輸入完整句子，以 `buildWordPosMap()` + `checkWalsRule()` 驗證已解鎖規則，計分邏輯與 SCORE-1 相同（`satisfiedCount × 2` 代幣）
- [ ] [L4-2] `js/grammar.js` — WALS 規則解鎖狀態 UI 確認與存檔完全同步
- [ ] 優化 Web Speech API 語音辨識失敗時的提示與重試體驗
- [ ] 執行 Firebase 登入同步 E2E 流程：登入 → 練習 → 退出 → 換裝置 → 驗證資料還原

### QA 測試清單

- [ ] [QA-1] 無存檔按「載入 Lesson1」→ 提示；有存檔 → 成功；重複載入 → 提示「已載入」
- [ ] [QA-2] 練習中啟用無障礙 → L1-S / L1-A 不再出現；退出後重進 → 按鈕恢復
- [ ] [QA-3] 兩個含相同單字的 CSV 練習後切換 → 相同單字不重複出現
- [ ] [QA-4] SRS 升降級回歸：答對 3 次升級並更新時間戳；L5 失敗降 L4；L1-L4 失敗等級與時間戳不變
- [ ] [QA-5] 邊界條件：全 L5 無新詞 → 提示完畢不當機；儲存區滿 → 提示不進入練習；POS 不合規 CSV → 警告但仍匯入
- [ ] [QA-6] 計分回歸（SCORE-1）：L3-V 滿足 0 條（有解鎖規則）→ 不給計分代幣；滿足 1 條 → +2 代幣；滿足 3 條 → +6 代幣；代幣數字即時更新

---

## 長期願景 (Long-term Vision)

- 地圖格子視覺升華：L1 = 荒地、L5 = 首都，使用者一眼看出帝國規模（最後處理）
- 詞彙空間關係：相鄰格子同詞性或語義相關時產生加成效果
- L5 口語對話：純規則驗證（WALS 規則計分 + 造句結構檢測），不依賴 LLM
- 空間路徑計分：地圖上相鄰單字的可行路徑廣度決定積分
- 跨裝置雲端同步與離線支援

---

## 歷史紀錄 (Archive)

- [x] (2026-06-11) [SCORE-1] `submitL3V()` 即時代幣計分：satisfiedCount × 2，反饋文字分四層（良好 / 基礎句型 / 語法組合 / 完整句型）
- [x] (2026-06-11) [TEST] 臨時測試工具：DEV 按鈕 + debug modal + `startDebugPractice(level, moduleIdx)` 直接進入任意題型
- [x] (2026-06-11) [L1-V] L1-V 純視覺閃卡自評題型：`#action-l1v` 面板 + `registerQuestionModule(1,...)` 實作，「認識」/「不認識」雙路徑，無音訊無麥克風
- [x] (2026-06-11) [ARCH-1] 建立 `ARCHITECTURE.md` — 檔案職責、模組呼叫關係、SRS 資料流、Level-Module 現狀表
- [x] (2026-06-11) [ARCH-2] `CLAUDE.md` 步驟 5 加入維護規則：新增模組或搬移功能後同步更新 `ARCHITECTURE.md`
- [x] (2026-06-11) [BUG-4] `js/canvas.js` — 字體縮放改為 while 迴圈（20→8px），lineHeight/totalHeight 在縮放完成後計算
- [x] (2026-06-11) [BUG-5] `js/questions/q-stub.js` — `setTimeout(50)` 改為雙重 requestAnimationFrame，確保 L3 canvas layout 完成後再讀取尺寸
- [x] (2026-06-11) [UX-4] 5 處 countdown 容器加入 `.countdown-label`「自動跳題中...」靜態說明文字
- [x] (2026-06-11) [UX-5] `style.css` — `#storage-area` padding-right 改為 `min(180px, 40%)` 響應式寫法
- [x] (2026-06-11) [UX-6] `index.html` — 打卡連續天數下加 `.checkin-subtitle`「連續天數，中斷後歸零」小字
- [x] (2026-06-11) [UX-7] `js/grammar.js` — `showRuleDetail(rule)` + `#rule-detail-modal` overlay；WALS「查看」按鈕改為彈出詳情卡片
- [x] (2026-06-11) [BUG-1] `js/practice.js` — 新增 `fisherYatesShuffle()`，修正 shuffle 反模式
- [x] (2026-06-11) [BUG-2] `js/practice.js` — `endPractice()` 失敗單字回塞前加重複檢查
- [x] (2026-06-11) [BUG-3] `js/practice.js` — `startAutoAdvance()` 開頭先清除舊計時器
- [x] (2026-06-11) [UX-1~3] 退出確認、無障礙說明文字、L3-V placeholder 優化
- [x] (2026-06-11) [TEMP-1] 載入預設題庫 Lesson1 按鈕
- [x] (2026-06-11) [DUP-1/2] 跨單字庫去重機制
- [x] (2026-06-11) [POS-1~6] POS dot-notation 規範、9 色對應、WALS posTypes、defaultWords/Lesson1.csv/CSV 匯入全面更新
- [x] (2026-06-11) [SKIP-1~4] 無障礙模式 practiceAudioDisabled 旗標與 requiresAudio 過濾
- [x] (2026-06-11) 題型架構完整實作：L1-S、L1-A、L2-V、L2-A、L3-V、Dispatcher 多模組隨機派發
- [x] (2026-06-11) `checkWalsRule()` 支援 10 條 WALS 規則驗證
- [x] (2026-06-10) 多存檔系統、語音設定、Canvas 事件重構、模組化拆分
