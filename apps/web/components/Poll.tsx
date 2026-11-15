"use client";

import { useState, useEffect } from "react";
import { plural } from "@/lib/plural";

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
// случайный идентификатор, по нему считается «уже голосовал»
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
    return <p className="kjar-poll__loading">Загружаем опрос…</p>;
  }

  if (!poll) {
    return null;
  }

  const showResults = hasVoted || poll.isEnded || poll.showPercentages;
  const canVote = !poll.isEnded && !hasVoted;

  return (
    <section className="kjar-poll" aria-label="Опрос">
      <h3 className="kjar-poll__title">Опрос</h3>

      {error && <div className="kjar-comments__error">{error}</div>}

      {poll.isEnded && <p className="kjar-poll__ended">Опрос завершён</p>}

      <ul className="kjar-poll__options">
        {poll.options.map((option) => {
          const isSelected = votedOptionId === option.id;
          const percentage = showResults && option.percentage != null ? option.percentage : null;
          const votes = showResults ? option.votes || 0 : null;

          return (
            <li
              key={option.id}
              className={`kjar-poll__option${isSelected ? " kjar-poll__option--chosen" : ""}`}
            >
              {canVote ? (
                <button
                  type="button"
                  className="kjar-poll__vote"
                  onClick={() => handleVote(option.id)}
                  disabled={voting}
                >
                  {option.text}
                </button>
              ) : (
                <div className="kjar-poll__result">
                  <span>{option.text}</span>
                  {showResults && (
                    <span className="kjar-poll__numbers">
                      {votes !== null && (
                        <span className="kjar-poll__votes">
                          {votes} {plural(votes, ["голос", "голоса", "голосов"])}
                        </span>
                      )}
                      {percentage !== null && (
                        <span className="kjar-poll__percent">{percentage}%</span>
                      )}
                    </span>
                  )}
                </div>
              )}

              {percentage !== null && (
                <span className="kjar-poll__bar" style={{ width: `${percentage}%` }} />
              )}
            </li>
          );
        })}
      </ul>

      {poll.totalVotes !== undefined && showResults && (
        <p className="kjar-poll__total">Всего голосов: {poll.totalVotes}</p>
      )}
    </section>
  );
}
