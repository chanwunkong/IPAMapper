const UNLOCK_COST = 10;
const rulesA1 = [
    { id: 81, name: '核心語序' }, { id: 87, name: '形容詞與名詞' }, { id: 88, name: '指示詞與名詞' },
    { id: 89, name: '數詞與名詞' }, { id: 26, name: '綴詞傾向' }, { id: 33, name: '複數標記' },
    { id: 37, name: '定冠詞' }, { id: 38, name: '不定冠詞' }, { id: 66, name: '過去式' },
    { id: 67, name: '未來式' }, { id: 112, name: '否定詞' }, { id: 116, name: '是非問句' }
];

function isRuleUnlocked(ruleId) { return unlockedRules.includes(ruleId); }

function unlockRule(ruleId, ruleName) {
    if (isRuleUnlocked(ruleId)) return;
    if (!currentSaveId) return showToast('請先建立並選擇存檔');

    if (currentTokens >= UNLOCK_COST) {
        unlockedRules.push(ruleId);
        updateTokens(-UNLOCK_COST);
        showToast(`解鎖成功：${ruleName}`);
    } else {
        showToast('代幣不足');
    }
}

function renderGrammarRules() {
    const container = document.getElementById('rule-list'); container.innerHTML = '';
    rulesA1.forEach(rule => {
        const unlocked = isRuleUnlocked(rule.id), canAfford = currentTokens >= UNLOCK_COST;
        const card = document.createElement('div'); card.className = `rule-card ${unlocked ? '' : 'locked'}`;
        card.innerHTML = `<div class="rule-info"><div class="rule-id">WALS ${rule.id}</div><div class="rule-name">${rule.name}</div></div>`;
        const btnDiv = document.createElement('button');
        if (unlocked) { btnDiv.className = 'action-btn btn-view'; btnDiv.textContent = '查看'; btnDiv.onclick = () => showToast(`查看規則：${rule.name}`); }
        else { btnDiv.className = canAfford ? 'action-btn btn-unlock' : 'action-btn btn-disabled'; btnDiv.textContent = `解鎖 (${UNLOCK_COST})`; btnDiv.onclick = () => canAfford ? unlockRule(rule.id, rule.name) : showToast('代幣不足'); }
        card.appendChild(btnDiv); container.appendChild(card);
    });
}
