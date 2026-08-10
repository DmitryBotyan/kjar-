"use client";

import { useState, useEffect } from "react";

interface PollOption {
  id: number;
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

interface PollProps {
  postId: number;
}

// Ключ голосующего: опрос открыт гостям, поэтому браузер держит у себя
// случайный идентификатор — по нему считается «уже голосовал»
const VOTER_KEY_STORAGE = "pollVoterKey";

function getVoterKey(): string {
  let key = localStorage.getItem(VOTER_KEY_STORAGE);
  if (!key) {
    key = crypto.randomUUID().replace(/-/g, "");
    localStorage.setItem(VOTER_KEY_STORAGE, key);
  }
  return key;
}

export default function Poll({ postId }: PollProps) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedOptionId, setVotedOptionId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPoll();
    checkVote();
  }, [postId]);

  const loadPoll = async () => {
    try {
      const response = await fetch(`/api/polls/post/${postId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setPoll(data.data);
        }
      }
    } catch (err) {
      console.error("Error loading poll:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkVote = async () => {
    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch(
        `/api/polls/post/${postId}/vote?voterKey=${encodeURIComponent(getVoterKey())}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (response.ok) {
        const data = await response.json();
        setHasVoted(data.data.hasVoted);
        setVotedOptionId(data.data.votedOptionId);
      }
    } catch (err) {
      console.error("Error checking vote:", err);
    }
  };

  const handleVote = async (optionId: number) => {
    const token = localStorage.getItem("authToken");

    if (poll?.isEnded) {
      setError("Опрос завершен");
      return;
    }

    if (hasVoted && !poll?.allowMultiple) {
      setError("Вы уже проголосовали");
      return;
    }

    setVoting(true);
    setError(null);

    try {
      const response = await fetch(`/api/polls/post/${postId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ optionId, voterKey: getVoterKey() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Ошибка голосования");
      }

      const data = await response.json();
      setPoll(data.data);
      setHasVoted(true);
      setVotedOptionId(optionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка голосования");
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return <div>Загрузка опроса...</div>;
  }

  if (!poll) {
    return null;
  }

  const showResults = hasVoted || poll.isEnded || poll.showPercentages;

  return (
    <div
      className="kjar-poll"
      style={{
        margin: "24px 0",
        padding: "20px",
        border: "1px solid var(--line)",
        borderRadius: "6px",
        background: "var(--surface)",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "16px" }}>Опрос</h3>

      {error && (
        <div className="kjar-comments__error">
          {error}
        </div>
      )}

      {poll.isEnded && (
        <div
          style={{
            marginBottom: "12px",
            padding: "8px 12px",
            background: "color-mix(in srgb, var(--muted) 20%, transparent)",
            border: "1px solid var(--muted)",
            borderRadius: "4px",
            color: "var(--muted)",
            fontSize: "14px",
          }}
        >
          Опрос завершен
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {poll.options.map((option) => {
          const isSelected = votedOptionId === option.id;
          const percentage = showResults && option.percentage !== null ? option.percentage : null;
          const votes = showResults ? option.votes || 0 : null;

          return (
            <div
              key={option.id}
              style={{
                position: "relative",
                border: "1px solid var(--line)",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              {!poll.isEnded && !hasVoted ? (
                <button
                  type="button"
                  onClick={() => handleVote(option.id)}
                  disabled={voting}
                  className="kjar-button kjar-button--ghost"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    textAlign: "left",
                    justifyContent: "flex-start",
                    background: isSelected
                      ? "color-mix(in srgb, var(--accent) 20%, transparent)"
                      : "transparent",
                    border: "none",
                    cursor: voting ? "not-allowed" : "pointer",
                  }}
                >
                  {option.text}
                </button>
              ) : (
                <div
                  style={{
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: isSelected
                      ? "color-mix(in srgb, var(--accent) 20%, transparent)"
                      : "transparent",
                  }}
                >
                  <span>{option.text}</span>
                  {showResults && (
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      {votes !== null && (
                        <span style={{ color: "var(--muted)", fontSize: "14px" }}>
                          {votes} {votes === 1 ? "голос" : votes < 5 ? "голоса" : "голосов"}
                        </span>
                      )}
                      {percentage !== null && (
                        <span
                          style={{
                            color: "var(--accent)",
                            fontSize: "16px",
                            fontWeight: 600,
                            minWidth: "50px",
                            textAlign: "right",
                          }}
                        >
                          {percentage}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {showResults && percentage !== null && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    height: "4px",
                    width: `${percentage}%`,
                    background: "var(--accent)",
                    transition: "width 0.3s ease",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {poll.totalVotes !== undefined && showResults && (
        <div
          style={{
            marginTop: "12px",
            paddingTop: "12px",
            borderTop: "1px solid var(--line)",
            color: "var(--muted)",
            fontSize: "14px",
            textAlign: "center",
          }}
        >
          Всего голосов: {poll.totalVotes}
        </div>
      )}
    </div>
  );
}
