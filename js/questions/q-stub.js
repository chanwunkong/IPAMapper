// 常見英文單字的 POS 備援表（buildWordPosMap 不涵蓋未收錄的功能詞）
const COMMON_WORD_POS = {
    // 冠詞
    the:'DT', a:'DT', an:'DT',
    // 介系詞
    in:'IN', on:'IN', at:'IN', of:'IN', to:'IN', for:'IN', with:'IN',
    from:'IN', by:'IN', about:'IN', into:'IN', through:'IN', over:'IN',
    under:'IN', between:'IN', after:'IN', before:'IN', during:'IN',
    without:'IN', within:'IN', along:'IN', around:'IN', among:'IN',
    // 代名詞
    i:'PRP', you:'PRP', he:'PRP', she:'PRP', it:'PRP', we:'PRP', they:'PRP',
    me:'PRP', him:'PRP', her:'PRP', us:'PRP', them:'PRP',
    my:'PRP$', your:'PRP$', his:'PRP$', its:'PRP$', our:'PRP$', their:'PRP$',
    this:'DT', that:'DT', these:'DT', those:'DT',
    // 連接詞
    and:'CC', or:'CC', but:'CC', nor:'CC', so:'CC', yet:'CC',
    // 助動詞/be 動詞
    is:'VBZ', are:'VBP', was:'VBD', were:'VBD', be:'VB', been:'VBN',
    being:'VBG', am:'VBP',
    can:'MD', could:'MD', will:'MD', would:'MD', shall:'MD', should:'MD',
    may:'MD', might:'MD', must:'MD', do:'VB', does:'VBZ', did:'VBD',
    have:'VB', has:'VBZ', had:'VBD', having:'VBG',
    // 常見副詞
    not:'RB', also:'RB', just:'RB', very:'RB', too:'RB', more:'RBR',
    most:'RBS', then:'RB', now:'RB', here:'RB', there:'RB', when:'WRB',
    where:'WRB', how:'WRB', why:'WRB',
    // 疑問詞 / 關係詞
    who:'WP', what:'WP', which:'WDT', whom:'WP',
    // 數字詞
    one:'CD', two:'CD', three:'CD', first:'JJ', second:'JJ',
};

// L2-V: 句型重組 — 點選詞塊依序還原例句
let l2OriginalTokens = [];
let l2AnswerTokens = [];
let l2PoolTokens = [];

registerQuestionModule(2, {
    activate(wordData) {
        document.getElementById('p-sentence-row').style.display = 'none';
        document.getElementById('p-etymology-row').style.display = 'none';
        showAudioButtons(false, false);
        document.getElementById('p-word').style.visibility = 'hidden';
        document.getElementById('action-l2').style.display = 'flex';
        document.getElementById('next-word-btn').style.display = 'none';
        document.getElementById('l2-feedback').textContent = '';
        document.getElementById('l2-feedback').className = '';
        document.getElementById('l2-actions').style.display = 'flex';
        document.getElementById('l2-countdown').style.display = 'none';
        updateProgressDots('l2-dots', wordData.successes || 0);

        l2OriginalTokens = (wordData.sentence || '').split(/\s+/).filter(t => t);
        l2AnswerTokens = [];
        l2PoolTokens = [...l2OriginalTokens].sort(() => 0.5 - Math.random());
        while (l2PoolTokens.length > 1 && l2PoolTokens.join(' ') === l2OriginalTokens.join(' ')) {
            l2PoolTokens.sort(() => 0.5 - Math.random());
        }

        renderL2Pool();
        renderL2Answer();
        speakSequence([wordData.word, wordData.sentence]);
    },
    deactivate() {
        cancelAutoAdvance('l2-countdown');
        document.getElementById('p-word').style.visibility = 'visible';
        document.getElementById('action-l2').style.display = 'none';
    }
});

