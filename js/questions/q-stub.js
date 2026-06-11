// L2: 聽寫題型 — 聽音辨字，隱藏單字文本
registerQuestionModule(2, {
    activate(wordData) {
        document.getElementById('p-word').style.visibility = 'hidden';
        document.getElementById('action-l2').style.display = 'flex';
        document.getElementById('next-word-btn').style.display = 'none';
        document.getElementById('dictation-input').value = '';
        document.getElementById('dictation-feedback').textContent = '';
        document.getElementById('dictation-feedback').className = '';
        speakText(wordData.word);
    },
    deactivate() {
        document.getElementById('p-word').style.visibility = 'visible';
        document.getElementById('action-l2').style.display = 'none';
    }
});

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

function submitDictation() {
    const input = document.getElementById('dictation-input');
    const typed = input.value.trim().toLowerCase().replace(/[^\w\s]|_/g, "");
    const target = currentWordData.word.toLowerCase().replace(/[^\w\s]|_/g, "");
    currentWordData.attempts++;
    const feedbackEl = document.getElementById('dictation-feedback');
    if (typed === target) {
        currentWordData.successes++;
        feedbackEl.textContent = '正確！';
        feedbackEl.className = 'feedback-correct';
    } else {
        feedbackEl.textContent = `錯誤，正確答案：${currentWordData.word}`;
        feedbackEl.className = 'feedback-wrong';
    }
    document.getElementById('practice-progress').textContent = `目標進度: ${currentWordData.successes}/3 | 剩餘機會: ${5 - currentWordData.attempts}`;
    document.getElementById('next-word-btn').style.display = 'block';
    input.value = '';
}

function submitGrammar() {
    skipWord();
}
