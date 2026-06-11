let practiceQueue = [];
let currentPracticeIndex = 0;
let isSlowSpeed = false;
let recognition = null;
let isListening = false;
let currentWordData = null;
let autoAdvanceTimer = null;
let practiceAudioDisabled = false;

function disableAudio() {
    practiceAudioDisabled = true;
    document.getElementById('audio-disable-btn').style.display = 'none';
    document.getElementById('audio-disabled-notice').style.display = 'inline';
    if (currentWordData) dispatchQuestion(currentWordData);
}

function toggleSpeed() {
    isSlowSpeed = !isSlowSpeed;
    document.getElementById('speed-toggle').textContent = `語速: ${isSlowSpeed ? '慢速' : '正常'}`;
}

function speakText(text) {
    if (!text) return; window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = isSlowSpeed ? 0.6 : 1.0;
    if (voiceSettings.voiceURI) {
        const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === voiceSettings.voiceURI);
        if (voice) utterance.voice = voice;
    }
    utterance.lang = voiceSettings.lang || 'en-US';
    window.speechSynthesis.speak(utterance);
}

function speakSequence(texts) {
    window.speechSynthesis.cancel();
    texts.filter(t => t).forEach(text => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = isSlowSpeed ? 0.6 : 1.0;
        if (voiceSettings.voiceURI) {
            const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === voiceSettings.voiceURI);
            if (voice) utterance.voice = voice;
        }
        utterance.lang = voiceSettings.lang || 'en-US';
        window.speechSynthesis.speak(utterance);
    });
}

function shuffleAndTake(arr, n) {
    return arr.sort(() => 0.5 - Math.random()).slice(0, n);
}

function takeOldest(arr, n) {
    return arr.sort((a, b) => (a.levelUpdatedAt || 0) - (b.levelUpdatedAt || 0)).slice(0, n);
}

document.getElementById('play-btn').addEventListener('click', () => {
    if (!currentSaveId) return showToast('請先至設定頁面新增或選擇存檔');
    if (storageData.length >= 5) return showToast('存放區已滿，請先將單字放入地圖');

    let l5 = [], l4 = [], l3 = [], l2 = [], l1 = [];
    const existingWords = new Set();

    storageData.forEach(item => existingWords.add(item.word.toLowerCase().trim()));

    // DUP-2: 將所有單字庫已消耗的詞加入 existingWords，防止跨單字庫重複出題
    datasets.forEach(ds => {
        const consumed = usedIndices[ds.id] || 0;
        for (let i = 0; i < Math.min(consumed, ds.words.length); i++) {
            existingWords.add(ds.words[i].word.toLowerCase().trim());
        }
    });

    for (let [key, item] of grid.entries()) {
        existingWords.add(item.word.toLowerCase().trim());
        let pItem = { ...item, source: 'map', key: key, attempts: 0, successes: 0 };

        if (item.level === 5) l5.push(pItem);
        else if (item.level === 4) l4.push(pItem);
        else if (item.level === 3) l3.push(pItem);
        else if (item.level === 2) l2.push(pItem);
        else if (item.level === 1) l1.push(pItem);
    }

    practiceQueue = [
        ...shuffleAndTake(l5, 5),
        ...takeOldest(l4, 5),
        ...takeOldest(l3, 5),
        ...takeOldest(l2, 5),
        ...takeOldest(l1, 5)
    ];

    let l0 = [];
    if (datasets.length > 0) {
        const activeDs = getActiveDataset();
        let currentIndex = usedIndices[activeDatasetId] || 0;
        const neededNewWords = Math.min(5, 5 - storageData.length);

        while (l0.length < neededNewWords && currentIndex < activeDs.words.length) {
            const newWordObj = activeDs.words[currentIndex];
            const normalizedWord = newWordObj.word.toLowerCase().trim();
            if (!existingWords.has(normalizedWord)) {
                l0.push({ ...newWordObj, level: 1, source: 'csv', attempts: 0, successes: 0 });
                existingWords.add(normalizedWord);
            }
            currentIndex++;
        }
        usedIndices[activeDatasetId] = currentIndex;
    }

    practiceQueue = [...practiceQueue, ...l0];

    if (practiceQueue.length === 0) {
        showToast('題庫已全數練習完畢且地圖皆已滿級！請匯入新題庫。');
        return;
    }

    currentPracticeIndex = 0;
    practiceAudioDisabled = false;
    document.getElementById('audio-disable-btn').style.display = '';
    document.getElementById('audio-disabled-notice').style.display = 'none';
    document.getElementById('practice-modal').classList.add('active');
    renderPracticeWord();
});

