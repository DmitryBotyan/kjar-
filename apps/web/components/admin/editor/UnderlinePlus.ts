import type {
  JSONContent,
  MarkdownParseHelpers,
  MarkdownRendererHelpers,
  MarkdownToken,
} from "@tiptap/core";
import { Underline } from "@tiptap/extension-underline";

/**
 * Подчёркивание в статьях пишется как ++текст++: так его уже понимает
 * публичный рендер. Штатное расширение TipTap пишет <u>, поэтому
 * меняем только markdown-правила, не трогая поведение в документе.
 */
export const UnderlinePlus = Underline.extend({
  markdownTokenizer: {
    name: "underline",
    level: "inline",
    start(src: string) {
      return src.indexOf("++");
    },
    tokenize(src: string, _tokens: MarkdownToken[], helpers) {
      const match = /^(\+\+)([\s\S]+?)(\+\+)/.exec(src);
      if (!match) return;
      return {
        type: "underline",
        raw: match[0],
        text: match[2],
        tokens: helpers.inlineTokens(match[2]),
      };
    },
  },
  parseMarkdown: (token: MarkdownToken, helpers: MarkdownParseHelpers) =>
    helpers.applyMark("underline", helpers.parseInline(token.tokens || [])),
  renderMarkdown: (node: JSONContent, helpers: MarkdownRendererHelpers) =>
    `++${helpers.renderChildren(node)}++`,
});
