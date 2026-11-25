// Общие правила разбора Markdown для публичного рендера и редактора админки.
// Обе поверхности должны показывать текст одинаково, иначе редактор врёт.

// В Markdown нет подчёркивания и выделения. Используем короткие метки
// ++текст++ и ==текст==, а перед разбором превращаем их в ссылки, чтобы
// react-markdown не путал их с обычным текстом.
export function withRichMarks(content: string) {
  return content
    .replace(/\+\+([^\n]+?)\+\+/g, "[$1](kjar-underline)")
    .replace(/==([^\n]+?)==/g, "[$1](kjar-highlight)");
}

// Нумерованный список в Markdown начинается с пустой строки, иначе строка
// «2. …» остаётся частью абзаца. Разделяем список и текст пустой строкой.
export function withLists(content: string) {
  const lines = content.split("\n");
  const result: string[] = [];
  let inNumbered = false;
  let inFence = false;

  for (const line of lines) {
    if (/^```/.test(line.trim())) inFence = !inFence;
    const numbered = !inFence && /^\s{0,3}\d+[.)]\s+\S/.test(line);

    if (numbered && !inNumbered) {
      const previous = result[result.length - 1];
      if (previous !== undefined && previous.trim() !== "") result.push("");
    }

    if (
      !numbered &&
      inNumbered &&
      line.trim() !== "" &&
      !/^\s/.test(line) &&
      !inFence
    ) {
      result.push("");
    }

    result.push(line);
    inNumbered = numbered;
  }

  return result.join("\n");
}

// Ручные маркеры «1.1.», «•» и «!» люди набирают текстом, а не списком.
// Каждый такой блок должен стать отдельным абзацем, иначе красная строка
// достаётся только первой строке, а переносы прижимаются к маркеру.
export function withMarkedLines(content: string) {
  const lines = content.split("\n");
  const result: string[] = [];
  let inFence = false;

  for (const line of lines) {
    if (/^```/.test(line.trim())) inFence = !inFence;
    const marked =
      !inFence && /^\s{0,3}(?:\d+(?:\.\d+)+[.)]|[•·]|!)\s+\S/.test(line);
    if (marked && result.length > 0 && result[result.length - 1].trim() !== "") {
      result.push("");
    }
    result.push(line);
  }

  return result.join("\n");
}

export const REDLINE_OFF = ":::redline:off";

// Красная строка подходит не всем статьям. Служебная метка в начале
// Markdown выключает её для конкретной записи.
export function splitRedline(content: string) {
  const trimmed = content.replace(/^\s+/, "");
  if (trimmed.startsWith(REDLINE_OFF)) {
    return {
      redline: false,
      body: trimmed.slice(REDLINE_OFF.length).replace(/^\s*\n/, ""),
    };
  }
  return { redline: true, body: content };
}

export function composeRedline(redline: boolean, body: string) {
  return redline ? body : `${REDLINE_OFF}\n\n${body}`;
}