function renderPracticeWord() {
    if (practiceQueue.length === 0) return endPractice();

    let found = false;
    for (let i = 0; i < practiceQueue.length; i++) {
        let idx = (currentPracticeIndex + i) % practiceQueue.length;
        if (practiceQueue[idx].successes < 3 && practiceQueue[idx].attempts < 5) {
            currentPracticeIndex = idx; found = true; break;
        }
    }

    if (!found) return endPractice();

    currentWordData = practiceQueue[currentPracticeIndex];

    document.getElementById('practice-word-card').style.backgroundColor = getPosColor(currentWordData.pos);
    document.getElementById('practice-progress').textContent = `目標進度: ${currentWordData.successes}/3 | 剩餘機會: ${5 - currentWordData.attempts}`;
    document.getElementById('p-word').textContent = currentWordData.word;
    document.getElementById('p-phonetic').textContent = currentWordData.phonetic;
    document.getElementById('p-pos').textContent = currentWordData.pos || 'N/A';
    document.getElementById('p-morph').textContent = currentWordData.morphological;
    document.getElementById('p-sentence').innerHTML = renderHighlightedSentence(currentWordData.sentence);
    document.getElementById('p-etymology').textContent = currentWordData.etymology;

    dispatchQuestion(currentWordData);
}

function skipWord() {
    if (!currentWordData) return;
    currentWordData.attempts = 5;
    showToast(`已跳過：${currentWordData.word}`);
    moveToNextWord();
}

function toggleMic() {
    if (isListening) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("抱歉，您的瀏覽器不支援語音辨識功能。");

    recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; recognition.interimResults = false;

    recognition.onstart = () => {
        isListening = true; document.getElementById('mic-btn').classList.add('listening');
        const fb = document.getElementById('recognition-feedback');
        fb.textContent = "聆聽中..."; fb.className = "";
    };

    recognition.onresult = (event) => {
        currentWordData.attempts++;
        const transcript = event.results[0][0].transcript;
        const spokenText = transcript.toLowerCase().replace(/[^\w\s]|_/g, "");
        const targetWord = currentWordData.word.toLowerCase().replace(/[^\w\s]|_/g, "");

        const feedbackEl = document.getElementById('recognition-feedback');
        document.getElementById('l1-mic-area').style.display = 'none';

        if (spokenText.includes(targetWord)) {
            currentWordData.successes++;
            updateL1Dots(currentWordData.successes);
            feedbackEl.textContent = `正確！辨識到: ${transcript}`;
            feedbackEl.className = "feedback-correct";
            document.getElementById('l1-result-actions').style.display = 'none';
            startAutoAdvance('l1-countdown');
        } else {
            feedbackEl.textContent = `辨識到: ${transcript}`;
            feedbackEl.className = "feedback-wrong";
            if (currentWordData.attempts >= 5) {
                document.getElementById('l1-result-actions').style.display = 'none';
                startAutoAdvance('l1-countdown');
            } else {
                document.getElementById('l1-result-actions').style.display = 'flex';
            }
        }

        document.getElementById('practice-progress').textContent = `目標進度: ${currentWordData.successes}/3 | 剩餘機會: ${5 - currentWordData.attempts}`;
    };

    recognition.onerror = () => {
        const fb = document.getElementById('recognition-feedback');
        fb.textContent = "未接收到語音，請重試"; fb.className = "feedback-wrong";
    };

    recognition.onend = () => { isListening = false; document.getElementById('mic-btn').classList.remove('listening'); };
    recognition.start();
}

