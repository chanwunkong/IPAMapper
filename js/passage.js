let passageSentences = [];
let passageUnknownSet = new Set();
let readingIndex = 0;
let readingBatchCount = 0;
let readingBatchUnknowns = new Set();

function parsePassage(text) {
    const sentences = text.trim()
        .split(/[.!?]+\s+(?=[A-Z"'])/)
        .map(s => s.trim())
        .filter(s => s.length > 2);
    if (!sentences.length) sentences.push(text.trim());

    const wordSet = new Set();
    sentences.forEach(s => {
        s.toLowerCase()
            .replace(/[^a-z\s']/g, ' ')
            .split(/\s+/)
            .map(w => w.replace(/^'+|'+$/g, ''))
            .filter(w => w.length > 1)
            .forEach(w => wordSet.add(w));
    });

    return { sentences, words: [...wordSet] };
}

function classifyPassageWords(words) {
    const knownSet = new Set();
    storageData.forEach(item => knownSet.add(item.word.toLowerCase().trim()));
    for (const [, item] of grid.entries()) knownSet.add(item.word.toLowerCase().trim());
    datasets.forEach(ds => ds.words.forEach(w => knownSet.add(w.word.toLowerCase().trim())));

    return {
        known: words.filter(w => knownSet.has(w)),
        unknown: words.filter(w => !knownSet.has(w))
    };
}

function analyzePassage() {
    if (!currentSaveId) return showToast('請先選擇存檔');
    const text = document.getElementById('passage-input').value.trim();
    if (!text) return showToast('請先貼入文章');

    const { sentences, words } = parsePassage(text);
    const { known, unknown } = classifyPassageWords(words);

    passageSentences = sentences;
    passageUnknownSet = new Set(unknown);

    document.getElementById('passage-stats').style.display = 'block';
    document.getElementById('passage-stats').textContent =
        `共 ${words.length} 個詞彙 · 已知 ${known.length} · 陌生 ${unknown.length}`;

    const unknownEl = document.getElementById('passage-unknown-words');
    unknownEl.innerHTML = '';
    unknown.sort().forEach(w => unknownEl.appendChild(makePassageChip(w)));

    const knownEl = document.getElementById('passage-known-words');
    knownEl.innerHTML = '';
    known.sort().forEach(w => {
        const chip = document.createElement('span');
        chip.className = 'passage-word-chip passage-known';
        chip.textContent = w;
        knownEl.appendChild(chip);
    });

    document.getElementById('passage-result').style.display = 'block';
}

function makePassageChip(word) {
    const wrap = document.createElement('span');
    wrap.className = 'passage-word-wrap';

    const chip = document.createElement('span');
    chip.className = 'passage-word-chip passage-unknown';
    chip.textContent = word;

    const btn = document.createElement('button');
    btn.className = 'passage-add-btn';
    btn.textContent = '+';
    btn.onclick = () => addPassageWordToMap(word, () => wrap.remove());

    wrap.appendChild(chip);
    wrap.appendChild(btn);
    return wrap;
}

function addPassageWordToMap(word, onSuccess) {
    if (!currentSaveId) { showToast('請先選擇存檔'); return; }
    if (storageData.some(item => item.word.toLowerCase() === word.toLowerCase())) {
        showToast(`${word} 已在單字庫中`);
        passageUnknownSet.delete(word);
        onSuccess?.();
        return;
    }
    storageData.push({
        word,
        phonetic: '',
        pos: '',
        morphological: word,
        sentence: '',
        etymology: '',
        level: 1,
        levelUpdatedAt: Date.now()
    });
    passageUnknownSet.delete(word);
    updateStorageUI();
    saveCurrentData();
    showToast(`已加入：${word}`);
    onSuccess?.();
}

// === 朗讀模式 ===

function startReadingMode() {
    if (!passageSentences.length) return showToast('請先分析文章');
    readingIndex = 0;
    readingBatchCount = 0;
    readingBatchUnknowns = new Set();
    document.getElementById('reading-modal').style.display = 'flex';
    document.getElementById('reading-view').style.display = 'flex';
    document.getElementById('reading-interstitial').style.display = 'none';
    renderReadingSentence();
}

function renderReadingSentence() {
    if (readingIndex >= passageSentences.length) {
        if (readingBatchUnknowns.size > 0) {
            showReadingInterstitial([...readingBatchUnknowns]);
            readingBatchUnknowns = new Set();
        } else {
            endReadingMode();
            showToast('文章朗讀完畢');
        }
        return;
    }

    const sentence = passageSentences[readingIndex];
    document.getElementById('reading-progress').textContent =
        `第 ${readingIndex + 1} / ${passageSentences.length} 句`;

    const html = sentence.split(/(\s+)/).map(token => {
        const clean = token.toLowerCase().replace(/[^a-z']/g, '');
        if (clean.length > 1 && passageUnknownSet.has(clean)) {
            return `<mark class="reading-unknown">${token}</mark>`;
        }
        return token;
    }).join('');
    document.getElementById('reading-sentence-display').innerHTML = html;
}

function readingSpeak() {
    if (readingIndex < passageSentences.length) speakText(passageSentences[readingIndex]);
}

function readingNext() {
    window.speechSynthesis.cancel();
    if (readingIndex < passageSentences.length) {
        passageSentences[readingIndex]
            .toLowerCase().replace(/[^a-z\s']/g, ' ').split(/\s+/)
            .map(w => w.replace(/^'+|'+$/g, ''))
            .filter(w => w.length > 1 && passageUnknownSet.has(w))
            .forEach(w => readingBatchUnknowns.add(w));
    }

    readingIndex++;
    readingBatchCount++;

    if (readingBatchCount >= 3 && readingBatchUnknowns.size > 0) {
        readingBatchCount = 0;
        showReadingInterstitial([...readingBatchUnknowns]);
        readingBatchUnknowns = new Set();
        return;
    }
    if (readingBatchCount >= 3) readingBatchCount = 0;

    renderReadingSentence();
}

function showReadingInterstitial(words) {
    document.getElementById('reading-view').style.display = 'none';
    const interstitial = document.getElementById('reading-interstitial');
    interstitial.style.display = 'flex';
    const container = document.getElementById('reading-interstitial-words');
    container.innerHTML = '';
    words.forEach(w => container.appendChild(makePassageChip(w)));
}

function continueReading() {
    document.getElementById('reading-view').style.display = 'flex';
    document.getElementById('reading-interstitial').style.display = 'none';
    renderReadingSentence();
}

function endReadingMode() {
    window.speechSynthesis.cancel();
    document.getElementById('reading-modal').style.display = 'none';
}
