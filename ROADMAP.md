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

### 題型統一造句軸 (Unified Composition Spine)

> L3-V（詞塊自由造句 + WALS 計分）是所有題型的基準軸。上位下位關卡均為其延伸變化，透過「自由度」與「WALS 約束強度」兩個維度控制難易度。

| Level | 題型 ID | 題型名 | 機制 | 自由度 | WALS 介入 | 裝置需求 |
|-------|---------|--------|------|--------|-----------|----------|
| L1 | **L1-A** | 詞塊填空 | TTS 自動播例句，單字隱藏；詞塊池 4 選 1（字母變換干擾詞）；選後送出確認；選錯立即失敗 | 極低 | 無 | 喇叭 |
| L1 | **L1-S** | 唸出單字 | TTS 播放單字，學習者跟讀；SpeechRecognition 比對目標詞 | 極低 | 無 | 喇叭 + 麥克風 |
| L2 | **L2-V** | 詞塊重組 | 打亂例句詞塊，點選還原語序 | 低 | 提示（不計分） | 無 |
| L2 | **L2-A** | 聽後重組 | TTS 播打亂前例句，依記憶從詞塊池重組 | 低 | 提示（不計分） | 喇叭 |
| L2 | **L2-S** | 覆誦整句 | TTS 播例句，學習者跟讀整句；SpeechRecognition 比對目標詞 | 低 | 無 | 喇叭 + 麥克風 |
| L3 | **L3-A** | 聽寫填空 | 例句遮蓋目標詞，手寫/鍵盤輸入拼寫 | 低 | 無 | 無 |
| L3 | **L3-V** | 詞塊造句 | 自由組句，目標詞必現，WALS 計分（+2/+4/+6）| 高 | 計分 | 無 |
| L4 | **L4** | 限制造句 | 自由組句，必須滿足 ≥ ceil(解鎖數/2) 條規則才過關；不達標不扣次數 | 高 | 強制門檻 | 無 |
| L5 | **L5** | 情境造句 | 顯示語境提示句，組句回應；WALS 計分 + 情境詞加成（最高 +3） | 最高 | 計分 + 情境加成 | 無 |

---

## 當前任務 (Current Focus)

### 路線 H：題型模組重建 + 跨題型 UX 一致性

> 掃描結論：L1 合體模組需拆分、L3-A 從未接入 dispatcher、L2-S 尚未實作、各題型 TTS 不一致、L4 無規則死鎖、dev modal 過時。

**目標模組清單（dispatcher 最終狀態）**
- Level 1：L1-A（requiresListening）、L1-S（requiresSpeaking）
- Level 2：L2-V、L2-A（requiresListening）、L2-S（requiresSpeaking）
- Level 3：L3-A、L3-V
- Level 4：L4
- Level 5：L5

**實作子項目**

- [x] (2026-06-12) [H1] `practice.js` + `index.html` + `style.css` — L1-A 重構為獨立模組（`requiresListening: true`）：移除合體兩段式；干擾詞改純字母變換；圓形送出鈕；選錯立即失敗
- [x] (2026-06-12) [H2] `practice.js` + `index.html` — L1-S 新增獨立模組（`requiresSpeaking: true`）：TTS 播單字；SpeechRecognition 比對目標詞
- [x] (2026-06-12) [H3] `q-stub.js` + `index.html` — L2-S 新增模組（`requiresSpeaking: true`）：TTS 播例句；SpeechRecognition 比對目標詞
- [x] (2026-06-12) [H4] `q-stub.js` — L3-A 補模組註冊，接入 dispatcher
- [x] (2026-06-12) [H5] `index.html` — L3-V / L5 補「聽單字」TTS 按鈕
- [x] (2026-06-12) [H6] `q-stub.js` — L4 無規則備援：`unlockedIds.length === 0` 時直接過關
- [x] (2026-06-12) [H7] `index.html` — dev modal 全面更新：9 個題型按正確索引排列
- [ ] [H8] `index.html` — bug 修正：`cancelAutoAdvance()` 缺少 `'l1a-countdown'` 參數

---

### 文章引擎待解問題 (TEXT-6)

- [ ] [TEXT-6-1] 詞形變化比對：文章中的 "running" 無法比對詞庫的 "run"，需定義是否要做詞根還原（stemming），或改以使用者手動確認
- [ ] [TEXT-6-3] 大小寫與專有名詞：人名、地名出現為陌生詞，加入地圖無意義，需設計過濾或忽略機制
- [ ] [TEXT-6-4] 詞庫已有但未練習的詞：目前歸類為「已知」（存在於 datasets），但使用者實際上可能還不熟悉，需重新定義「已知」的標準（已在 storageData/grid vs 僅在 datasets）
- [ ] [TEXT-6-5] 多詞表達：詞庫中的 "good morning" 無法與文章中分開出現的 "good" / "morning" 匹配，需討論是否支援短語比對
- [ ] [TEXT-6-6] 多語言斷句：目前英語縮寫黑名單（Mr、Mrs、Dr 等）為過渡方案，需找多語言通用的句子邊界偵測方案替換

### 規則定義待解 (Rule Ambiguity)

- [ ] [RULE-1] WALS 116（問句 auxiliary 置句首）與 WALS 81（SVO 語序）衝突：問句結構本身不符合 SVO，需明確定義兩者是否互斥，或問句模式下 `checkWalsRule(81)` 應自動豁免
- [ ] [RULE-2] 前置修飾語順序：WALS 87（形容詞）、88（指示詞）、89（數詞）同時存在時，英語慣例為 DEM + NUM + ADJ + N（如 "those two big dogs"），但目前 `checkWalsRule` 僅各自獨立驗證位置，未定義三者共存時的順序規則

