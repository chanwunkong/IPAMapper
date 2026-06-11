function getActiveDataset() {
    return datasets.find(d => d.id === activeDatasetId);
}

function initDatasets() {
    const defaultDs = { id: 'default', name: '預設單字庫 Lesson 1', words: defaultWords };
    datasets.push(defaultDs);
    activeDatasetId = 'default';
    usedIndices['default'] = 0;

    for (let i = 0; i < 5; i++) {
        if (usedIndices['default'] < defaultDs.words.length) {
            storageData.push({
                ...defaultDs.words[usedIndices['default']],
                level: 1,
                levelUpdatedAt: Date.now()
            });
            usedIndices['default']++;
        }
    }
    renderDatasets();
    updateStreakUI();
    saveCurrentData();
}

function renderDatasets() {
    const container = document.getElementById('dataset-list');
    container.innerHTML = '';
    datasets.forEach(ds => {
        const div = document.createElement('div');
        div.className = 'dataset-item';
        const isChecked = ds.id === activeDatasetId ? 'checked' : '';
        div.innerHTML = `
            <label>
                <input type="radio" name="activeDsRadio" value="${ds.id}" ${isChecked}>
                ${ds.name} <span style="color:#8e8e93; font-weight:normal; font-size:12px;">(${ds.words.length} 字)</span>
            </label>
            ${ds.id !== 'default' ? `<button class="action-btn btn-delete" onclick="deleteDataset('${ds.id}')">刪除</button>` : ''}
        `;
        div.querySelector('input').addEventListener('change', (e) => {
            if (e.target.checked) {
                activeDatasetId = ds.id;
                if (usedIndices[ds.id] === undefined) usedIndices[ds.id] = 0;
                saveCurrentData();
                showToast(`已切換至單字庫: ${ds.name}`);
            }
        });
        container.appendChild(div);
    });
}

window.deleteDataset = function (id) {
    if (confirm('確定要刪除此單字庫嗎？地圖上的單字不受影響。')) {
        datasets = datasets.filter(d => d.id !== id);
        delete usedIndices[id];
        if (activeDatasetId === id) activeDatasetId = 'default';
        saveCurrentData();
        renderDatasets();
    }
};

function parseCSVLine(text) {
    let ret = [], inQuote = false, value = '';
    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        if (inQuote) {
            if (char === '"') {
                if (text[i + 1] === '"') { value += '"'; i++; } else { inQuote = false; }
            } else { value += char; }
        } else {
            if (char === '"') { inQuote = true; }
            else if (char === ',') { ret.push(value.trim()); value = ''; }
            else { value += char; }
        }
    }
    ret.push(value.trim());
    return ret;
}

const csvUpload = document.getElementById('csvUpload');
let pendingCSVText = '';
let pendingFileName = '';
csvUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        pendingFileName = file.name;
        document.getElementById('csv-filename').textContent = `已選取: ${file.name}`;
        const reader = new FileReader();
        reader.onload = (evt) => { pendingCSVText = evt.target.result; };
        reader.readAsText(file);
    }
});

document.getElementById('importCsvBtn').addEventListener('click', () => {
    if (!currentSaveId) return showToast('請先新增並選擇一個存檔');
    if (!pendingCSVText) return showToast('請先選擇 CSV 檔案');

    const lines = pendingCSVText.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length < 2) return showToast('CSV 格式錯誤');

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    const wordIdx = headers.findIndex(h => h === 'word');
    const phoneticIdx = headers.findIndex(h => h === 'phonetic');
    const posIdx = headers.findIndex(h => h.includes('pos') || h.includes('lexical'));
    const morphIdx = headers.findIndex(h => h.includes('morphological'));
    const sentIdx = headers.findIndex(h => h.includes('sentence'));
    const etymIdx = headers.findIndex(h => h.includes('etymology'));

    if (wordIdx === -1) return showToast('缺少 Word 欄位');

    const newWords = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length > wordIdx && cols[wordIdx]) {
            newWords.push({
                word: cols[wordIdx],
                phonetic: phoneticIdx !== -1 ? cols[phoneticIdx] : '',
                pos: posIdx !== -1 ? cols[posIdx] : 'Other',
                morphological: morphIdx !== -1 ? cols[morphIdx] : '',
                sentence: sentIdx !== -1 ? cols[sentIdx] : '',
                etymology: etymIdx !== -1 ? cols[etymIdx] : ''
            });
        }
    }

    if (newWords.length > 0) {
        const dsId = 'ds_' + Date.now();
        datasets.push({ id: dsId, name: pendingFileName, words: newWords });
        activeDatasetId = dsId;
        usedIndices[dsId] = 0;

        saveCurrentData();
        renderDatasets();
        pendingCSVText = ''; csvUpload.value = '';
        document.getElementById('csv-filename').textContent = '尚未選擇檔案';
        showToast(`成功匯入 ${newWords.length} 個單字！`);
    }
});
