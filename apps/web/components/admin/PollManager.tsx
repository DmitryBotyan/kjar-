"use client";

import { useState, useEffect } from "react";
import { fetchFromAdminApi } from "@/lib/admin-api";
import { plural } from "@/lib/plural";

interface PollManagerProps {
  postId: number;
  eventFormat?: string | null;
}

interface PollOption {
  id?: number;
  text: string;
  votes?: number;
  percentage?: number | null;
}

interface Poll {
  id: number;
  postId: number;
  showPercentages: boolean;
  isEnded: boolean;
  allowMultiple: boolean;
  options: PollOption[];
  totalVotes?: number;
}

export default function PollManager({ postId, eventFormat }: PollManagerProps) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");

  useEffect(() => {
    if (eventFormat !== "poll") {
      setLoading(false);
      return;
    }

    loadPoll();
  }, [postId, eventFormat]);

  const loadPoll = async () => {
    try {
      const response = await fetch(`/api/polls/post/${postId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setPoll(data.data);
          setOptions(data.data.options.map((opt: PollOption) => opt.text));
        } else {
          setPoll(null);
        }
      } else {
        setPoll(null);
      }
    } catch (err) {
      console.error("Error loading poll:", err);
      setPoll(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePoll = async () => {
    if (options.length < 2) {
      setError("Добавьте минимум 2 варианта ответа");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetchFromAdminApi("/polls", {
        method: "POST",
        body: JSON.stringify({
          postId,
          options,
          showPercentages: false,
          isEnded: false,
          allowMultiple: false,
        }),
      });

      if (response) {
        await loadPoll();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка создания опроса");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePoll = async () => {
    if (!poll) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetchFromAdminApi(`/polls/post/${postId}`, {
        method: "PUT",
        body: JSON.stringify({
          showPercentages: poll.showPercentages,
          isEnded: poll.isEnded,
          allowMultiple: poll.allowMultiple,
          options: options.length > 0 ? options : undefined,
        }),
      });

      if (response) {
        await loadPoll();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка обновления опроса");
    } finally {
      setSaving(false);
    }
  };

  const addOption = () => {
    if (newOption.trim()) {
      setOptions([...options, newOption.trim()]);
      setNewOption("");
    }
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  if (eventFormat !== "poll") {
    return null;
  }

  if (loading) {
    return <p className="kjar-sheet__note">Загружаем опрос…</p>;
  }

  const flag = (key: "showPercentages" | "isEnded" | "allowMultiple", label: string) =>
    poll && (
      <label className="kjar-check">
        <input
          type="checkbox"
          checked={poll[key]}
          onChange={(event) => setPoll({ ...poll, [key]: event.target.checked })}
        />
        {label}
      </label>
    );

  return (
    <section className="kjar-sheet">
      <h3 className="kjar-sheet__title">Опрос</h3>

      {error && <div className="kjar-admin__error">{error}</div>}

      {!poll ? (
        <div className="kjar-sheet__block">
          <span className="kjar-label">Варианты ответов</span>
          <ul className="kjar-sheet__rows">
            {options.map((option, index) => (
              <li className="kjar-sheet__row kjar-sheet__row--option" key={index}>
                <input
                  type="text"
                  className="kjar-input"
                  aria-label={`Вариант ${index + 1}`}
                  value={option}
                  onChange={(event) => {
                    const next = [...options];
                    next[index] = event.target.value;
                    setOptions(next);
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="kjar-button kjar-button--danger"
                >
                  Убрать
                </button>
              </li>
            ))}
            <li className="kjar-sheet__row kjar-sheet__row--option">
              <input
                type="text"
                className="kjar-input"
                aria-label="Новый вариант"
                value={newOption}
                onChange={(event) => setNewOption(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addOption();
                  }
                }}
                placeholder="Новый вариант ответа"
              />
              <button
                type="button"
                onClick={addOption}
                className="kjar-button kjar-button--ghost"
                disabled={!newOption.trim()}
              >
                Добавить вариант
              </button>
            </li>
          </ul>

          <div className="kjar-form-actions">
            <button
              type="button"
              onClick={handleCreatePoll}
              disabled={saving || options.length < 2}
              className="kjar-button kjar-button--primary"
            >
              {saving ? "Создаём…" : "Создать опрос"}
            </button>
          </div>
        </div>
      ) : (
        <div className="kjar-sheet__block">
          {flag("showPercentages", "Показывать проценты до голосования")}
          {flag("isEnded", "Опрос завершён")}
          {flag("allowMultiple", "Можно выбрать несколько вариантов")}

          <span className="kjar-label">Варианты ответов</span>
          <ul className="kjar-sheet__rows">
            {poll.options.map((option, index) => (
              <li className="kjar-poll-admin__option" key={option.id || index}>
                <span>{option.text}</span>
                {poll.totalVotes !== undefined && (
                  <span className="kjar-poll-admin__votes">
                    {option.votes || 0} {plural(option.votes || 0, ["голос", "голоса", "голосов"])}
                    {poll.showPercentages && option.percentage != null && ` (${option.percentage}%)`}
                  </span>
                )}
              </li>
            ))}
          </ul>

          <div className="kjar-form-actions">
            <button
              type="button"
              onClick={handleUpdatePoll}
              disabled={saving}
              className="kjar-button kjar-button--primary"
            >
              {saving ? "Сохраняем…" : "Сохранить опрос"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