function renderL2Pool() {
    const pool = document.getElementById('l2-word-pool');
    pool.innerHTML = '';
    const wordMap = buildWordPosMap();
    l2PoolTokens.forEach((token, i) => {
        const btn = document.createElement('button');
        btn.className = 'l2-word-chip';
        btn.textContent = token;
        const clean = token.toLowerCase().replace(/[^a-z]/g, '');
        const pos = wordMap.get(clean) || COMMON_WORD_POS[clean] || '';
        if (pos) btn.style.backgroundColor = getPosColor(pos);
        btn.onclick = () => l2PoolToAnswer(i);
        pool.appendChild(btn);
    });
}

function renderL2Answer() {
    const area = document.getElementById('l2-answer-area');
    area.innerHTML = '';
    area.style.borderStyle = l2AnswerTokens.length > 0 ? 'solid' : 'dashed';
    const wordMap = buildWordPosMap();
    l2AnswerTokens.forEach((token, i) => {
        const btn = document.createElement('button');
        btn.className = 'l2-word-chip placed';
        btn.textContent = token;
        const clean = token.toLowerCase().replace(/[^a-z]/g, '');
        const pos = wordMap.get(clean) || COMMON_WORD_POS[clean] || '';
        if (pos) btn.style.backgroundColor = getPosColor(pos);
        btn.onclick = () => l2AnswerToPool(i);
        area.appendChild(btn);
    });
}

function l2PoolToAnswer(poolIndex) {
    const token = l2PoolTokens.splice(poolIndex, 1)[0];
    l2AnswerTokens.push(token);
    renderL2Pool();
    renderL2Answer();
}

function l2AnswerToPool(answerIndex) {
    const token = l2AnswerTokens.splice(answerIndex, 1)[0];
    l2PoolTokens.push(token);
    renderL2Pool();
    renderL2Answer();
}

function submitL2() {
    if (l2AnswerTokens.length < l2OriginalTokens.length) {
        const fb = document.getElementById('l2-feedback');
        fb.textContent = '請排入所有單字';
        fb.className = 'feedback-wrong';
        return;
    }
    currentWordData.attempts++;
    const fb = document.getElementById('l2-feedback');
    if (l2AnswerTokens.join(' ') === l2OriginalTokens.join(' ')) {
        currentWordData.successes++;
        updateProgressDots('l2-dots', currentWordData.successes);
        fb.textContent = '正確！';
        fb.className = 'feedback-correct';
        document.getElementById('l2-actions').style.display = 'none';
        startAutoAdvance('l2-countdown');
    } else {
        fb.textContent = '順序不對，再試看看';
        fb.className = 'feedback-wrong';
        if (currentWordData.attempts >= 5) {
            document.getElementById('l2-actions').style.display = 'none';
            startAutoAdvance('l2-countdown');
        }
    }
    document.getElementById('practice-progress').textContent = `目標進度: ${currentWordData.successes}/3 | 剩餘機會: ${5 - currentWordData.attempts}`;
}

// === L2-A: 聽寫填空 + 手寫辨識 ===
const L3_DPR = window.devicePixelRatio || 1;
let l3Canvas = null, l3Ctx = null;
let l3Strokes = [], l3IsDrawing = false, l3CurrentStroke = null;
let l3Recognizer = null;
let l3Drawing = null;
let l3TesseractWorker = null;
let l3OcrDebounceTimer = null;
let l3OcrRunning = false;

