"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
          // Заголовки
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
          // Параграфы
          p: ({ node, ...props }) => (
            <p className="kjar-markdown__p" {...props} />
          ),
          // Списки
          ul: ({ node, ...props }) => (
            <ul className="kjar-markdown__ul" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="kjar-markdown__ol" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="kjar-markdown__li" {...props} />
          ),
          // Ссылки
          a: ({ node, ...props }) => (
            <a className="kjar-markdown__a" {...props} />
          ),
          // Изображения
          img: ({ node, ...props }) => (
            <img className="kjar-markdown__img" {...props} />
          ),
          // Код
          code: ({ node, inline, ...props }: any) => {
            if (inline) {
              return <code className="kjar-markdown__code-inline" {...props} />;
            }
            return <code className="kjar-markdown__code-block" {...props} />;
          },
          pre: ({ node, ...props }) => (
            <pre className="kjar-markdown__pre" {...props} />
          ),
          // Блоки цитат
          blockquote: ({ node, ...props }) => (
            <blockquote className="kjar-markdown__blockquote" {...props} />
          ),
          // Горизонтальная линия
          hr: ({ node, ...props }) => (
            <hr className="kjar-markdown__hr" {...props} />
          ),
          // Таблицы
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
          // Выделение текста
          strong: ({ node, ...props }) => (
            <strong className="kjar-markdown__strong" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="kjar-markdown__em" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
