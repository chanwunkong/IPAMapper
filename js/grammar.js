const UNLOCK_COST = 10;
const rulesA1 = [
    { id: 81,  name: '核心語序',   posTypes: ['pronoun.personal', 'noun', 'verb', 'auxiliary'] },
    { id: 87,  name: '形容詞與名詞', posTypes: ['adjective', 'noun'] },
    { id: 88,  name: '指示詞與名詞', posTypes: ['pronoun.demonstrative', 'noun'] },
    { id: 89,  name: '數詞與名詞',  posTypes: ['numeral', 'noun'] },
    { id: 26,  name: '綴詞傾向',   posTypes: [] },
    { id: 33,  name: '複數標記',   posTypes: ['noun'] },
    { id: 37,  name: '定冠詞',     posTypes: ['article.definite'] },
    { id: 38,  name: '不定冠詞',   posTypes: ['article.indefinite'] },
    { id: 66,  name: '過去式',     posTypes: ['verb.past'] },
    { id: 67,  name: '未來式',     posTypes: ['auxiliary.future', 'verb.future'] },
    { id: 112, name: '否定詞',     posTypes: ['negation'] },
    { id: 116, name: '是非問句',   posTypes: ['auxiliary'] }
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

function checkWalsRule(ruleId, tokens) {
    const hasPos = p => tokens.some(t => t.pos === p || (t.pos && t.pos.startsWith(p + '.')));
    switch (ruleId) {
        case 37: return hasPos('article.definite');
        case 38: return hasPos('article.indefinite');
        case 66: return hasPos('verb.past');
        case 67: return hasPos('auxiliary.future') || hasPos('verb.future');
        case 112: return hasPos('negation');
        case 116:
            if (!tokens.length) return false;
            return tokens[0].pos === 'auxiliary' || (tokens[0].pos && tokens[0].pos.startsWith('auxiliary.'));
        case 87:
            for (let i = 0; i < tokens.length - 1; i++) {
                if (!tokens[i].pos) continue;
                if (tokens[i].pos === 'adjective' || tokens[i].pos.startsWith('adjective.')) {
                    for (let j = i + 1; j < tokens.length; j++) {
                        if (tokens[j].pos === 'noun' || (tokens[j].pos && tokens[j].pos.startsWith('noun.'))) return true;
                    }
                }
            }
            return false;
        case 88:
            for (let i = 0; i < tokens.length - 1; i++) {
                if (tokens[i].pos !== 'pronoun.demonstrative') continue;
                for (let j = i + 1; j < tokens.length; j++) {
                    if (tokens[j].pos === 'noun' || (tokens[j].pos && tokens[j].pos.startsWith('noun.'))) return true;
                }
            }
            return false;
        case 89:
            for (let i = 0; i < tokens.length - 1; i++) {
                if (!tokens[i].pos) continue;
                if (tokens[i].pos === 'numeral' || tokens[i].pos.startsWith('numeral.')) {
                    for (let j = i + 1; j < tokens.length; j++) {
                        if (tokens[j].pos === 'noun' || (tokens[j].pos && tokens[j].pos.startsWith('noun.'))) return true;
                    }
                }
            }
            return false;
        case 81: {
            let sIdx = -1, vIdx = -1, oIdx = -1;
            for (let i = 0; i < tokens.length; i++) {
                const p = tokens[i].pos;
                if (!p) continue;
                if (sIdx === -1 && (p.startsWith('pronoun.personal') || p === 'noun' || p.startsWith('noun.'))) { sIdx = i; }
                else if (sIdx !== -1 && vIdx === -1 && (p === 'verb' || p.startsWith('verb.') || p === 'auxiliary' || p.startsWith('auxiliary.'))) { vIdx = i; }
                else if (vIdx !== -1 && oIdx === -1 && (p === 'noun' || p.startsWith('noun.') || p.startsWith('pronoun.'))) { oIdx = i; }
            }
            return sIdx !== -1 && vIdx !== -1 && oIdx !== -1;
        }
        case 26:
        case 33:
            return tokens.some(t => t.morphological && t.morphological.includes('/'));
        default:
            return false;
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
