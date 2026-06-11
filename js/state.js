let appSaves = [];
let currentSaveId = null;

let currentTokens = 0;
let datasets = [];
let activeDatasetId = '';
let usedIndices = {};
let checkInHistory = [];
let unlockedRules = []; // 文法解鎖狀態改為存檔綁定

const storageData = [];
const grid = new Map();

const globalTokenCount = document.getElementById('global-token-count');

const defaultWords = [
    { word: "hello", phonetic: "/həˈloʊ/", pos: "Interjection", morphological: "None", sentence: "Hello, how are you?", etymology: "From 'holla' (shout or call)." },
    { word: "goodbye", phonetic: "/ˌɡʊdˈbaɪ/", pos: "Interjection", morphological: "None", sentence: "Goodbye, see you tomorrow.", etymology: "Short for 'God be with ye'." },
    { word: "hi", phonetic: "/haɪ/", pos: "Interjection", morphological: "None", sentence: "Hi, I am Tom.", etymology: "From 'hy' or 'hey'." },
    { word: "bye", phonetic: "/baɪ/", pos: "Interjection", morphological: "None", sentence: "Bye, have a good day.", etymology: "A short form of 'goodbye'." },
    { word: "good morning", phonetic: "/ɡʊd ˈmɔːrnɪŋ/", pos: "Phrase", morphological: "None", sentence: "Good morning, mom.", etymology: "From 'good' and 'morning'." },
    { word: "please", phonetic: "/pliːz/", pos: "Adverb", morphological: "None", sentence: "Please sit down.", etymology: "Short for 'if it please you'." }
];

function getPosColor(posString) {
    if (!posString) return '#f2f2f2';
    const lower = posString.toLowerCase();
    if (lower.includes('verb') && !lower.includes('adverb')) return '#ffe6e6';
    if (lower.includes('adverb') || lower.includes('phrase')) return '#ffecd9';
    if (lower.includes('noun')) return '#e6f2ff';
    if (lower.includes('adj')) return '#e6ffe6';
    if (lower.includes('interjection') || lower.includes('particle')) return '#ffffe6';
    return '#f2f2f2';
}
