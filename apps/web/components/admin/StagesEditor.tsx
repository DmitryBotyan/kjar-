"use client";

import { Plus, Trash2 } from "lucide-react";
import MarkdownField from "./MarkdownField";

export type StageDraft = {
  stage: number;
  title: string;
  content: string;
  tasks: string;
};

type StagesEditorProps = {
  value: StageDraft[];
  onChange: (next: StageDraft[]) => void;
};

function renumber(rows: StageDraft[]): StageDraft[] {
  return rows.map((row, index) => ({ ...row, stage: index + 1 }));
}

export default function StagesEditor({ value, onChange }: StagesEditorProps) {
  const update = (index: number, patch: Partial<StageDraft>) => {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const remove = (index: number) => {
    onChange(renumber(value.filter((_, i) => i !== index)));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(renumber(next));
  };

  return (
    <div className="kjar-sheet">
      <div className="kjar-sheet__block">
        <h2 className="kjar-sheet__title">Этапы ивента</h2>
        <p className="kjar-sheet__note">
          Этапы показываются на странице ивента по порядку. В текст этапа можно
          вставить ссылку, фото, опрос и следующее задание.
        </p>

        {value.map((stage, index) => (
          <div className="kjar-stage-editor" key={index}>
            <div className="kjar-stage-editor__head">
              <strong>Этап {stage.stage}</strong>
              <div className="kjar-admin__actions">
                <button
                  type="button"
                  className="kjar-admin__action-link"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                >
                  Выше
                </button>
                <button
                  type="button"
                  className="kjar-admin__action-link"
                  onClick={() => move(index, 1)}
                  disabled={index === value.length - 1}
                >
                  Ниже
                </button>
                <button
                  type="button"
                  className="kjar-admin__action-link kjar-admin__action-link--danger"
                  onClick={() => remove(index)}
                >
                  <Trash2 aria-hidden="true" /> Удалить
                </button>
              </div>
            </div>

            <div className="kjar-field">
              <label className="kjar-label" htmlFor={`stage-title-${index}`}>
                Название этапа
              </label>
              <input
                className="kjar-input"
                id={`stage-title-${index}`}
                value={stage.title}
                onChange={(event) => update(index, { title: event.target.value })}
              />
            </div>

            <MarkdownField
              id={`stage-content-${index}`}
              name={`stage-content-${index}`}
              label="Текст этапа"
              folder="events"
              rows={8}
              value={stage.content}
              onChange={(next) => update(index, { content: next })}
              note="Ссылки, фото и разметка сохраняются. Пустая строка начинает новый абзац."
            />

            <div className="kjar-field">
              <label className="kjar-label" htmlFor={`stage-tasks-${index}`}>
                Задания, по одному на строку
              </label>
              <textarea
                className="kjar-textarea"
                id={`stage-tasks-${index}`}
                rows={4}
                value={stage.tasks}
                onChange={(event) => update(index, { tasks: event.target.value })}
              />
            </div>
          </div>
        ))}

        <div className="kjar-form-actions">
          <button
            type="button"
            className="kjar-button"
            onClick={() =>
              onChange(
                renumber([
                  ...value,
                  { stage: value.length + 1, title: "", content: "", tasks: "" }
                ])
              )
            }
          >
            <Plus aria-hidden="true" /> Добавить этап
          </button>
        </div>
      </div>
    </div>
  );
}