function startAutoAdvance(countdownId) {
    const countdown = document.getElementById(countdownId);
    const bar = countdown.querySelector('.countdown-bar');
    countdown.style.display = 'flex';
    bar.style.transition = 'none';
    bar.style.width = '100%';
    bar.offsetWidth;
    bar.style.transition = 'width 1.5s linear';
    bar.style.width = '0%';
    autoAdvanceTimer = setTimeout(() => { moveToNextWord(); }, 1500);
}

function cancelAutoAdvance(countdownId) {
    if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
    if (!countdownId) return;
    const countdown = document.getElementById(countdownId);
    if (countdown) countdown.style.display = 'none';
}

function updateL1Dots(successes) {
    const container = document.getElementById('l1-dots');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('span');
        dot.className = 'l1-dot' + (i < successes ? ' filled' : '');
        container.appendChild(dot);
    }
}

function l1RetryMic() {
    document.getElementById('l1-result-actions').style.display = 'none';
    document.getElementById('l1-mic-area').style.display = 'flex';
    const fb = document.getElementById('recognition-feedback');
    fb.textContent = '請點擊麥克風發音';
    fb.className = '';
    toggleMic();
}

function moveToNextWord() { currentPracticeIndex = (currentPracticeIndex + 1) % practiceQueue.length; renderPracticeWord(); }

function endPractice() {
    deactivateCurrentQuestion();
    let tokensEarned = 0; let passedCount = 0;

    practiceQueue.forEach(item => {
        if (item.successes >= 3) {
            passedCount++; tokensEarned += 5;
            if (item.source === 'map') {
                const mapItem = grid.get(item.key);
                if (mapItem.level < 5) mapItem.level += 1;
                mapItem.levelUpdatedAt = Date.now();
                grid.set(item.key, mapItem);
            } else if (item.source === 'csv') {
                storageData.push({
                    word: item.word, level: item.level, pos: item.pos,
                    phonetic: item.phonetic, morphological: item.morphological,
                    sentence: item.sentence, etymology: item.etymology,
                    levelUpdatedAt: Date.now()
                });
            }
        } else if (item.attempts >= 5) {
            if (item.source === 'map') {
                const mapItem = grid.get(item.key);
                if (mapItem.level === 5) {
                    mapItem.level = 4;
                    mapItem.levelUpdatedAt = Date.now();
                    grid.set(item.key, mapItem);
                }
            } else if (item.source === 'csv') {
                const activeDs = getActiveDataset();
                activeDs.words.push({
                    word: item.word, phonetic: item.phonetic, pos: item.pos,
                    morphological: item.morphological, sentence: item.sentence, etymology: item.etymology
                });
            }
        }
    });

    if (tokensEarned > 0) updateTokens(tokensEarned);
    recordCheckIn();

    document.getElementById('practice-modal').classList.remove('active');
    updateStorageUI(); drawCanvas(); saveCurrentData();
    showToast(`練習結束！共 ${passedCount} 題過關，獲得 ${tokensEarned} 代幣`);
}

function generateL1AOptions(word) {
    const vowels = 'aeiou';
    const consonants = 'bcdfghjklmnpqrstvwxyz';
    const lower = word.toLowerCase();
    const distractors = new Set();
    let attempts = 0;
    while (distractors.size < 3 && attempts < 100) {
        attempts++;
        const letters = lower.split('');
        const eligible = letters.map((c, i) => (/[a-z]/.test(c) ? i : -1)).filter(i => i >= 0);
        if (!eligible.length) break;
        const idx = eligible[Math.floor(Math.random() * eligible.length)];
        const ch = letters[idx];
        const pool = (vowels.includes(ch) ? vowels : consonants).split('').filter(c => c !== ch);
        const replacement = pool[Math.floor(Math.random() * pool.length)];
        const distractor = letters.map((c, i) => (i === idx ? replacement : c)).join('');
        if (distractor !== lower) distractors.add(distractor);
    }
    return [lower, ...[...distractors].slice(0, 3)].sort(() => 0.5 - Math.random());
}