### 待辦（低優先）

- [ ] 優化 Web Speech API 語音辨識失敗時的提示與重試體驗
- [ ] 執行 Firebase 登入同步 E2E 流程：登入 → 練習 → 退出 → 換裝置 → 驗證資料還原

### QA 測試清單

- [ ] [QA-1] 無存檔按「載入 Lesson1」→ 提示；有存檔 → 成功；重複載入 → 提示「已載入」
- [ ] [QA-2] 練習中停用聆聽 → L1（詞塊填空音訊版）不再出現；停用說話 → L1-S 覆誦步驟跳過；退出後重進 → 按鈕恢復（待 REDESIGN-1/2 完成後更新此測試）
- [ ] [QA-3] 兩個含相同單字的 CSV 練習後切換 → 相同單字不重複出現
- [ ] [QA-4] SRS 升降級回歸：答對 3 次升級並更新時間戳；L5 失敗降 L4；L1-L4 失敗等級與時間戳不變
- [ ] [QA-5] 邊界條件：全 L5 無新詞 → 提示完畢不當機；儲存區滿 → 提示不進入練習；POS 不合規 CSV → 警告但仍匯入
- [ ] [QA-6] 計分回歸（SCORE-1）：L3-V 滿足 0 條（有解鎖規則）→ 不給計分代幣；滿足 1 條 → +2 代幣；滿足 3 條 → +6 代幣；代幣數字即時更新

---

## 長期願景 (Long-term Vision)

- 詞彙地形：地形高低即等級高低，已由等高線融合繪製實現，L5 群體聚集成山脈，L1 孤格呈低谷；視覺化無需額外美術工作
- 詞彙空間關係：相鄰格子同詞性或語義相關時產生加成效果
- L5 情境造句（REDESIGN-5）：給定語境提示句，以目標詞組句回應，WALS 計分 + 情境加成；純規則驗證，不依賴 LLM
- 空間路徑計分：地圖上相鄰單字的可行路徑廣度決定積分
- 跨裝置雲端同步與離線支援

---

## 歷史紀錄 (Archive)

- [x] (2026-06-12) [路線G] REDESIGN-1~5 + UX-P-7/9/15 + UX-L-1~5：L1 詞塊填空+覆誦二段式、L2-A 聽後重組、L4 限制造句、L5 情境造句全實作；跨題型按鈕視覺統一；進度列圖示化；WALS hints 摺疊；版面一致性修正
- [x] (2026-06-12) [路線E] UX-P-1~5 練習面板整改：不捲動版面、word card row wrapper、per-type 欄位顯隱、L2 POS 色塊、L2-A canvas 放大
- [x] (2026-06-12) [路線F] UX-P-10~14 音訊控制重構：移除 L1-V 閃卡、拆分聆聽/說話停用旗標、移除 L1-A 冗餘按鈕、COMMON_WORD_POS 備援表、HWR 狀態提示
- [x] (2026-06-12) [UX-P-6] Tesseract.js v4 OCR 備援：動態載入、debounce 800ms、黑字白底臨時 canvas 提高辨識率、全程狀態提示
- [x] (2026-06-11) [路線B] SCORE-1~3 文法計分強化：L3-V 即時代幣（satisfiedCount×2）、分層反饋、ruleHitCounts 存檔、規則卡片顯示觸發次數
- [x] (2026-06-11) [路線C] TEXT-1~5 文章輸入引擎：js/passage.js 新模組；設定頁卡片；分析結果；addPassageWordToMap；朗讀模式（逐句TTS + 陌生詞高亮 + 每3句插入統整卡）
- [x] (2026-06-11) [路線D] TEXT-7~8 文章朗讀支線：CSV/TXT 上傳、存檔持久化、#reading-view 全螢幕視圖、主畫面 Reading 按鈕、英語縮寫斷句保護
- [x] (2026-06-11) [TEXT-6-2] 功能詞歸類確認：功能詞由詞庫覆蓋，無需程式碼層停用詞過濾
- [x] (2026-06-11) [TEST] 臨時測試工具：DEV 按鈕 + debug modal + `startDebugPractice(level, moduleIdx)`
- [x] (2026-06-11) [ARCH-1~2] 建立 ARCHITECTURE.md；CLAUDE.md 加入同步維護規則
- [x] (2026-06-11) [BUG-1~5] shuffle 反模式、endPractice 重複檢查、autoAdvance 計時器、canvas 字體 while 縮放、L3 canvas 雙重 rAF
- [x] (2026-06-11) [UX-1~7] 退出確認、無障礙說明、L3-V placeholder、countdown label、storage padding RWD、打卡小字、WALS 詳情 modal
- [x] (2026-06-11) [TEMP-1] 載入預設題庫 Lesson1 按鈕
- [x] (2026-06-11) [DUP-1/2] 跨單字庫去重；[POS-1~6] POS dot-notation + 9 色；[SKIP-1~4] 無障礙 requiresAudio 過濾
- [x] (2026-06-11) 題型架構完整實作：L1-A、L1-S、L2-V、L2-A、L3-V、Dispatcher；checkWalsRule() 10 條規則
- [x] (2026-06-10) 多存檔系統、語音設定、Canvas 事件重構、模組化拆分
