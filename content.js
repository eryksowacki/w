let lastTarget = null;

document.addEventListener(
  "mousemove",
  function (event) {
    lastTarget = event.target;
  },
  true
);

document.addEventListener(
  "click",
  function (event) {
    lastTarget = event.target;
  },
  true
);

document.addEventListener(
  "contextmenu",
  function (event) {
    lastTarget = event.target;

    event.stopPropagation();
    event.stopImmediatePropagation();
  },
  true
);

browser.runtime.onMessage.addListener(async (message) => {
  if (message.action === "extractQuestionFromDom") {
    return {
      text: extractCurrentQuestion()
    };
  }

  if (message.action === "extractAllQuestionsFromDom") {
    return {
      text: extractAllQuestions()
    };
  }

  if (message.action === "copyTextToClipboard") {
    await copyTextToClipboard(message.text || "");

    showSmallStatus("Prompt skopiowany");

    return {
      ok: true
    };
  }

  return {
    text: ""
  };
});

function cleanText(text) {
  return String(text || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractCurrentQuestion() {
  const selectedText = cleanText(window.getSelection()?.toString());

  if (selectedText) {
    return selectedText;
  }

  const target = lastTarget || document.activeElement;

  if (!target) {
    return "Nie wykryto elementu. Kliknij lewym przyciskiem w pytanie albo odpowiedź i użyj skrótu ponownie.";
  }

  const questionBox = target.closest?.(".que");

  if (!questionBox) {
    return "Nie znaleziono kontenera pytania .que. Kliknij lewym przyciskiem bezpośrednio w treść pytania albo odpowiedź.";
  }

  return extractQuestionFromBox(questionBox);
}

function extractAllQuestions() {
  const moodleQuestions = [...document.querySelectorAll(".que")];

  if (moodleQuestions.length > 0) {
    const extracted = moodleQuestions
      .map((questionBox, index) => {
        const text = extractQuestionFromBox(questionBox);

        return cleanText(`
==============================
PYTANIE ${index + 1}
==============================

${text}
        `);
      })
      .filter(Boolean);

    return cleanText(extracted.join("\n\n"));
  }

  return extractGenericPageContent();
}

function extractQuestionFromBox(questionBox) {
  const numberText =
    questionBox.querySelector(".qno")?.innerText ||
    extractQuestionNumber(questionBox.innerText) ||
    "";

  const questionText =
    questionBox.querySelector(".qtext")?.innerText ||
    questionBox.querySelector(".content .text")?.innerText ||
    "";

  const answerRows = [...questionBox.querySelectorAll(".answer > div")];

  const answers = answerRows
    .map((row, index) => {
      const letter =
        row.querySelector(".answernumber")?.innerText?.trim() ||
        `${String.fromCharCode(97 + index)}.`;

      const answerLabel = row.querySelector("[data-region='answer-label']");

      const answerText = answerLabel
        ? answerLabel.innerText
        : row.innerText.replace(letter, "");

      return `${letter} ${cleanText(answerText)}`;
    })
    .filter((line) => cleanText(line).length > 2);

  const result = [
    cleanText(numberText),
    "",
    "Treść pytania:",
    cleanText(questionText),
    "",
    "Odpowiedzi:",
    ...answers
  ].join("\n");

  return cleanText(result);
}

function extractQuestionNumber(text) {
  const match = String(text || "").match(/Pytanie\s+\d+/i);
  return match ? match[0] : "";
}

function extractGenericPageContent() {
  const main =
    document.querySelector("main") ||
    document.querySelector("article") ||
    document.querySelector("[role='main']") ||
    document.body;

  const text = cleanText(main?.innerText || "");

  if (!text) {
    return "Nie znaleziono tekstu na stronie.";
  }

  return text.slice(0, 12000);
}

async function copyTextToClipboard(text) {
  await navigator.clipboard.writeText(text);
}

function showSmallStatus(message) {
  const old = document.getElementById("chatgpt-helper-small-status");

  if (old) {
    old.remove();
  }

  const box = document.createElement("div");
  box.id = "chatgpt-helper-small-status";
  box.textContent = message;

  box.style.position = "fixed";
  box.style.left = "12px";
  box.style.bottom = "12px";
  box.style.zIndex = "2147483647";
  box.style.background = "#111827";
  box.style.color = "#f9fafb";
  box.style.padding = "8px 10px";
  box.style.borderRadius = "6px";
  box.style.fontSize = "12px";
  box.style.fontFamily = "system-ui, sans-serif";
  box.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
  box.style.opacity = "0.9";

  document.documentElement.appendChild(box);

  setTimeout(() => {
    box.remove();
  }, 1000);
}