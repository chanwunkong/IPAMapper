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

### 路線 E：題型面板整改 (Practice UX)

- [x] (2026-06-12) [UX-P-1] `style.css` + `index.html` — 練習面板版面：`#practice-modal` 改 `overflow:hidden`；word card 壓縮；action area 設 `flex:1; overflow-y:auto; min-height:0` — 全畫面不捲動
- [x] (2026-06-12) [UX-P-2] `index.html` — word card info-section 各欄位加上 row wrapper（`p-sentence-row`、`p-etymology-row`），便於各題型按需隱藏
- [x] (2026-06-12) [UX-P-3] `js/practice.js` — `resetWordCardFields()` 在 `renderPracticeWord()` 前呼叫重設所有欄位可見性；L1-A/L1-S activate 隱藏 `p-sentence-row`、`p-etymology-row`；L1-V activate 額外隱藏 `audio-disable-bar`
- [x] (2026-06-12) [UX-P-4] `js/questions/q-stub.js` — L1-V 隱藏 `p-etymology-row`、`audio-disable-bar`；L2-V/L2-A activate 隱藏 `p-sentence-row`（例句即題目，不可顯示）+ `p-etymology-row`；L2-V `renderL2Pool/Answer` 依 POS 套用底色（`buildWordPosMap` + `getPosColor`）
- [x] (2026-06-12) [UX-P-5] `js/questions/q-stub.js` — L2-A canvas：移除目標單字水印；高度 110→180px；加入 Handwriting Recognition API（`navigator.createHandwritingRecognizer`），筆畫結束後辨識自動填入 input；不支援環境靜默降級

### 路線 F：題型音訊控制重構

- [x] (2026-06-12) [UX-P-10] `index.html` + `js/questions/q-stub.js` — 移除 L1-V 閃卡自評模組（題型過於被動，無助語形記憶）
- [x] (2026-06-12) [UX-P-11] `index.html` + `js/practice.js` + `js/dispatcher.js` — 拆分音訊停用：`practiceListeningDisabled` / `practiceSpeakingDisabled`；「無法聆聽」只在 L1-A/L1-S 顯示；「無法說話」只在 L1-S 顯示；dispatcher 改用 `requiresListening` / `requiresSpeaking` 旗標過濾

- [x] (2026-06-12) [UX-P-12] `index.html` — 移除 L1-A 中的「再聽單字/再聽例句」手動重播按鈕（activate() 已自動播放，按鈕為冗餘殘留）
- [x] (2026-06-12) [UX-P-13] `js/questions/q-stub.js` — 新增 `COMMON_WORD_POS` 備援表（冠詞、介系詞、代名詞、助動詞等 ~60 詞）；L2-V/L2-A `renderL2Pool/Answer` 改用 `wordMap.get() || COMMON_WORD_POS[] || ''`，修正功能詞無色塊問題
- [x] (2026-06-12) [UX-P-14] `js/questions/q-stub.js` — `initHWR()` 依 API 可用性更新 `#l3-hwr-status`：不支援時顯示「此瀏覽器不支援手寫辨識，請直接使用鍵盤輸入」；支援時顯示「手寫辨識已啟用」；初始化失敗顯示錯誤提示

### 題型待改進（掃描記錄）

- [x] (2026-06-12) [UX-P-6] `js/questions/q-stub.js` — Tesseract.js v4 OCR 備援：`initHWR()` 在原生 HWR API 不可用時動態載入 Tesseract（unpkg CDN）、建立持久 worker；stroke 結束後 debounce 800ms 觸發 `runTesseractOCR()`；辨識時以黑字白底臨時 canvas 提高準確率；`#l3-hwr-status` 全程顯示載入/辨識/錯誤狀態
- [ ] [UX-P-7] L3-V：WALS hints 區塊 + input row 在小螢幕可能仍超出一屏；考慮 hints 改為可折疊
- [ ] [UX-P-8] L1-A 選項按鈕：選項字型偏小、按鈕尺寸偏窄，觸控易誤按；建議放大至最小 44px 觸控目標
- [ ] [UX-P-9] 練習進度列（`practice-progress`）目前顯示「目標進度: N/3 | 剩餘機會: N」，措辭對非熟悉 SRS 的使用者不直觀；考慮改為圖示化（進度圓點 + 心形機會）



### 路線 B：文法計分強化 (Grammar Scoring)

目標：讓 WALS 規則解鎖對練習產生即時、可感知的代幣回饋。同時滿足越多規則 → 代幣越多，鼓勵使用者主動造出更複雜的句子。

- [x] (2026-06-11) [SCORE-1] `js/questions/q-stub.js` — `submitL3V()` 根據 `satisfiedCount` 給即時代幣：每滿足一條規則給 2 代幣（`updateTokens(satisfiedCount * 2)`）；反饋文字分層：0 條=「良好」、1 條=「基礎句型 +2」、2 條=「語法組合 +4」、3 條以上=「完整句型 +N」
- [x] (2026-06-11) [SCORE-2] `js/state.js` + `js/storage.js` + `js/saves.js` — 存檔結構加入 `ruleHitCounts: {}`；`submitL3V()` 成功時逐一更新滿足規則的計數
- [x] (2026-06-11) [SCORE-3] `js/grammar.js` + `style.css` — WALS 規則卡片（已解鎖）顯示「已觸發 N 次」小字，accent 色

### 路線 C：文章輸入引擎 (Passage Import Engine)

