let practiceQueue = [];
let currentPracticeIndex = 0;
let isSlowSpeed = false;
let recognition = null;
let isListening = false;
let currentWordData = null;

function toggleSpeed() {
    isSlowSpeed = !isSlowSpeed;
    document.getElementById('speed-toggle').textContent = `語速: ${isSlowSpeed ? '慢速' : '正常'}`;
}

function speakText(text) {
    if (!text) return; window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; utterance.rate = isSlowSpeed ? 0.6 : 1.0;
    window.speechSynthesis.speak(utterance);
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
    document.getElementById('p-sentence').textContent = currentWordData.sentence;
    document.getElementById('p-etymology').textContent = currentWordData.etymology;

    const fb = document.getElementById('recognition-feedback');
    fb.textContent = "請點擊麥克風發音"; fb.className = "";
    document.getElementById('next-word-btn').style.display = 'none';

    speakText(currentWordData.word);
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
        if (spokenText.includes(targetWord)) {
            currentWordData.successes++;
            feedbackEl.textContent = `辨識結果: ${transcript} (正確!)`;
            feedbackEl.className = "feedback-correct";
        } else {
            feedbackEl.textContent = `辨識結果: ${transcript} (錯誤)`;
            feedbackEl.className = "feedback-wrong";
        }

        document.getElementById('practice-progress').textContent = `目標進度: ${currentWordData.successes}/3 | 剩餘機會: ${5 - currentWordData.attempts}`;
        document.getElementById('next-word-btn').style.display = 'block';
    };

    recognition.onerror = () => {
        const fb = document.getElementById('recognition-feedback');
        fb.textContent = "未接收到語音，請重試"; fb.className = "feedback-wrong";
    };

    recognition.onend = () => { isListening = false; document.getElementById('mic-btn').classList.remove('listening'); };
    recognition.start();
}

function moveToNextWord() { currentPracticeIndex = (currentPracticeIndex + 1) % practiceQueue.length; renderPracticeWord(); }

function endPractice() {
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