// 初始化手寫辨識：優先 Chrome HWR API（Chrome 99-127），不支援時以 Tesseract.js OCR 備援
(async function initHWR() {
    const getStatus = () => document.getElementById('l3-hwr-status');

    if ('createHandwritingRecognizer' in navigator) {
        try {
            l3Recognizer = await navigator.createHandwritingRecognizer({ languages: ['en'] });
            const el = getStatus();
            if (el) el.textContent = '手寫辨識已啟用';
            return;
        } catch(e) {}
    }

    // Tesseract.js OCR fallback — 動態載入，避免增加初始頁面體積
    const el = getStatus();
    if (el) el.textContent = 'OCR 載入中...';
    try {
        await new Promise((resolve, reject) => {
            if (window.Tesseract) { resolve(); return; }
            const s = document.createElement('script');
            s.src = 'https://unpkg.com/tesseract.js@4/dist/tesseract.min.js';
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
        l3TesseractWorker = await Tesseract.createWorker('eng', 1, {
            logger: m => {
                if (m.status === 'loading tesseract core' || m.status === 'initializing tesseract') {
                    const s = getStatus();
                    if (s) s.textContent = `OCR 載入中 ${Math.round((m.progress || 0) * 100)}%`;
                }
            }
        });
        const el2 = getStatus();
        if (el2) el2.textContent = 'OCR 手寫辨識已就緒（停筆後自動辨識）';
    } catch(e) {
        const el2 = getStatus();
        if (el2) el2.textContent = '手寫辨識不可用，請直接使用鍵盤輸入';
    }
})();

function initL3Canvas() {
    l3Canvas = document.getElementById('l3-canvas');
    if (!l3Canvas || l3Canvas._l3init) return;
    l3Canvas._l3init = true;
    l3Ctx = l3Canvas.getContext('2d');

    l3Canvas.addEventListener('pointerdown', e => {
        l3Canvas.setPointerCapture(e.pointerId);
        l3IsDrawing = true;
        const r = l3Canvas.getBoundingClientRect();
        l3CurrentStroke = [{ x: e.clientX - r.left, y: e.clientY - r.top, t: e.timeStamp }];
    });
    l3Canvas.addEventListener('pointermove', e => {
        if (!l3IsDrawing) return;
        const r = l3Canvas.getBoundingClientRect();
        l3CurrentStroke.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: e.timeStamp });
        redrawL3Canvas();
    });

    function endL3() {
        if (l3IsDrawing && l3CurrentStroke && l3CurrentStroke.length) {
            l3Strokes.push(l3CurrentStroke);
            if (l3Drawing) {
                try {
                    const stroke = new HandwritingStroke();
                    l3CurrentStroke.forEach(pt => stroke.addPoint({ x: pt.x, y: pt.y, t: pt.t }));
                    l3Drawing.addStroke(stroke);
                    l3Drawing.getPrediction().then(preds => {
                        if (preds && preds.length > 0 && preds[0].text) {
                            document.getElementById('l3-input').value = preds[0].text;
                        }
                    }).catch(() => {});
                } catch(e) {}
            }
            if (l3TesseractWorker) {
                clearTimeout(l3OcrDebounceTimer);
                l3OcrDebounceTimer = setTimeout(runTesseractOCR, 800);
            }
            l3CurrentStroke = null;
            redrawL3Canvas();
        }
        l3IsDrawing = false;
    }
    l3Canvas.addEventListener('pointerup', endL3);
    l3Canvas.addEventListener('pointercancel', endL3);
    l3Canvas.addEventListener('pointerleave', endL3);
}

function resizeL3Canvas() {
    if (!l3Canvas || !l3Ctx) return;
    const rect = l3Canvas.getBoundingClientRect();
    if (!rect.width) return;
    l3Canvas.width = rect.width * L3_DPR;
    l3Canvas.height = rect.height * L3_DPR;
    l3Ctx.setTransform(L3_DPR, 0, 0, L3_DPR, 0, 0);
    redrawL3Canvas();
}

function redrawL3Canvas() {
    if (!l3Ctx || !l3Canvas) return;
    const w = l3Canvas.width / L3_DPR;
    const h = l3Canvas.height / L3_DPR;
    l3Ctx.clearRect(0, 0, w, h);

    l3Ctx.save();
    l3Ctx.strokeStyle = '#007aff';
    l3Ctx.lineWidth = 3;
    l3Ctx.lineJoin = 'round';
    l3Ctx.lineCap = 'round';
    const drawS = s => {
        if (!s || s.length < 2) return;
        l3Ctx.beginPath();
        l3Ctx.moveTo(s[0].x, s[0].y);
        for (let i = 1; i < s.length; i++) l3Ctx.lineTo(s[i].x, s[i].y);
        l3Ctx.stroke();
    };
    l3Strokes.forEach(drawS);
    if (l3CurrentStroke) drawS(l3CurrentStroke);
    l3Ctx.restore();
}

