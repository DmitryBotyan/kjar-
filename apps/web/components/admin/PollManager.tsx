"use client";

import { useState, useEffect } from "react";
import { fetchFromAdminApi } from "@/lib/admin-api";

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
    return <div>Загрузка опроса...</div>;
  }

  return (
    <div className="kjar-field" style={{ marginTop: "24px", padding: "20px", border: "1px solid var(--line)", borderRadius: "6px" }}>
      <h3 style={{ marginTop: 0, marginBottom: "16px" }}>Управление опросом</h3>

      {error && (
        <div style={{ marginBottom: "12px", color: "#d32f2f", fontSize: "14px" }}>
          {error}
        </div>
      )}

      {!poll ? (
        <div>
          <div className="kjar-field">
            <label className="kjar-label">Варианты ответов</label>
            {options.map((option, index) => (
              <div key={index} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <input
                  type="text"
                  className="kjar-input"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[index] = e.target.value;
                    setOptions(newOptions);
                  }}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="kjar-button kjar-button--ghost"
                  style={{ color: "#d32f2f" }}
                >
                  Удалить
                </button>
              </div>
            ))}
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <input
                type="text"
                className="kjar-input"
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addOption();
                  }
                }}
                placeholder="Добавить вариант ответа"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={addOption}
                className="kjar-button kjar-button--ghost"
                disabled={!newOption.trim()}
              >
                Добавить
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreatePoll}
            disabled={saving || options.length < 2}
            className="kjar-button"
            style={{ marginTop: "16px" }}
          >
            {saving ? "Создание..." : "Создать опрос"}
          </button>
        </div>
      ) : (
        <div>
          <div className="kjar-field">
            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                checked={poll.showPercentages}
                onChange={(e) =>
                  setPoll({ ...poll, showPercentages: e.target.checked })
                }
              />
              <span>Показывать проценты</span>
            </label>
          </div>

          <div className="kjar-field">
            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                checked={poll.isEnded}
                onChange={(e) => setPoll({ ...poll, isEnded: e.target.checked })}
              />
              <span>Опрос завершен</span>
            </label>
          </div>

          <div className="kjar-field">
            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                checked={poll.allowMultiple}
                onChange={(e) =>
                  setPoll({ ...poll, allowMultiple: e.target.checked })
                }
              />
              <span>Разрешить выбор нескольких вариантов</span>
            </label>
          </div>

          <div className="kjar-field" style={{ marginTop: "16px" }}>
            <label className="kjar-label">Варианты ответов</label>
            {poll.options.map((option, index) => (
              <div
                key={option.id || index}
                style={{
                  padding: "12px",
                  marginBottom: "8px",
                  border: "1px solid var(--line)",
                  borderRadius: "4px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{option.text}</span>
                {poll.totalVotes !== undefined && (
                  <span style={{ color: "var(--muted)", fontSize: "14px" }}>
                    {option.votes || 0} голосов
                    {poll.showPercentages && option.percentage !== null && (
                      <span> ({option.percentage}%)</span>
                    )}
                  </span>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleUpdatePoll}
            disabled={saving}
            className="kjar-button"
            style={{ marginTop: "16px" }}
          >
            {saving ? "Сохранение..." : "Сохранить изменения"}
          </button>
        </div>
      )}
    </div>
  );
}
