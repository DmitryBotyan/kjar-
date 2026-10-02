"use client";

import { useCallback, useEffect, useState } from "react";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import { adminRequest, useAdminGuard } from "@/lib/useAdminGuard";
import { invalidateDictionary } from "@/lib/useDictionaries";
import type { DictionaryEntry, DictionaryGroup } from "@/lib/dictionaries";

// Подписи групп: сами значения редактируются, а состав групп задан кодом —
// под каждую есть поле в контенте и форма, которая её показывает.
const GROUPS: Array<{ key: DictionaryGroup; title: string; note: string }> = [
  {
    key: "character_role",
    title: "Роли кьяров",
    note: "Фильтр и сводка на странице колоды"
  },
  {
    key: "character_status",
    title: "Статусы кьяров",
    note: "Чип в карточке и фильтр колоды"
  },
  {
    key: "character_species",
    title: "Роды кьяров",
    note: "Фильтр «Род» и чип в карточке"
  },
  {
    key: "character_meter",
    title: "Базовые характеристики",
    note: "Кнопка «Базовый набор» в листе и порядок шкал"
  },
  {
    key: "character_kinship",
    title: "Родство",
    note: "Графа «Родственные связи». Значение «Потомок» уходит в «Потомство»"
  },
  { key: "event_type", title: "Типы ивентов", note: "Фильтр и чип на странице ивентов" },
  { key: "event_format", title: "Форматы ивентов", note: "Фильтр и чип формата" },
  {
    key: "participation_type",
    title: "Типы участия",
    note: "Фильтр «Участие» на странице ивентов"
  },
  { key: "article_era", title: "Эпохи", note: "Чипы и фильтр энциклопедии" },
  {
    key: "thread_category",
    title: "Разделы обсуждений",
    note: "Разделы общего стола и форма новой темы"
  },
  {
    key: "contact_request_type",
    title: "Типы обращений",
    note: "Выбор в форме связи и фильтр обращений"
  }
];

type Draft = { code: string; label: string; sortOrder: string };

const EMPTY_DRAFT: Draft = { code: "", label: "", sortOrder: "" };

