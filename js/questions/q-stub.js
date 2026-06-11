// L2: 句型重組 — 點選詞塊依序還原例句
let l2OriginalTokens = [];
let l2AnswerTokens = [];
let l2PoolTokens = [];

registerQuestionModule(2, {
    activate(wordData) {
        document.getElementById('p-word').style.visibility = 'hidden';
        document.getElementById('action-l2').style.display = 'flex';
        document.getElementById('next-word-btn').style.display = 'none';
        document.getElementById('l2-feedback').textContent = '';
        document.getElementById('l2-feedback').className = '';
        document.getElementById('l2-actions').style.display = 'flex';
        document.getElementById('l2-countdown').style.display = 'none';

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
    l2PoolTokens.forEach((token, i) => {
        const btn = document.createElement('button');
        btn.className = 'l2-word-chip';
        btn.textContent = token;
        btn.onclick = () => l2PoolToAnswer(i);
        pool.appendChild(btn);
    });
}

function renderL2Answer() {
    const area = document.getElementById('l2-answer-area');
    area.innerHTML = '';
    area.style.borderStyle = l2AnswerTokens.length > 0 ? 'solid' : 'dashed';
    l2AnswerTokens.forEach((token, i) => {
        const btn = document.createElement('button');
        btn.className = 'l2-word-chip placed';
        btn.textContent = token;
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

// === L3: 聽寫填空 ===
const L3_DPR = window.devicePixelRatio || 1;
let l3Canvas = null, l3Ctx = null;
let l3Strokes = [], l3IsDrawing = false, l3CurrentStroke = null;

function initL3Canvas() {
    l3Canvas = document.getElementById('l3-canvas');
    if (!l3Canvas || l3Canvas._l3init) return;
    l3Canvas._l3init = true;
    l3Ctx = l3Canvas.getContext('2d');

    l3Canvas.addEventListener('pointerdown', e => {
        l3Canvas.setPointerCapture(e.pointerId);
        l3IsDrawing = true;
        const r = l3Canvas.getBoundingClientRect();
        l3CurrentStroke = [{ x: e.clientX - r.left, y: e.clientY - r.top }];
    });
    l3Canvas.addEventListener('pointermove', e => {
        if (!l3IsDrawing) return;
        const r = l3Canvas.getBoundingClientRect();
        l3CurrentStroke.push({ x: e.clientX - r.left, y: e.clientY - r.top });
        redrawL3Canvas();
    });
    function endL3() {
        if (l3IsDrawing && l3CurrentStroke && l3CurrentStroke.length) {
            l3Strokes.push(l3CurrentStroke);
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

    const word = currentWordData ? currentWordData.word : '';
    if (word) {
        l3Ctx.save();
        l3Ctx.fillStyle = 'rgba(0,0,0,0.07)';
        l3Ctx.textAlign = 'center';
        l3Ctx.textBaseline = 'middle';
        l3Ctx.font = `bold ${Math.min(h * 0.55, 52)}px -apple-system, sans-serif`;
        l3Ctx.fillText(word, w / 2, h / 2);
        l3Ctx.restore();
    }

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
    l3Strokes = [];
    l3CurrentStroke = null;
    redrawL3Canvas();
}

registerQuestionModule(2, {
    activate(wordData) {
        document.getElementById('p-word').style.visibility = 'hidden';
        document.getElementById('action-l3').style.display = 'flex';
        document.getElementById('next-word-btn').style.display = 'none';
        document.getElementById('l3-input').value = '';
        document.getElementById('l3-feedback').textContent = '';
        document.getElementById('l3-feedback').className = '';
        document.getElementById('l3-actions').style.display = 'flex';
        document.getElementById('l3-countdown').style.display = 'none';

        const sentence = escapeHtml(wordData.sentence || '');
        const escapedWord = wordData.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const gapHtml = sentence.replace(
            new RegExp(`(?<![\\w])${escapedWord}(?![\\w])`, 'gi'),
            '<span class="l3-blank">___</span>'
        );
        document.getElementById('l3-gap-sentence').innerHTML = gapHtml || sentence;

        l3Strokes = [];
        l3CurrentStroke = null;
        initL3Canvas();
        setTimeout(resizeL3Canvas, 50);

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
        document.getElementById('p-word').style.visibility = 'visible';
        document.getElementById('action-l3v').style.display = 'flex';
        document.getElementById('next-word-btn').style.display = 'none';
        document.getElementById('l3v-feedback').textContent = '';
        document.getElementById('l3v-feedback').className = '';
        document.getElementById('l3v-actions').style.display = 'flex';
        document.getElementById('l3v-countdown').style.display = 'none';
        document.getElementById('l3v-input').value = '';
        l3vTokens = [];
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
    const satisfiedCount = unlockedIds.filter(id => checkWalsRule(id, l3vTokens)).length;
    if (satisfiedCount > 0 || unlockedIds.length === 0) {
        currentWordData.successes++;
        fb.textContent = satisfiedCount > 0 ? `正確！滿足 ${satisfiedCount} 條規則` : '良好！';
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
        document.getElementById('action-l4').style.display = 'flex';
        document.getElementById('next-word-btn').style.display = 'none';
        document.getElementById('grammar-input').value = '';
        document.getElementById('grammar-feedback').textContent = '';
        document.getElementById('grammar-feedback').className = '';
        speakText(wordData.word);
    },
    deactivate() {
        document.getElementById('action-l4').style.display = 'none';
    }
});

function submitGrammar() {
    skipWord();
}
