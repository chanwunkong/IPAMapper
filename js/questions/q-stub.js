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

// L3: 句型重組 (stub)
registerQuestionModule(3, {
    activate(wordData) {
        document.getElementById('action-l3').style.display = 'flex';
        document.getElementById('next-word-btn').style.display = 'none';
        document.getElementById('sentence-feedback').textContent = '';
        speakText(wordData.sentence);
    },
    deactivate() {
        document.getElementById('action-l3').style.display = 'none';
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
