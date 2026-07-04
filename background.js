const CHATGPT_URL = "https://chatgpt.com/";

async function getCurrentTab() {
  const tabs = await browser.tabs.query({
    active: true,
    currentWindow: true
  });

  return tabs[0];
}

async function sendToActiveTab(message) {
  const tab = await getCurrentTab();

  if (!tab || !tab.id) {
    return null;
  }

  return browser.tabs.sendMessage(tab.id, message);
}

function buildSingleQuestionPrompt(question) {
  return `
Przygotuj mi krótką notatkę do nauki na podstawie tego pytania.

Format odpowiedzi:
1. Poprawna odpowiedź: [litera + treść]
2. Dlaczego: [krótkie wyjaśnienie]
3. Kontekst / definicja: [2-4 zdania]
4. Co warto zapamiętać: [maksymalnie 3 punkty]
5. Możliwe pułapki: [jeżeli są]

Pytanie:
${question}
`.trim();
}

function buildAllQuestionsPrompt(questions) {
  return `
Przygotuj mi odpowiedzi i krótkie notatki do nauki dla poniższych pytań.

Dla każdego pytania użyj formatu:

### Pytanie [numer]
Poprawna odpowiedź: [litera + treść]
Dlaczego: [krótkie wyjaśnienie]
Kontekst / definicja: [2-4 zdania]
Co warto zapamiętać:
- punkt 1
- punkt 2
- punkt 3
Możliwe pułapki: [jeżeli są]

Nie pomijaj żadnego pytania. Jeżeli przy którymś pytaniu nie masz pewności, napisz to wprost.

Pytania:
${questions}
`.trim();
}

async function getCurrentQuestionPrompt() {
  const response = await sendToActiveTab({
    action: "extractQuestionFromDom"
  });

  const question = response?.text || "Nie udało się odczytać pytania.";

  return buildSingleQuestionPrompt(question);
}

async function getAllQuestionsPrompt() {
  const response = await sendToActiveTab({
    action: "extractAllQuestionsFromDom"
  });

  const questions = response?.text || "Nie udało się odczytać pytań ze strony.";

  return buildAllQuestionsPrompt(questions);
}

async function copyPromptToClipboard(prompt) {
  await sendToActiveTab({
    action: "copyTextToClipboard",
    text: prompt
  });
}

async function openChatGPTWithPrompt(prompt) {
  const url = `${CHATGPT_URL}?q=${encodeURIComponent(prompt)}`;

  browser.tabs.create({
    url
  });
}

browser.commands.onCommand.addListener(async (command) => {
  if (command === "copy-current-question-prompt") {
    const prompt = await getCurrentQuestionPrompt();
    await copyPromptToClipboard(prompt);
  }

  if (command === "open-chatgpt-with-current-question") {
    const prompt = await getCurrentQuestionPrompt();
    await openChatGPTWithPrompt(prompt);
  }

  if (command === "copy-all-questions-prompt") {
    const prompt = await getAllQuestionsPrompt();
    await copyPromptToClipboard(prompt);
  }

  if (command === "open-chatgpt-with-all-questions") {
    const prompt = await getAllQuestionsPrompt();
    await openChatGPTWithPrompt(prompt);
  }
});