function l1aSelectOption(btn, selected) {
    const correct = currentWordData.word.toLowerCase();
    currentWordData.attempts++;
    document.querySelectorAll('.l1a-option-btn').forEach(b => (b.disabled = true));
    const fb = document.getElementById('l1a-feedback');
    if (selected === correct) {
        currentWordData.successes++;
        btn.classList.add('correct');
        fb.textContent = '正確！';
        fb.className = 'feedback-correct';
        startAutoAdvance('l1a-countdown');
    } else {
        btn.classList.add('wrong');
        document.querySelectorAll('.l1a-option-btn').forEach(b => {
            if (b.dataset.word === correct) b.classList.add('correct');
        });
        fb.textContent = `正確拼寫：${currentWordData.word}`;
        fb.className = 'feedback-wrong';
        if (currentWordData.attempts >= 5) {
            startAutoAdvance('l1a-countdown');
        } else {
            setTimeout(() => {
                document.querySelectorAll('.l1a-option-btn').forEach(b => {
                    b.classList.remove('correct', 'wrong');
                    b.disabled = false;
                });
                fb.textContent = '';
                fb.className = '';
            }, 1500);
        }
    }
    document.getElementById('practice-progress').textContent = `目標進度: ${currentWordData.successes}/3 | 剩餘機會: ${5 - currentWordData.attempts}`;
}

// L1-S: 語音辨識題型模組
registerQuestionModule(1, {
    requiresAudio: true,
    activate(wordData) {
        document.getElementById('p-word').style.visibility = 'visible';
        document.getElementById('action-l1').style.display = 'flex';
        const fb = document.getElementById('recognition-feedback');
        fb.textContent = "請點擊麥克風發音"; fb.className = "";
        document.getElementById('next-word-btn').style.display = 'none';
        document.getElementById('l1-mic-area').style.display = 'flex';
        document.getElementById('l1-result-actions').style.display = 'none';
        document.getElementById('l1-countdown').style.display = 'none';
        updateL1Dots(wordData.successes || 0);
        speakSequence([wordData.word, wordData.sentence]);
    },
    deactivate() {
        cancelAutoAdvance('l1-countdown');
        document.getElementById('action-l1').style.display = 'none';
        if (recognition) { try { recognition.abort(); } catch(e) {} recognition = null; }
        isListening = false;
        document.getElementById('mic-btn').classList.remove('listening');
    }
});

// L1-A: 聽音選字題型模組
registerQuestionModule(1, {
    requiresAudio: true,
    activate(wordData) {
        document.getElementById('p-word').style.visibility = 'hidden';
        document.getElementById('action-l1a').style.display = 'flex';
        document.getElementById('next-word-btn').style.display = 'none';
        document.getElementById('l1a-feedback').textContent = '';
        document.getElementById('l1a-feedback').className = '';
        document.getElementById('l1a-countdown').style.display = 'none';

        const opts = generateL1AOptions(wordData.word);
        const container = document.getElementById('l1a-options');
        container.innerHTML = '';
        opts.forEach(w => {
            const btn = document.createElement('button');
            btn.className = 'l1a-option-btn';
            btn.textContent = w;
            btn.dataset.word = w;
            btn.onclick = () => l1aSelectOption(btn, w);
            container.appendChild(btn);
        });
        speakSequence([wordData.word, wordData.sentence]);
    },
    deactivate() {
        cancelAutoAdvance('l1a-countdown');
        document.getElementById('p-word').style.visibility = 'visible';
        document.getElementById('action-l1a').style.display = 'none';
    }
});