function clearL3Canvas() {
    clearTimeout(l3OcrDebounceTimer);
    l3OcrDebounceTimer = null;
    l3Strokes = [];
    l3CurrentStroke = null;
    if (l3Drawing) {
        try { if (typeof l3Drawing.clear === 'function') l3Drawing.clear(); } catch(e) {}
        if (l3Recognizer) {
            try { l3Drawing = l3Recognizer.startDrawing({ hints: { recognitionType: 'text' } }); } catch(e) {}
        }
    }
    document.getElementById('l3-input').value = '';
    redrawL3Canvas();
}

async function runTesseractOCR() {
    if (!l3TesseractWorker || !l3Canvas || !l3Strokes.length || l3OcrRunning) return;
    l3OcrRunning = true;
    const statusEl = document.getElementById('l3-hwr-status');
    if (statusEl) statusEl.textContent = '辨識中...';
    // 建立黑字白底臨時 canvas，提高 OCR 辨識率
    const tmp = document.createElement('canvas');
    tmp.width = l3Canvas.width;
    tmp.height = l3Canvas.height;
    const ctx = tmp.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tmp.width, tmp.height);
    ctx.save();
    ctx.scale(L3_DPR, L3_DPR);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    l3Strokes.forEach(s => {
        if (!s || s.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(s[0].x, s[0].y);
        for (let i = 1; i < s.length; i++) ctx.lineTo(s[i].x, s[i].y);
        ctx.stroke();
    });
    ctx.restore();
    try {
        const { data: { text } } = await l3TesseractWorker.recognize(tmp);
        const cleaned = text.trim().replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ');
        if (cleaned) document.getElementById('l3-input').value = cleaned;
        if (statusEl) statusEl.textContent = 'OCR 手寫辨識已就緒（停筆後自動辨識）';
    } catch(e) {
        if (statusEl) statusEl.textContent = 'OCR 辨識失敗，請使用鍵盤輸入';
    }
    l3OcrRunning = false;
}

registerQuestionModule(2, {
    activate(wordData) {
        document.getElementById('p-sentence-row').style.display = 'none';
        document.getElementById('p-etymology-row').style.display = 'none';
        showAudioButtons(false, false);
        document.getElementById('p-word').style.visibility = 'hidden';
        document.getElementById('action-l3').style.display = 'flex';
        document.getElementById('next-word-btn').style.display = 'none';
        document.getElementById('l3-input').value = '';
        document.getElementById('l3-feedback').textContent = '';
        document.getElementById('l3-feedback').className = '';
        document.getElementById('l3-actions').style.display = 'flex';
        document.getElementById('l3-countdown').style.display = 'none';
        updateProgressDots('l3-dots', wordData.successes || 0);

        const sentence = escapeHtml(wordData.sentence || '');
        const escapedWord = wordData.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const gapHtml = sentence.replace(
            new RegExp(`(?<![\\w])${escapedWord}(?![\\w])`, 'gi'),
            '<span class="l3-blank">___</span>'
        );
        document.getElementById('l3-gap-sentence').innerHTML = gapHtml || sentence;

        l3Strokes = [];
        l3CurrentStroke = null;
        if (l3Recognizer) {
            try { l3Drawing = l3Recognizer.startDrawing({ hints: { recognitionType: 'text' } }); } catch(e) {}
        }
        initL3Canvas();
        requestAnimationFrame(() => requestAnimationFrame(resizeL3Canvas));

        speakText(wordData.sentence);
    },
    deactivate() {
        cancelAutoAdvance('l3-countdown');
        document.getElementById('p-word').style.visibility = 'visible';
        document.getElementById('action-l3').style.display = 'none';
    }
});

