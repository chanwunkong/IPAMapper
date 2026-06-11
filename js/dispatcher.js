const questionModules = {};

function registerQuestionModule(level, module) {
    questionModules[level] = module;
}

let activeDispatchModule = null;

function dispatchQuestion(wordData) {
    if (activeDispatchModule) activeDispatchModule.deactivate();
    const level = wordData.level || 1;
    const key = questionModules[level] ? level : 1;
    activeDispatchModule = questionModules[key];
    if (activeDispatchModule) activeDispatchModule.activate(wordData);
}

function deactivateCurrentQuestion() {
    if (activeDispatchModule) {
        activeDispatchModule.deactivate();
        activeDispatchModule = null;
    }
}
