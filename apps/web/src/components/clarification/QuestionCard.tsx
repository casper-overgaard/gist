"use client";

import { ClarificationQuestion } from "@signalboard/domain";
import { useSessionStore } from "@/store/useSessionStore";
import { useState } from "react";

interface QuestionCardProps {
  question: ClarificationQuestion;
  sessionId: string;
}

export default function QuestionCard({ question, sessionId }: QuestionCardProps) {
  const { answerQuestion } = useSessionStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [submitted, setSubmitted] = useState(question.status === "answered");

  const handleSubmit = async () => {
    if (submitted) return;

    let answerValue: string | string[];
    if (question.questionType === "free_text") {
      if (!freeText.trim()) return;
      answerValue = freeText.trim();
    } else if (question.questionType === "multi_select") {
      if (selected.length === 0) return;
      answerValue = selected;
    } else {
      if (selected.length === 0) return;
      answerValue = selected[0];
    }

    await answerQuestion(sessionId, {
      id: crypto.randomUUID(),
      questionId: question.id,
      sessionId,
      answerValue,
      createdAt: new Date().toISOString(),
    });

    setSubmitted(true);
  };

  const toggleOption = (opt: string) => {
    if (question.questionType === "single_select") {
      setSelected([opt]);
    } else {
      setSelected((prev) =>
        prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
      );
    }
  };

  if (submitted) {
    return (
      <div className="rounded border border-[rgba(255,255,255,0.06)] bg-sb-surface-1 p-3 opacity-50">
        <p className="text-xs text-sb-text-secondary leading-snug">{question.prompt}</p>
        <p className="text-[10px] tracking-[0.10em] uppercase text-sb-accent opacity-60 mt-2">
          Answered
        </p>
      </div>
    );
  }

  return (
    <div className="rounded border border-[rgba(255,255,255,0.08)] bg-sb-surface-1 p-3">
      <p className="text-xs text-sb-text-primary mb-3 leading-relaxed">{question.prompt}</p>

      {(question.questionType === "single_select" || question.questionType === "multi_select") && (
        <div className="flex flex-col gap-1.5 mb-3">
          {question.options?.map((opt) => (
            <button
              key={opt}
              onClick={() => toggleOption(opt)}
              className={`text-left text-xs px-3 py-2 rounded border transition-colors ${
                selected.includes(opt)
                  ? "border-[rgba(201,148,74,0.50)] bg-[rgba(201,148,74,0.10)] text-sb-accent"
                  : "border-[rgba(255,255,255,0.06)] bg-sb-base text-sb-text-secondary hover:border-[rgba(255,255,255,0.12)] hover:text-sb-text-primary"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {question.questionType === "free_text" && (
        <textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder="Type your answer…"
          className="w-full bg-sb-base border border-[rgba(255,255,255,0.08)] rounded px-3 py-2 text-xs text-sb-text-primary outline-none focus:border-[rgba(201,148,74,0.40)] placeholder-sb-text-muted resize-none mb-3 transition-colors"
          rows={3}
        />
      )}

      <button
        onClick={handleSubmit}
        className="text-[10px] tracking-[0.08em] uppercase px-3 py-1.5 bg-sb-accent text-sb-base rounded font-medium hover:opacity-90 transition-opacity"
      >
        Submit
      </button>
    </div>
  );
}
