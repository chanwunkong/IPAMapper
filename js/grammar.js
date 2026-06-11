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

const ruleDescriptions = {
    81:  'SVO 語序：句子依主詞 → 動詞 → 受詞排列，涵蓋人稱代詞、名詞、動詞與助動詞。',
    87:  '形容詞位於名詞之前（ADJ + N），描述名詞性質。',
    88:  '指示詞位於名詞之前（DEM + N），如 this / that 後接名詞。',
    89:  '數詞位於名詞之前（NUM + N），如 two apples。',
    26:  '以詞綴（前綴或後綴）標記語法關係，如複數、時態、格位。',
    33:  '以詞綴標記名詞複數形式，形態欄需含斜線分隔的複數形。',
    37:  '使用定冠詞（article.definite），如英語的 the。',
    38:  '使用不定冠詞（article.indefinite），如英語的 a / an。',
    66:  '包含過去式動詞（verb.past），表達已發生的事件。',
    67:  '包含未來式助動詞或動詞（auxiliary.future / verb.future），表達將發生的事件。',
    112: '句中含否定詞（negation），用以表達否定意涵。',
    116: '是非問句以助動詞開頭（auxiliary 置於句首），如 Do / Is / Can 等起首。'
};

function showRuleDetail(rule) {
    document.getElementById('rd-wals-id').textContent = `WALS ${rule.id}`;
    document.getElementById('rd-name').textContent = rule.name;
    document.getElementById('rd-desc').textContent = ruleDescriptions[rule.id] || '';
    const tagsEl = document.getElementById('rd-pos-tags');
    tagsEl.innerHTML = '';
    if (rule.posTypes && rule.posTypes.length) {
        rule.posTypes.forEach(p => {
            const tag = document.createElement('span');
            tag.className = 'rule-detail-pos-tag';
            tag.textContent = p;
            tagsEl.appendChild(tag);
        });
        document.getElementById('rd-pos-section').style.display = 'flex';
    } else {
        document.getElementById('rd-pos-section').style.display = 'none';
    }
    const modal = document.getElementById('rule-detail-modal');
    modal.style.display = 'flex';
}

function closeRuleDetail() {
    document.getElementById('rule-detail-modal').style.display = 'none';
}

function renderGrammarRules() {
    const container = document.getElementById('rule-list'); container.innerHTML = '';
    rulesA1.forEach(rule => {
        const unlocked = isRuleUnlocked(rule.id), canAfford = currentTokens >= UNLOCK_COST;
        const card = document.createElement('div'); card.className = `rule-card ${unlocked ? '' : 'locked'}`;
        card.innerHTML = `<div class="rule-info"><div class="rule-id">WALS ${rule.id}</div><div class="rule-name">${rule.name}</div></div>`;
        const btnDiv = document.createElement('button');
        if (unlocked) { btnDiv.className = 'action-btn btn-view'; btnDiv.textContent = '查看'; btnDiv.onclick = () => showRuleDetail(rule); }
        else { btnDiv.className = canAfford ? 'action-btn btn-unlock' : 'action-btn btn-disabled'; btnDiv.textContent = `解鎖 (${UNLOCK_COST})`; btnDiv.onclick = () => canAfford ? unlockRule(rule.id, rule.name) : showToast('代幣不足'); }
        card.appendChild(btnDiv); container.appendChild(card);
    });
}