function submitL3() {
    const input = document.getElementById('l3-input');
    const typed = input.value.trim().toLowerCase().replace(/[^\w]/g, '');
    const target = currentWordData.word.toLowerCase().replace(/[^\w]/g, '');
    if (!typed) return;
    currentWordData.attempts++;
    const fb = document.getElementById('l3-feedback');
    if (typed === target) {
        currentWordData.successes++;
        updateProgressDots('l3-dots', currentWordData.successes);
        fb.textContent = '正確！';
        fb.className = 'feedback-correct';
        document.getElementById('l3-actions').style.display = 'none';
        startAutoAdvance('l3-countdown');
    } else {
        fb.textContent = `錯誤，正確拼寫：${currentWordData.word}`;
        fb.className = 'feedback-wrong';
        input.value = '';
        if (currentWordData.attempts >= 5) {
            document.getElementById('l3-actions').style.display = 'none';
            startAutoAdvance('l3-countdown');
        }
    }
    document.getElementById('practice-progress').textContent = `目標進度: ${currentWordData.successes}/3 | 剩餘機會: ${5 - currentWordData.attempts}`;
}

// === L3-V: POS 造句 ===
let l3vTokens = [];

registerQuestionModule(3, {
    activate(wordData) {
        showAudioButtons(false, false);
        document.getElementById('p-word').style.visibility = 'visible';
        document.getElementById('action-l3v').style.display = 'flex';
        document.getElementById('next-word-btn').style.display = 'none';
        document.getElementById('l3v-feedback').textContent = '';
        document.getElementById('l3v-feedback').className = '';
        document.getElementById('l3v-actions').style.display = 'flex';
        document.getElementById('l3v-countdown').style.display = 'none';
        document.getElementById('l3v-input').value = '';
        l3vTokens = [];
        updateProgressDots('l3v-dots', wordData.successes || 0);
        renderL3VSentence();
        updateL3VWalsHints();
        speakText(wordData.word);
    },
    deactivate() {
        cancelAutoAdvance('l3v-countdown');
        document.getElementById('p-word').style.visibility = 'visible';
        document.getElementById('action-l3v').style.display = 'none';
    }
});

function l3vAddWord() {
    const input = document.getElementById('l3v-input');
    const raw = input.value.trim();
    if (!raw) return;
    const wordMap = buildWordPosMap();
    const pos = wordMap.get(raw.toLowerCase()) || '';
    const morph = (() => {
        for (const ds of datasets) {
            const w = ds.words.find(w => w.word.toLowerCase() === raw.toLowerCase());
            if (w) return w.morphological || '';
        }
        for (const item of storageData) {
            if (item.word.toLowerCase() === raw.toLowerCase()) return item.morphological || '';
        }
        for (const [, item] of grid.entries()) {
            if (item.word.toLowerCase() === raw.toLowerCase()) return item.morphological || '';
        }
        return '';
    })();
    l3vTokens.push({ word: raw, pos, morphological: morph });
    input.value = '';
    renderL3VSentence();
    updateL3VWalsHints();
    input.focus();
}

function l3vRemoveWord(idx) {
    l3vTokens.splice(idx, 1);
    renderL3VSentence();
    updateL3VWalsHints();
}

function renderL3VSentence() {
    const area = document.getElementById('l3v-sentence');
    if (!area) return;
    if (!l3vTokens.length) {
        area.innerHTML = '<span style="color:#c7c7cc; font-size:14px;">點擊「加入」放入單字...</span>';
        return;
    }
    area.innerHTML = '';
    l3vTokens.forEach((t, i) => {
        const chip = document.createElement('span');
        chip.className = 'l3v-word-chip';
        chip.textContent = t.word + ' ×';
        chip.style.backgroundColor = t.pos ? getPosColor(t.pos) : '#e5e5ea';
        chip.onclick = () => l3vRemoveWord(i);
        area.appendChild(chip);
    });
}

