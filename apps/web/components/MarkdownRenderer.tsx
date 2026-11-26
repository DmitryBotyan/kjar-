"use client";

import { Children, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  splitRedline,
  withLists,
  withMarkedLines,
  withRichMarks,
} from "@/lib/markdown";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  variant?: "article" | "ref";
}

export default function MarkdownRenderer({
  content,
  className = "",
  variant = "article",
}: MarkdownRendererProps) {
  const { redline, body } = splitRedline(content);
  const [zoomed, setZoomed] = useState<string | null>(null);
  const showRedline =
    variant === "ref" ? redline !== false : redline === true;
  const processed =
    variant === "ref"
      ? withMarkedLines(withLists(withRichMarks(body)))
      : withLists(withRichMarks(body));

  return (
    <div className={`kjar-markdown${showRedline ? "" : " kjar-markdown--no-redline"} ${className}`}>
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

            if (variant === "ref" && typeof first === "string") {
              const marker = first.match(/^(\d+(?:\.\d+)+[.)]|[•·]|!)\s+/);
              if (marker) {
                return (
                  <p
                    className="kjar-markdown__p kjar-markdown__p--marked"
                    {...props}
                  >
                    <span className="kjar-markdown__marker">{marker[1]}</span>
                    <span className="kjar-markdown__marked-body">
                      {first.slice(marker[0].length)}
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
          img: ({ node, src, alt, ...props }) => (
            <img
              className="kjar-markdown__img"
              src={src}
              alt={alt}
              loading="lazy"
              onClick={() => src && setZoomed(src)}
              {...props}
            />
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
        {processed}
      </ReactMarkdown>
      {zoomed ? (
        <div
          className="kjar-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр картинки"
          onClick={() => setZoomed(null)}
        >
          <img className="kjar-lightbox__img" src={zoomed} alt="" />
          <button
            type="button"
            className="kjar-lightbox__close"
            onClick={() => setZoomed(null)}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
      ) : null}
    </div>
  );
}