目標：使用者貼入任意文章，系統自動比對已知詞彙，將陌生詞加入地圖練習佇列，並能逐句進行 TTS 朗讀練習。

- [x] (2026-06-11) [TEXT-1] `index.html` + `style.css` — 設定頁「文章輸入」卡片：textarea + 分析按鈕 + 結果區
- [x] (2026-06-11) [TEXT-2] `js/passage.js` — `parsePassage()` 斷詞去重；`classifyPassageWords()` 比對 storageData / grid / datasets
- [x] (2026-06-11) [TEXT-3] `index.html` + `style.css` — 分析結果：已知詞灰底、陌生詞橙色 + 各別「+」加入按鈕；統計文字
- [x] (2026-06-11) [TEXT-4] `js/passage.js` — `addPassageWordToMap()` 建立基礎詞條加入 storageData，加入後自動從 passageUnknownSet 移除
- [x] (2026-06-11) [TEXT-5] `js/passage.js` + `index.html` — 朗讀模式：逐句 TTS + 陌生詞黃底高亮；每 3 句含陌生詞後插入「遇到的陌生詞」統整卡，繼續按鈕恢復朗讀

### 路線 D：文章朗讀支線 (Passage Reading Side Quest)

- [x] (2026-06-11) [TEXT-7] `index.html` + `js/passage.js` — 文章輸入卡片加入上傳按鈕（接受 `.txt` / `.csv`）；CSV 格式為完整故事文本（每列一句或一段）；`loadPassageFile(file)` 解析後合併為段落，自動填入 textarea 並呼叫 `analyzePassage()`
- [x] (2026-06-11) [TEXT-8] 文章朗讀 UX 全面重設計：
  - `js/state.js` + `js/storage.js` + `js/saves.js` — 存檔加入 `passageText: ''`，隨存檔持久化
  - `index.html` — 設定頁文章卡片只保留 textarea + 上傳 + 「儲存文章」按鈕；移除 `#passage-result`、`#passage-stats`、已知詞/陌生詞 chip 區；移除 `#reading-modal`；加入 `#reading-view`（`.view` 全螢幕）作為支線主視圖
  - `index.html` + `style.css` — 主畫面 Play 旁加 Reading 按鈕，點擊切換至 `#reading-view`（地圖暫隱）
  - `js/passage.js` — `savePassage()` 儲存文章並靜默分析；`startReadingMode()` 惰性解析並切換視圖；朗讀邏輯改操作 `#reading-view` 內元素
  - 斷句修正（英語過渡方案）：縮寫黑名單（Mr、Mrs、Dr、Prof 等）保護縮寫後的句點不被誤切；TODO: 未來需找多語言通用的句子邊界偵測方案替換此硬編碼清單

### 文章引擎待解問題 (TEXT-6)

- [ ] [TEXT-6-1] 詞形變化比對：文章中的 "running" 無法比對詞庫的 "run"，需定義是否要做詞根還原（stemming），或改以使用者手動確認
- [x] (2026-06-11) [TEXT-6-2] 功能詞（冠詞、指示詞、介系詞）屬詞彙學習範疇，本應涵蓋在基礎詞庫中；使用者載入詞庫後自動歸類為「已知」，無需程式碼層的停用詞過濾。待辦轉為詞庫內容：確認 Lesson1.csv 完整收錄 A1 級冠詞、指示詞、介系詞
- [ ] [TEXT-6-3] 大小寫與專有名詞：人名、地名出現為陌生詞，加入地圖無意義，需設計過濾或忽略機制
- [ ] [TEXT-6-4] 詞庫已有但未練習的詞：目前歸類為「已知」（存在於 datasets），但使用者實際上可能還不熟悉，需重新定義「已知」的標準（已在 storageData/grid vs 僅在 datasets）
- [ ] [TEXT-6-5] 多詞表達：詞庫中的 "good morning" 無法與文章中分開出現的 "good" / "morning" 匹配，需討論是否支援短語比對

### 規則定義待解 (Rule Ambiguity)

- [ ] [RULE-1] WALS 116（問句 auxiliary 置句首）與 WALS 81（SVO 語序）衝突：問句結構本身不符合 SVO，需明確定義兩者是否互斥，或問句模式下 `checkWalsRule(81)` 應自動豁免
- [ ] [RULE-2] 前置修飾語順序：WALS 87（形容詞）、88（指示詞）、89（數詞）同時存在時，英語慣例為 DEM + NUM + ADJ + N（如 "those two big dogs"），但目前 `checkWalsRule` 僅各自獨立驗證位置，未定義三者共存時的順序規則

### 待辦（低優先）

- [ ] [L4] 開發 L4 自由造句題型：使用者輸入完整句子，以 `buildWordPosMap()` + `checkWalsRule()` 驗證，計分直接呼叫 `updateTokens(satisfiedCount * 2)`（共用現有 API，無需另行定義）
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

- [x] (2026-06-11) [TEXT-1~5] 文章輸入引擎：js/passage.js 新模組；設定頁卡片；分析結果顯示；addPassageWordToMap；朗讀模式（逐句TTS + 陌生詞高亮 + 每3句插入統整卡）
- [x] (2026-06-11) [SCORE-1~3] 文法計分強化：L3-V 即時代幣（satisfiedCount×2）、分層反饋、ruleHitCounts 存檔、規則卡片顯示觸發次數
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
