"use client";

import { Children } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// В Markdown нет подчёркивания и выделения. Пишем их короткими метками
// ++текст++ и ==текст==, а перед разбором превращаем в ссылки с особым
// адресом: так внутри работает любой другой Markdown, включая курсив.
function withRichMarks(content: string) {
  return content
    .replace(/\+\+([^\n]+?)\+\+/g, "[$1](kjar-underline)")
    .replace(/==([^\n]+?)==/g, "[$1](kjar-highlight)");
}

// Нумерованный список распознаётся, только если перед ним есть пустая строка.
// Без этого строки вида «2. ...» слипаются с абзацем и публикуются простым
// текстом. Разделяем список и соседний текст пустыми строками.
function withLists(content: string) {
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

// Подпункты вида «1.1.» пишут отдельными строками без пустой строки между
// ними. Если оставить их в одном абзаце, красная строка достаётся только
// первому номеру, а остальные прижимаются к левому краю. Разделяем каждый
// подпункт на свой абзац: так у него будет собственный висячий отступ.
function withSubitems(content: string) {
  const lines = content.split("\n");
  const result: string[] = [];
  let inFence = false;

  for (const line of lines) {
    if (/^```/.test(line.trim())) inFence = !inFence;
    const subitem = !inFence && /^\s{0,3}\d+(?:\.\d+)+[.)]\s+\S/.test(line);

    if (subitem) {
      const previous = result[result.length - 1];
      if (previous !== undefined && previous.trim() !== "") result.push("");
    }

    result.push(line);
  }

  return result.join("\n");
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  return (
    <div className={`kjar-markdown ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="kjar-markdown__h1" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="kjar-markdown__h2" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="kjar-markdown__h3" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="kjar-markdown__h4" {...props} />
          ),
          h5: ({ node, ...props }) => (
            <h5 className="kjar-markdown__h5" {...props} />
          ),
          h6: ({ node, ...props }) => (
            <h6 className="kjar-markdown__h6" {...props} />
          ),
          p: ({ node, children, ...props }) => {
            const parts = Children.toArray(children);
            const first = parts[0];

            if (typeof first === "string") {
              const subitem = first.match(/^(\d+(?:\.\d+)+[.)])\s+/);
              if (subitem) {
                return (
                  <p
                    className="kjar-markdown__p kjar-markdown__p--subitem"
                    {...props}
                  >
                    <span className="kjar-markdown__subnum">
                      {subitem[1]}
                    </span>
                    <span className="kjar-markdown__subbody">
                      {first.slice(subitem[0].length)}
                      {parts.slice(1)}
                    </span>
                  </p>
                );
              }
            }

            return (
              <p className="kjar-markdown__p" {...props}>
                {children}
              </p>
            );
          },
          ul: ({ node, ...props }) => (
            <ul className="kjar-markdown__ul" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="kjar-markdown__ol" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="kjar-markdown__li" {...props} />
          ),
          a: ({ node, href, children, ...props }) => {
            if (href === "kjar-underline") {
              return <u className="kjar-markdown__u">{children}</u>;
            }
            if (href === "kjar-highlight") {
              return <mark className="kjar-markdown__mark">{children}</mark>;
            }
            return (
              <a className="kjar-markdown__a" href={href} {...props}>
                {children}
              </a>
            );
          },
          img: ({ node, ...props }) => (
            <img className="kjar-markdown__img" {...props} />
          ),
          // react-markdown 9 не сообщает, строчный ли код: блок узнаётся по
          // обёртке pre, и стили для него заданы через .kjar-markdown__pre code
          code: ({ node, ...props }) => (
            <code className="kjar-markdown__code-inline" {...props} />
          ),
          pre: ({ node, ...props }) => (
            <pre className="kjar-markdown__pre" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="kjar-markdown__blockquote" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="kjar-markdown__hr" {...props} />
          ),
          table: ({ node, ...props }) => (
            <table className="kjar-markdown__table" {...props} />
          ),
          thead: ({ node, ...props }) => (
            <thead className="kjar-markdown__thead" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="kjar-markdown__tbody" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="kjar-markdown__tr" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="kjar-markdown__th" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="kjar-markdown__td" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="kjar-markdown__strong" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="kjar-markdown__em" {...props} />
          ),
        }}
      >
        {withSubitems(withLists(withRichMarks(content)))}
      </ReactMarkdown>
    </div>
  );
}
