function populateVoiceList() {
    const select = document.getElementById('voice-select');
    if (!select) return;
    const currentURI = voiceSettings.voiceURI;
    select.innerHTML = '<option value="">預設語音</option>';
    window.speechSynthesis.getVoices().forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.voiceURI;
        opt.textContent = `${v.name} (${v.lang})`;
        opt.dataset.lang = v.lang;
        if (v.voiceURI === currentURI) opt.selected = true;
        select.appendChild(opt);
    });
}

function applyVoiceSettings() {
    populateVoiceList();
}

window.speechSynthesis.onvoiceschanged = populateVoiceList;

document.getElementById('voice-select').addEventListener('change', () => {
    if (!currentSaveId) return showToast('請先建立並選擇存檔');
    const select = document.getElementById('voice-select');
    const selectedOpt = select.options[select.selectedIndex];
    voiceSettings.voiceURI = selectedOpt.value;
    voiceSettings.lang = selectedOpt.dataset.lang || 'en-US';
    saveCurrentData();
    showToast('語音設定已儲存');
});