export default function AdminDictionariesPage() {
  const { requireToken, handleError } = useAdminGuard();
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeGroup, setActiveGroup] = useState<DictionaryGroup>(GROUPS[0].key);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [deleteTarget, setDeleteTarget] = useState<DictionaryEntry | null>(null);

  const reload = useCallback(async () => {
    try {
      const body = await adminRequest<{ data: DictionaryEntry[] }>("/dictionaries/all");
      setEntries(body.data || []);
      setError(null);
    } catch (e) {
      setError(handleError(e, "Не удалось загрузить справочники"));
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    if (!requireToken()) return;
    reload();
  }, [requireToken, reload]);

  const current = entries.filter((entry) => entry.group === activeGroup);
  const currentGroup = GROUPS.find((group) => group.key === activeGroup)!;

  const mutate = async (action: () => Promise<unknown>) => {
    if (!requireToken()) return;
    setBusy(true);
    try {
      await action();
      // Формы кэшируют справочники в памяти вкладки — сбрасываем после правки
      invalidateDictionary();
      await reload();
      setError(null);
    } catch (e) {
      setError(handleError(e, "Не удалось сохранить"));
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = draft.code.trim();
    const label = draft.label.trim();
    if (!code || !label) return;

    // Шаг в 10 оставляет место, чтобы вставить значение между соседними
    const nextSort = draft.sortOrder.trim()
      ? Number(draft.sortOrder)
      : (current.reduce((max, entry) => Math.max(max, entry.sortOrder), 0) || 0) + 10;

    await mutate(() =>
      adminRequest("/dictionaries", {
        method: "POST",
        body: JSON.stringify({
          group: activeGroup,
          code,
          label,
          sortOrder: nextSort
        })
      })
    );
    setDraft(EMPTY_DRAFT);
  };

  const patch = (entry: DictionaryEntry, body: Record<string, unknown>) =>
    mutate(() =>
      adminRequest(`/dictionaries/${entry.id}`, {
        method: "PUT",
        body: JSON.stringify(body)
      })
    );

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await mutate(() =>
      adminRequest(`/dictionaries/${deleteTarget.id}`, { method: "DELETE" })
    );
    setDeleteTarget(null);
  };

  if (loading) {
    return (
      <div className="kjar-admin">
        <div className="kjar-admin__loading">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="kjar-admin">
      <div className="kjar-admin__header">
        <h1 className="kjar-admin__title">Справочники</h1>
      </div>

      <div className="kjar-admin__content">
        {error ? <div className="kjar-admin__error">{error}</div> : null}

        <div className="kjar-admin__chips">
          {GROUPS.map((group) => (
            <button
              key={group.key}
              type="button"
              className={`kjar-chip${
                group.key === activeGroup ? " kjar-chip--accent" : ""
              }`}
              onClick={() => {
                setActiveGroup(group.key);
                setDraft(EMPTY_DRAFT);
              }}
            >
              {group.title}
              <span className="kjar-admin__chip-count">
                {entries.filter((entry) => entry.group === group.key).length}
              </span>
            </button>
          ))}
        </div>

        <p className="kjar-admin__note">{currentGroup.note}</p>

        <div className="kjar-admin__table-wrap">
          <table className="kjar-admin__table">
            <thead>
              <tr>
                <th>Код</th>
                <th>Подпись</th>
                <th>Порядок</th>
                <th>Показывать</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {current.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <code>{entry.code}</code>
                  </td>
                  <td>
                    <input
                      className="kjar-input"
                      defaultValue={entry.label}
                      disabled={busy}
                      onBlur={(event) => {
                        const label = event.target.value.trim();
                        if (label && label !== entry.label) patch(entry, { label });
                      }}
                    />
                  </td>
                  <td>
                    <input
                      className="kjar-input kjar-input--narrow"
                      type="number"
                      defaultValue={entry.sortOrder}
                      disabled={busy}
                      onBlur={(event) => {
                        const sortOrder = Number(event.target.value);
                        if (!Number.isNaN(sortOrder) && sortOrder !== entry.sortOrder) {
                          patch(entry, { sortOrder });
                        }
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={entry.isActive}
                      disabled={busy}
                      onChange={(event) =>
                        patch(entry, { isActive: event.target.checked })
                      }
                    />
                  </td>
                  <td>
                    <div className="kjar-admin__actions">
                      <button
                        type="button"
                        className="kjar-admin__action-link kjar-admin__action-link--danger"
                        onClick={() => setDeleteTarget(entry)}
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {current.length === 0 && (
                <tr>
                  <td colSpan={5}>В этой группе пока нет значений</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form className="kjar-admin__inline-form" onSubmit={handleCreate}>
          <div className="kjar-field">
            <label className="kjar-label" htmlFor="dictionary-code">
              Код
            </label>
            <input
              className="kjar-input"
              id="dictionary-code"
              value={draft.code}
              disabled={busy}
              maxLength={100}
              placeholder="Записывается в материалы"
              onChange={(event) => setDraft({ ...draft, code: event.target.value })}
            />
          </div>

          <div className="kjar-field">
            <label className="kjar-label" htmlFor="dictionary-label">
              Подпись
            </label>
            <input
              className="kjar-input"
              id="dictionary-label"
              value={draft.label}
              disabled={busy}
              maxLength={200}
              placeholder="Видят посетители"
              onChange={(event) => setDraft({ ...draft, label: event.target.value })}
            />
          </div>

          <div className="kjar-field">
            <label className="kjar-label" htmlFor="dictionary-sort">
              Порядок
            </label>
            <input
              className="kjar-input kjar-input--narrow"
              id="dictionary-sort"
              type="number"
              value={draft.sortOrder}
              disabled={busy}
              placeholder="в конец"
              onChange={(event) => setDraft({ ...draft, sortOrder: event.target.value })}
            />
          </div>

          <button
            className="kjar-button kjar-button--primary"
            type="submit"
            disabled={busy || !draft.code.trim() || !draft.label.trim()}
          >
            Добавить
          </button>
        </form>

        <p className="kjar-admin__note">
          Код записывается в материалы и потому не меняется. Чтобы убрать значение
          из форм, не трогая уже заведённые материалы, снимите галочку «Показывать».
        </p>
      </div>

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Удалить значение?"
        message="Материалы с этим значением останутся, но на сайте оно будет показано кодом. Обычно достаточно снять галочку «Показывать»."
        itemName={deleteTarget?.label}
        loading={busy}
      />
    </div>
  );
}
