import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const MARKER = /^(?:\d+(?:\.\d+)+[.)]|[•·]|!)\s/;

/**
 * Ручные маркеры «1.1.», «•» и «!» набраны текстом, а не списком.
 * Помечаем такие абзацы классом, чтобы CSS дал им висячий отступ:
 * маркер стоит слева, перенос строки остаётся под текстом.
 */
export const MarkedParagraph = Extension.create({
  name: "markedParagraph",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("markedParagraph"),
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];
            state.doc.descendants((node, pos) => {
              if (node.type.name !== "paragraph") return;
              if (MARKER.test(node.textContent)) {
                decorations.push(
                  Decoration.node(pos, pos + node.nodeSize, {
                    class: "kjar-md-editor__marked",
                  }),
                );
              }
            });
            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});