function updateL3VWalsHints() {
    const container = document.getElementById('l3v-wals-hints');
    if (!container) return;
    const unlocked = rulesA1.filter(r => isRuleUnlocked(r.id));
    if (!unlocked.length) {
        container.innerHTML = '<span style="color:#c7c7cc; font-size:13px;">解鎖 WALS 規則後，此處將顯示語法提示。</span>';
        return;
    }
    container.innerHTML = unlocked.map(rule => {
        const ok = l3vTokens.length > 0 && checkWalsRule(rule.id, l3vTokens);
        return `<div class="l3v-hint-item ${ok ? 'l3v-hint-satisfied' : 'l3v-hint-unsatisfied'}">${ok ? '✓' : '○'} WALS ${rule.id} ${rule.name}</div>`;
    }).join('');
}

function submitL3V() {
    if (!l3vTokens.length) {
        const fb = document.getElementById('l3v-feedback');
        fb.textContent = '請先加入單字';
        fb.className = 'feedback-wrong';
        return;
    }
    const targetLower = currentWordData.word.toLowerCase();
    if (!l3vTokens.some(t => t.word.toLowerCase() === targetLower)) {
        const fb = document.getElementById('l3v-feedback');
        fb.textContent = `句子必須包含目標單字：${currentWordData.word}`;
        fb.className = 'feedback-wrong';
        return;
    }
    if (l3vTokens.length < 2) {
        const fb = document.getElementById('l3v-feedback');
        fb.textContent = '請至少加入 2 個單字';
        fb.className = 'feedback-wrong';
        return;
    }
    currentWordData.attempts++;
    const fb = document.getElementById('l3v-feedback');
    const unlockedIds = rulesA1.filter(r => isRuleUnlocked(r.id)).map(r => r.id);
    const satisfiedIds = unlockedIds.filter(id => checkWalsRule(id, l3vTokens));
    const satisfiedCount = satisfiedIds.length;
    if (satisfiedCount > 0 || unlockedIds.length === 0) {
        currentWordData.successes++;
        updateProgressDots('l3v-dots', currentWordData.successes);
        satisfiedIds.forEach(id => { ruleHitCounts[id] = (ruleHitCounts[id] || 0) + 1; });
        if (satisfiedCount >= 3) {
            const bonus = satisfiedCount * 2;
            fb.textContent = `完整句型 +${bonus}`;
            updateTokens(bonus);
        } else if (satisfiedCount === 2) {
            fb.textContent = `語法組合 +4`;
            updateTokens(4);
        } else if (satisfiedCount === 1) {
            fb.textContent = `基礎句型 +2`;
            updateTokens(2);
        } else {
            fb.textContent = `良好！`;
        }
        fb.className = 'feedback-correct';
        document.getElementById('l3v-actions').style.display = 'none';
        startAutoAdvance('l3v-countdown');
    } else {
        fb.textContent = '試試看加入更多符合已解鎖規則的單字';
        fb.className = 'feedback-wrong';
        if (currentWordData.attempts >= 5) {
            document.getElementById('l3v-actions').style.display = 'none';
            startAutoAdvance('l3v-countdown');
        }
    }
    document.getElementById('practice-progress').textContent = `目標進度: ${currentWordData.successes}/3 | 剩餘機會: ${5 - currentWordData.attempts}`;
}

document.addEventListener('keydown', e => {
    if (document.getElementById('action-l3v').style.display !== 'none' && e.key === 'Enter') {
        l3vAddWord();
    }
});

// L4: 文法應用 (stub)
registerQuestionModule(4, {
    activate(wordData) {
        showAudioButtons(false, false);
        document.getElementById('action-l4').style.display = 'flex';
        document.getElementById('next-word-btn').style.display = 'none';
        document.getElementById('grammar-input').value = '';
        document.getElementById('grammar-feedback').textContent = '';
        document.getElementById('grammar-feedback').className = '';
        updateProgressDots('l4-dots', wordData.successes || 0);
        speakText(wordData.word);
    },
    deactivate() {
        document.getElementById('action-l4').style.display = 'none';
    }
});

function submitGrammar() {
    skipWord();
}
