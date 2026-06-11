const questionModules = {};

function registerQuestionModule(level, module) {
    if (!questionModules[level]) questionModules[level] = [];
    questionModules[level].push(module);
}

let activeDispatchModule = null;

function dispatchQuestion(wordData) {
    if (activeDispatchModule) activeDispatchModule.deactivate();
    const level = wordData.level || 1;
    const pool = questionModules[level] || questionModules[1] || [];
    if (!pool.length) return;
    activeDispatchModule = pool[Math.floor(Math.random() * pool.length)];
    activeDispatchModule.activate(wordData);
}

function deactivateCurrentQuestion() {
    if (activeDispatchModule) {
        activeDispatchModule.deactivate();
        activeDispatchModule = null;
    }
}
